// userController.js COMPLETO CON INICIALIZACIÓN DEL PROGRESO
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Invitacion = require('../models/Invitacion');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { createAuditLog } = require('../utils/auditLog');
const ProgresoResidente = require('../models/ProgresoResidente');
const Sociedades = require('../models/Sociedades');
const { inicializarProgresoFormativo } = require('../utils/initProgreso');
const { Role } = require('../utils/roles');

const legacyRoles = {
  formador: Role.TUTOR,
  coordinador: Role.CSM,
  instructor: Role.PROFESOR,
  alumno: Role.PARTICIPANTE
};




// @desc    Obtener todos los usuarios (admin), usuarios del hospital (tutor)
//         o participantes de la sociedad (profesor)
// @route   GET /api/users
// @access  Private/Admin|Tutor|CSM|Profesor
exports.getUsers = async (req, res, next) => {
  try {
    let users;

    if (req.user.rol === Role.ADMINISTRADOR) {
      users = await User.find()
        .populate('hospital')
        .populate('sociedad')
        .populate('tutor', 'nombre apellidos');
    } else if (req.user.rol === Role.TUTOR) {
      const query = {
        hospital: req.user.hospital,
        rol: { $ne: Role.ADMINISTRADOR }
      };
      if (req.user.especialidad && req.user.especialidad !== 'ALL') {
        query.especialidad = req.user.especialidad;
      }
      users = await User.find(query)
        .populate('hospital')
        .populate('sociedad')
        .populate('tutor', 'nombre apellidos');
    } else if (req.user.rol === Role.CSM) {
      const hospitales = await Hospital.find({ zona: req.user.zona }).select('_id');
      const ids = hospitales.map(h => h._id);
      users = await User.find({
        hospital: { $in: ids },
        rol: { $in: [Role.RESIDENTE, Role.TUTOR] },
        tipo: 'Programa Residentes'
      })
        .populate('hospital')
        .populate('sociedad')
        .populate('tutor', 'nombre apellidos');
    } else if (req.user.rol === Role.PROFESOR) {
      users = await User.find({
        sociedad: req.user.sociedad,
        rol: Role.PARTICIPANTE
      })
        .populate('hospital')
        .populate('sociedad')
        .populate('tutor', 'nombre apellidos');
    } else {
      return next(new ErrorResponse('No autorizado para ver usuarios', 403));
    }

    const usersWithFlag = await Promise.all(
      users.map(async (u) => {
        const obj = u.toObject();
        if (u.rol === Role.RESIDENTE || u.rol === Role.PARTICIPANTE) {
          const existe = await ProgresoResidente.exists({ residente: u._id });
          obj.tieneProgreso = !!existe;
        }
        return obj;
      })
    );

    res.status(200).json({
      success: true,
      count: usersWithFlag.length,
      data: usersWithFlag
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Crear un usuario desde administración
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    let {
      nombre,
      apellidos,
      email,
      password,
      rol,
      tipo,
      hospital,
      sociedad,
      especialidad,
      zona,
      tutor
    } = req.body;
    rol = legacyRoles[rol] || rol;
    req.body.rol = rol;
    const hospitalId = hospital || undefined;
    let especialidadVal;
    const tipoVal = rol === Role.ADMINISTRADOR ? undefined : tipo;
    const sociedadId =
      tipoVal === 'Programa Sociedades' ? sociedad || undefined : undefined;
    let zonaVal = zona || undefined;

    const rolesValidos = [
      Role.RESIDENTE,
      Role.TUTOR,
      Role.ADMINISTRADOR,
      Role.PARTICIPANTE,
      Role.PROFESOR,
      Role.CSM
    ];
    if (!rolesValidos.includes(rol)) {
      return next(new ErrorResponse('Rol inválido', 400));
    }

    // Verificar combinaciones válidas de rol y tipo de programa
    if (
      tipo === 'Programa Residentes' &&
      ![Role.RESIDENTE, Role.TUTOR, Role.ADMINISTRADOR, Role.CSM].includes(rol)
    ) {
      return next(new ErrorResponse('Rol inválido para el programa', 400));
    }

    if (
      tipo === 'Programa Sociedades' &&
      ![Role.PARTICIPANTE, Role.PROFESOR, Role.ADMINISTRADOR].includes(rol)
    ) {
      return next(new ErrorResponse('Rol inválido para el programa', 400));
    }


    if (
      rol !== Role.ADMINISTRADOR &&
      !['Programa Residentes', 'Programa Sociedades'].includes(tipoVal)
    ) {
      return next(new ErrorResponse('Tipo de programa inválido', 400));
    }

    if ((rol === Role.RESIDENTE || rol === Role.TUTOR) && !hospital) {
      return next(new ErrorResponse('Se requiere un hospital para este rol', 400));
    }

    if (hospital) {
      const hosp = await Hospital.findById(hospital);
      if (!hosp) {
        return next(new ErrorResponse('Hospital no encontrado', 404));
      }
      zonaVal = hosp.zona;
    }

    if (rol === Role.CSM && !zonaVal) {
      return next(new ErrorResponse('Zona requerida para el rol csm', 400));
    }

    if (tipoVal === 'Programa Sociedades') {
      if (!sociedad) {
        return next(new ErrorResponse('Sociedad requerida', 400));
      }

      const soc = await Sociedades.findOne({ _id: sociedad, status: 'ACTIVO' });
      if (!soc) {
        return next(new ErrorResponse('Sociedad no válida o inactiva', 400));
      }
    }

  if (rol === Role.TUTOR) {
      if (!especialidad) {
        return next(
          new ErrorResponse('Especialidad requerida para el rol tutor', 400)
        );
      }
      especialidadVal = especialidad;
    } else if (rol === Role.RESIDENTE) {
      if (especialidad === 'ALL') {
        return next(
          new ErrorResponse(
            'La especialidad no puede ser ALL para residente',
            400
          )
        );
      }
      especialidadVal = especialidad || undefined;
    } else {
      especialidadVal = undefined;
    }

    const tutorId =
      rol === Role.RESIDENTE
        ? await resolveTutor(tutor || 'ALL', hospitalId, especialidadVal)
        : null;

    const nuevoUsuario = await User.create({
      nombre,
      apellidos,
      email,
      password,
      rol,
      tipo: tipoVal,
      hospital: hospitalId,
      sociedad: sociedadId,
      especialidad: especialidadVal,
      tutor: tutorId,
      zona: zonaVal,
      activo: true,
      consentimientoDatos: true,
      fechaRegistro: Date.now()
    });

    if (rol === Role.RESIDENTE || rol === Role.PARTICIPANTE) {
      await inicializarProgresoFormativo(nuevoUsuario);
    }

    await nuevoUsuario.populate('hospital');
    await nuevoUsuario.populate('sociedad');
    await nuevoUsuario.populate('tutor', 'nombre apellidos');

    await createAuditLog({
      usuario: req.user._id,
      accion: 'crear_usuario',
      descripcion: `Usuario creado: ${nuevoUsuario.email}`,
      ip: req.ip
    });

    res.status(201).json({ success: true, data: nuevoUsuario });
  } catch (err) {
    next(err);
  }
};

// Resto del código permanece igual...

// @desc    Obtener un usuario específico
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('hospital')
      .populate('sociedad')
      .populate('tutor', 'nombre apellidos');

    if (!user) {
      return next(new ErrorResponse(`Usuario no encontrado con id ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar un usuario
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    // Eliminar campos que no deben ser actualizados por esta ruta
    const { password, tutor: tutorInput, ...updateData } = req.body;
    if (updateData.rol) {
      updateData.rol = legacyRoles[updateData.rol] || updateData.rol;
      req.body.rol = updateData.rol;
    }
    const hospitalId = updateData.hospital || undefined;
    let zonaVal = updateData.zona || undefined;
    const currentUser = await User.findById(req.params.id);
    if (!currentUser) {
      return next(
        new ErrorResponse(`Usuario no encontrado con id ${req.params.id}`, 404)
      );
    }

    if (req.user.rol === Role.PROFESOR) {
      if (
        currentUser.rol !== Role.PARTICIPANTE ||
        !currentUser.sociedad ||
        currentUser.sociedad.toString() !== req.user.sociedad.toString()
      ) {
        return next(
          new ErrorResponse('No autorizado para modificar este usuario', 403)
        );
      }
      if (updateData.rol && updateData.rol !== Role.PARTICIPANTE) {
        return next(
          new ErrorResponse('No autorizado para cambiar el rol del usuario', 403)
        );
      }
      if (
        updateData.sociedad &&
        updateData.sociedad.toString() !== req.user.sociedad.toString()
      ) {
        return next(
          new ErrorResponse('No autorizado para cambiar la sociedad', 403)
        );
      }
      updateData.sociedad = req.user.sociedad;
    }

    const newTipo = updateData.tipo || currentUser.tipo;
    const newRol = updateData.rol || currentUser.rol;
    const roleChanged = newRol !== currentUser.rol;
    const especialidadInput = updateData.especialidad;
    let especialidadVal;

    if (newTipo === 'Programa Residentes') {
      updateData.sociedad = null;
    }
    const sociedadId =
      newTipo === 'Programa Sociedades' ? updateData.sociedad || undefined : undefined;

    if (newRol === Role.ADMINISTRADOR) {
      updateData.tipo = undefined;
    }

    if (
      newTipo === 'Programa Residentes' &&
      ![Role.RESIDENTE, Role.TUTOR, Role.ADMINISTRADOR, Role.CSM].includes(newRol)
    ) {
      return next(new ErrorResponse('Rol inválido para el programa', 400));
    }

    if (
      newTipo === 'Programa Sociedades' &&
      ![Role.PARTICIPANTE, Role.PROFESOR, Role.ADMINISTRADOR].includes(newRol)
    ) {
      return next(new ErrorResponse('Rol inválido para el programa', 400));
    }

    if (hospitalId) {
      const hosp = await Hospital.findById(hospitalId);
      if (!hosp) {
        return next(new ErrorResponse('Hospital no encontrado', 404));
      }
      zonaVal = hosp.zona;
    }

    if (newRol === Role.CSM && !zonaVal) {
      return next(new ErrorResponse('Zona requerida para el rol csm', 400));
    }

    if (newRol === Role.TUTOR) {
      especialidadVal =
        especialidadInput || (roleChanged ? undefined : currentUser.especialidad);
      if (!especialidadVal) {
        return next(
          new ErrorResponse('Especialidad requerida para el rol tutor', 400)
        );
      }
    } else if (newRol === Role.RESIDENTE) {
      if (roleChanged) {
        especialidadVal = especialidadInput;
      } else {
        especialidadVal =
          especialidadInput !== undefined
            ? especialidadInput
            : currentUser.especialidad;
      }
      if (especialidadVal === 'ALL') {
        return next(
          new ErrorResponse(
            'La especialidad no puede ser ALL para residente',
            400
          )
        );
      }
    } else {
      especialidadVal = undefined;
    }

    updateData.hospital = hospitalId;
    updateData.especialidad = especialidadVal;
    updateData.sociedad = sociedadId;
    updateData.zona = zonaVal;

    if (newRol === Role.RESIDENTE) {
      let tutorVal = tutorInput;
      if (!tutorVal) {
        const hId = hospitalId || currentUser.hospital;
        tutorVal = await resolveTutor({ hospital: hId, especialidad: especialidadVal });
      }
      updateData.tutor = tutorVal;
    } else if (roleChanged) {
      updateData.tutor = undefined;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('hospital')
      .populate('sociedad')
      .populate('tutor', 'nombre apellidos');

    if (!user) {
      return next(new ErrorResponse(`Usuario no encontrado con id ${req.params.id}`, 404));
    }
    
    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'actualizar_usuario',
      descripcion: `Usuario actualizado: ${user.email}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Activar/Desactivar un usuario
// @route   PUT /api/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      return next(new ErrorResponse('El estado debe ser un valor booleano', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { activo },
      {
        new: true,
        runValidators: true
      }
    )
      .populate('hospital')
      .populate('tutor', 'nombre apellidos');

    if (!user) {
      return next(new ErrorResponse(`Usuario no encontrado con id ${req.params.id}`, 404));
    }
    
    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: activo ? 'activar_usuario' : 'desactivar_usuario',
      descripcion: `Usuario ${activo ? 'activado' : 'desactivado'}: ${user.email}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar contraseña de un usuario
// @route   PUT /api/users/:id/password
// @access  Private/Admin
exports.updateUserPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse(`Usuario no encontrado con id ${req.params.id}`, 404));
    }

    user.password = req.body.password;
    await user.save();

    await createAuditLog({
      usuario: req.user._id,
      accion: 'actualizar_password_usuario',
      descripcion: `Contraseña actualizada para usuario: ${user.email}`,
      ip: req.ip
    });

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Eliminar un usuario y su progreso
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse(`Usuario no encontrado con id ${req.params.id}`, 404));
    }

    if (req.user.rol === Role.PROFESOR) {
      if (
        user.rol !== Role.PARTICIPANTE ||
        !user.sociedad ||
        user.sociedad.toString() !== req.user.sociedad.toString()
      ) {
        return next(
          new ErrorResponse('No autorizado para eliminar este usuario', 403)
        );
      }
    }

    await ProgresoResidente.deleteMany({ residente: req.params.id });

    await user.remove();

    await createAuditLog({
      usuario: req.user._id,
      accion: 'eliminar_usuario',
      descripcion: `Usuario eliminado: ${user.email}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};


// @desc    Invitar a un nuevo usuario
// @route   POST /api/users/invite
// @access  Private/Admin
exports.inviteUser = async (req, res, next) => {
  try {
    const { email, rol, hospital, sociedad } = req.body;

    if (req.user.rol === Role.PROFESOR) {
      if (rol !== Role.PARTICIPANTE) {
        return next(
          new ErrorResponse('Los profesores solo pueden invitar participantes', 403)
        );
      }
      if (
        !req.user.sociedad ||
        (sociedad && sociedad.toString() !== req.user.sociedad.toString())
      ) {
        return next(
          new ErrorResponse(
            'No autorizado para invitar participantes de otra sociedad',
            403
          )
        );
      }
    }

    if ((rol === Role.PARTICIPANTE || rol === Role.PROFESOR) && !sociedad) {
      return next(new ErrorResponse('Se requiere una sociedad para este rol', 400));
    }

    // Verificar si el email ya está registrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('El email ya está registrado', 400));
    }

    // Verificar si ya existe una invitación pendiente para este email
    const existingInvitation = await Invitacion.findOne({ 
      email, 
      estado: 'pendiente' 
    });
    
    if (existingInvitation) {
      return next(new ErrorResponse('Ya existe una invitación pendiente para este email', 400));
    }

    // Verificar hospital si el rol es residente o formador
    if ((rol === Role.RESIDENTE || rol === Role.TUTOR) && !hospital) {
      return next(new ErrorResponse('Se requiere un hospital para este rol', 400));
    }

    if (hospital) {
      const hospitalExists = await Hospital.findById(hospital);
      if (!hospitalExists) {
        return next(new ErrorResponse('Hospital no encontrado', 404));
      }
    }

    // Generar token
    const token = crypto.randomBytes(20).toString('hex');

    // Crear invitación
    const invitacion = await Invitacion.create({
      email,
      rol,
      hospital,
      sociedad: sociedad || req.user.sociedad,
      token,
      fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      admin: req.user.id
    });

    // Crear URL de registro
    const registerUrl = `${req.protocol}://${req.get('host')}/register/${token}`;

    // Preparar mensaje de email
    const message = `
      Ha sido invitado a unirse a la plataforma de formación en tecnologías del robot da Vinci.
      
      Por favor, utilice el siguiente enlace para completar su registro:
      
      ${registerUrl}
      
      Este enlace expirará en 7 días.
    `;

    try {
      await sendEmail({
        email: invitacion.email,
        subject: 'Invitación a la plataforma de formación da Vinci',
        message
      });
      
      // Crear registro de auditoría
      await createAuditLog({
        usuario: req.user._id,
        accion: 'invitar_usuario',
        descripcion: `Invitación enviada a: ${email} con rol: ${rol}`,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        data: invitacion
      });
    } catch (err) {
      console.log(err);
      
      // Eliminar la invitación si no se pudo enviar el email
      await Invitacion.findByIdAndRemove(invitacion._id);
      
      return next(new ErrorResponse('No se pudo enviar el email de invitación', 500));
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener ALL las invitaciones
// @route   GET /api/users/invitations
// @access  Private/Admin
exports.getInvitations = async (req, res, next) => {
  try {
    const invitations = await Invitacion.find()
      .populate('hospital')
      .populate('admin');

    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancelar una invitación
// @route   DELETE /api/users/invitations/:id
// @access  Private/Admin
exports.cancelInvitation = async (req, res, next) => {
  try {
    const invitation = await Invitacion.findById(req.params.id);

    if (!invitation) {
      return next(new ErrorResponse(`Invitación no encontrada con id ${req.params.id}`, 404));
    }

    await invitation.remove();
    
    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'cancelar_invitacion',
      descripcion: `Invitación cancelada para: ${invitation.email}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener residentes asignados a un tutor
// @route   GET /api/users/tutor/:id/residentes
// @access  Private/Admin,Tutor
exports.getTutorResidentes = async (req, res, next) => {
  try {
    const tutor = await User.findById(req.params.id)
      .populate('hospital')
      .populate('tutor', 'nombre apellidos');

    if (!tutor) {
      return next(new ErrorResponse(`Tutor no encontrado con id ${req.params.id}`, 404));
    }

    if (tutor.rol !== Role.TUTOR) {
      return next(new ErrorResponse(`El usuario con id ${req.params.id} no es un tutor`, 400));
    }

    if (req.user.rol === Role.CSM && tutor.hospital.zona !== req.user.zona) {
      return next(new ErrorResponse('No autorizado para ver residentes de otra zona', 403));
    }

    // Obtener residentes del mismo hospital que el tutor
    const filtrosResidentes = {
      hospital: tutor.hospital,
      rol: Role.RESIDENTE
    };
    if (tutor.especialidad && tutor.especialidad !== 'ALL') {
      filtrosResidentes.especialidad = tutor.especialidad;
    }
    const residentes = await User.find(filtrosResidentes)
      .populate('hospital')
      .populate('sociedad')
      .populate('tutor', 'nombre apellidos');

    res.status(200).json({
      success: true,
      count: residentes.length,
      data: residentes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener tutores de un residente
// @route   GET /api/users/residente/:id/tutores
// @access  Private/Admin,Residente
exports.getResidenteTutores = async (req, res, next) => {
  try {
    const residente = await User.findById(req.params.id)
      .populate('hospital')
      .populate('tutor', 'nombre apellidos');

    if (!residente) {
      return next(new ErrorResponse(`Residente no encontrado con id ${req.params.id}`, 404));
    }

    if (residente.rol !== Role.RESIDENTE) {
      return next(new ErrorResponse(`El usuario con id ${req.params.id} no es un residente`, 400));
    }

    if (req.user.rol === Role.CSM && residente.hospital.zona !== req.user.zona) {
      return next(new ErrorResponse('No autorizado para ver tutores de otra zona', 403));
    }

    // Obtener tutores del mismo hospital que el residente
    const filtrosTutores = {
      hospital: residente.hospital,
      rol: Role.TUTOR
    };
    if (req.user.rol === Role.TUTOR && req.user.especialidad && req.user.especialidad !== 'ALL') {
      filtrosTutores.especialidad = req.user.especialidad;
    }
    const tutores = await User.find(filtrosTutores)
      .populate('hospital')
      .populate('sociedad')
      .populate('tutor', 'nombre apellidos');

    res.status(200).json({
      success: true,
      count: tutores.length,
      data: tutores
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener tutores disponibles filtrados por hospital y especialidad
// @route   GET /api/users/tutores
// @access  Private/Admin|CSM|Tutor
exports.getAvailableTutors = async (req, res, next) => {
  try {
    const { hospital, especialidad } = req.query;
    if (!hospital || !especialidad) {
      return next(new ErrorResponse('Hospital y especialidad requeridos', 400));
    }
    const query = { rol: Role.TUTOR, hospital };
    if (especialidad !== 'ALL') {
      query.$or = [{ especialidad }, { especialidad: 'ALL' }];
    }
    const tutores = await User.find(query)
      .populate('hospital')
      .populate('sociedad')
      .populate('tutor', 'nombre apellidos');
    res.status(200).json({
      success: true,
      count: tutores.length,
      data: tutores,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener participantes de un profesor
// @route   GET /api/users/profesor/:id/participantes
// @access  Private/Admin,Profesor
exports.getProfesorParticipantes = async (req, res, next) => {
  try {
    const profesor = await User.findById(req.params.id)
      .populate('sociedad')
      .populate('tutor', 'nombre apellidos');

    if (!profesor) {
      return next(
        new ErrorResponse(`Profesor no encontrado con id ${req.params.id}`, 404)
      );
    }

    if (profesor.rol !== Role.PROFESOR) {
      return next(
        new ErrorResponse(`El usuario con id ${req.params.id} no es un profesor`, 400)
      );
    }

    if (
      req.user.rol === Role.PROFESOR &&
      req.user._id.toString() !== profesor._id.toString()
    ) {
      return next(
        new ErrorResponse('No autorizado para ver participantes de otro profesor', 403)
      );
    }

    const participantes = await User.find({
      sociedad: profesor.sociedad,
      rol: Role.PARTICIPANTE,
      tipo: profesor.tipo,
    })
      .populate('sociedad')
      .populate('tutor', 'nombre apellidos');

    res.status(200).json({
      success: true,
      count: participantes.length,
      data: participantes,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUsersByHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;

    if (req.user.rol === Role.CSM) {
      const hosp = await Hospital.findById(hospitalId);
      if (!hosp || hosp.zona !== req.user.zona) {
        return res.status(403).json({ success: false, error: 'No autorizado' });
      }
    }

    let query = {
      hospital: hospitalId,
      tipo: req.user.tipo,
      _id: { $ne: req.user._id }
    };
    if (req.user.rol === Role.TUTOR) {
      query.rol = Role.RESIDENTE;
      if (req.user.especialidad && req.user.especialidad !== 'ALL') {
        query.especialidad = req.user.especialidad;
      }
    } else if (req.user.rol === Role.CSM) {
      query.rol = { $in: [Role.RESIDENTE, Role.TUTOR] };
    }

    const users = await User.find(query)
      .populate('hospital')
      .populate('sociedad')
      .populate('tutor', 'nombre apellidos');

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios del hospital',
    });
  }
};
