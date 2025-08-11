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




// @desc    Obtener todos los usuarios (admin), usuarios del hospital (formador)
//         o alumnos de la sociedad (instructor)
// @route   GET /api/users
// @access  Private/Admin|Formador|Coordinador|Instructor
exports.getUsers = async (req, res, next) => {
  try {
    let users;

    if (req.user.rol === 'administrador') {
      users = await User.find().populate('hospital').populate('sociedad');
    } else if (req.user.rol === 'formador') {
      const query = {
        hospital: req.user.hospital,
        rol: { $ne: 'administrador' }
      };
      if (req.user.especialidad && req.user.especialidad !== 'ALL') {
        query.especialidad = req.user.especialidad;
      }
      users = await User.find(query)
        .populate('hospital')
        .populate('sociedad');
    } else if (req.user.rol === 'coordinador') {
      const hospitales = await Hospital.find({ zona: req.user.zona }).select('_id');
      const ids = hospitales.map(h => h._id);
      users = await User.find({
        hospital: { $in: ids },
        rol: { $in: ['residente', 'formador'] },
        tipo: 'Programa Residentes'
      })
        .populate('hospital')
        .populate('sociedad');
    } else if (req.user.rol === 'instructor') {
      users = await User.find({
        sociedad: req.user.sociedad,
        rol: 'alumno'
      })
        .populate('hospital')
        .populate('sociedad');
    } else {
      return next(new ErrorResponse('No autorizado para ver usuarios', 403));
    }

    const usersWithFlag = await Promise.all(
      users.map(async (u) => {
        const obj = u.toObject();
        if (u.rol === 'residente' || u.rol === 'alumno') {
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
    const {
      nombre,
      apellidos,
      email,
      password,
      rol,
      tipo,
      hospital,
      sociedad,
      especialidad,
      zona
    } = req.body;
    const hospitalId = hospital || undefined;
    let especialidadVal;
    const tipoVal = rol === 'administrador' ? undefined : tipo;
    const sociedadId =
      tipoVal === 'Programa Sociedades' ? sociedad || undefined : undefined;
    let zonaVal = zona || undefined;

    const rolesValidos = [
      'residente',
      'formador',
      'administrador',
      'alumno',
      'instructor',
      'coordinador'
    ];
    if (!rolesValidos.includes(rol)) {
      return next(new ErrorResponse('Rol inválido', 400));
    }

    // Verificar combinaciones válidas de rol y tipo de programa
    if (
      tipo === 'Programa Residentes' &&
      !['residente', 'formador', 'administrador', 'coordinador'].includes(rol)
    ) {
      return next(new ErrorResponse('Rol inválido para el programa', 400));
    }

    if (
      tipo === 'Programa Sociedades' &&
      !['alumno', 'instructor', 'administrador'].includes(rol)
    ) {
      return next(new ErrorResponse('Rol inválido para el programa', 400));
    }


    if (
      rol !== 'administrador' &&
      !['Programa Residentes', 'Programa Sociedades'].includes(tipoVal)
    ) {
      return next(new ErrorResponse('Tipo de programa inválido', 400));
    }

    if ((rol === 'residente' || rol === 'formador') && !hospital) {
      return next(new ErrorResponse('Se requiere un hospital para este rol', 400));
    }

    if (hospital) {
      const hosp = await Hospital.findById(hospital);
      if (!hosp) {
        return next(new ErrorResponse('Hospital no encontrado', 404));
      }
      zonaVal = hosp.zona;
    }

    if (rol === 'coordinador' && !zonaVal) {
      return next(new ErrorResponse('Zona requerida para el rol coordinador', 400));
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

  if (rol === 'formador') {
      if (!especialidad) {
        return next(
          new ErrorResponse('Especialidad requerida para el rol formador', 400)
        );
      }
      especialidadVal = especialidad;
    } else if (rol === 'residente') {
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
      zona: zonaVal,
      activo: true,
      consentimientoDatos: true,
      fechaRegistro: Date.now()
    });

    if (rol === 'residente' || rol === 'alumno') {
      await inicializarProgresoFormativo(nuevoUsuario);
    }

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
      .populate('sociedad');

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
    const { password, ...updateData } = req.body;
    const hospitalId = updateData.hospital || undefined;
    let zonaVal = updateData.zona || undefined;
    const currentUser = await User.findById(req.params.id);
    if (!currentUser) {
      return next(
        new ErrorResponse(`Usuario no encontrado con id ${req.params.id}`, 404)
      );
    }

    if (req.user.rol === 'instructor') {
      if (
        currentUser.rol !== 'alumno' ||
        !currentUser.sociedad ||
        currentUser.sociedad.toString() !== req.user.sociedad.toString()
      ) {
        return next(
          new ErrorResponse('No autorizado para modificar este usuario', 403)
        );
      }
      if (updateData.rol && updateData.rol !== 'alumno') {
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

    if (newRol === 'administrador') {
      updateData.tipo = undefined;
    }

    if (
      newTipo === 'Programa Residentes' &&
      !['residente', 'formador', 'administrador', 'coordinador'].includes(newRol)
    ) {
      return next(new ErrorResponse('Rol inválido para el programa', 400));
    }

    if (
      newTipo === 'Programa Sociedades' &&
      !['alumno', 'instructor', 'administrador'].includes(newRol)
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

    if (newRol === 'coordinador' && !zonaVal) {
      return next(new ErrorResponse('Zona requerida para el rol coordinador', 400));
    }

    if (newRol === 'formador') {
      especialidadVal =
        especialidadInput || (roleChanged ? undefined : currentUser.especialidad);
      if (!especialidadVal) {
        return next(
          new ErrorResponse('Especialidad requerida para el rol formador', 400)
        );
      }
    } else if (newRol === 'residente') {
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

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('hospital')
      .populate('sociedad');

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
    ).populate('hospital');

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

    if (req.user.rol === 'instructor') {
      if (
        user.rol !== 'alumno' ||
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

    if (req.user.rol === 'instructor') {
      if (rol !== 'alumno') {
        return next(
          new ErrorResponse('Los instructores solo pueden invitar alumnos', 403)
        );
      }
      if (
        !req.user.sociedad ||
        (sociedad && sociedad.toString() !== req.user.sociedad.toString())
      ) {
        return next(
          new ErrorResponse(
            'No autorizado para invitar alumnos de otra sociedad',
            403
          )
        );
      }
    }

    if ((rol === 'alumno' || rol === 'instructor') && !sociedad) {
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
    if ((rol === 'residente' || rol === 'formador') && !hospital) {
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

// @desc    Obtener residentes asignados a un formador
// @route   GET /api/users/formador/:id/residentes
// @access  Private/Admin,Formador
exports.getFormadorResidentes = async (req, res, next) => {
  try {
    const formador = await User.findById(req.params.id).populate('hospital');

    if (!formador) {
      return next(new ErrorResponse(`Formador no encontrado con id ${req.params.id}`, 404));
    }

    if (formador.rol !== 'formador') {
      return next(new ErrorResponse(`El usuario con id ${req.params.id} no es un formador`, 400));
    }

    if (req.user.rol === 'coordinador' && formador.hospital.zona !== req.user.zona) {
      return next(new ErrorResponse('No autorizado para ver residentes de otra zona', 403));
    }

    // Obtener residentes del mismo hospital que el formador
    const filtrosResidentes = {
      hospital: formador.hospital,
      rol: 'residente'
    };
    if (formador.especialidad && formador.especialidad !== 'ALL') {
      filtrosResidentes.especialidad = formador.especialidad;
    }
    const residentes = await User.find(filtrosResidentes)
      .populate('hospital')
      .populate('sociedad');

    res.status(200).json({
      success: true,
      count: residentes.length,
      data: residentes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener formadores de un residente
// @route   GET /api/users/residente/:id/formadores
// @access  Private/Admin,Residente
exports.getResidenteFormadores = async (req, res, next) => {
  try {
    const residente = await User.findById(req.params.id).populate('hospital');

    if (!residente) {
      return next(new ErrorResponse(`Residente no encontrado con id ${req.params.id}`, 404));
    }

    if (residente.rol !== 'residente') {
      return next(new ErrorResponse(`El usuario con id ${req.params.id} no es un residente`, 400));
    }

    if (req.user.rol === 'coordinador' && residente.hospital.zona !== req.user.zona) {
      return next(new ErrorResponse('No autorizado para ver formadores de otra zona', 403));
    }

    // Obtener formadores del mismo hospital que el residente
    const filtrosFormadores = {
      hospital: residente.hospital,
      rol: 'formador'
    };
    if (req.user.rol === 'formador' && req.user.especialidad && req.user.especialidad !== 'ALL') {
      filtrosFormadores.especialidad = req.user.especialidad;
    }
    const formadores = await User.find(filtrosFormadores)
      .populate('hospital')
      .populate('sociedad');

    res.status(200).json({
      success: true,
      count: formadores.length,
      data: formadores
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener alumnos de un instructor
// @route   GET /api/users/instructor/:id/alumnos
// @access  Private/Admin,Instructor
exports.getInstructorAlumnos = async (req, res, next) => {
  try {
    const instructor = await User.findById(req.params.id).populate('sociedad');

    if (!instructor) {
      return next(
        new ErrorResponse(`Instructor no encontrado con id ${req.params.id}`, 404)
      );
    }

    if (instructor.rol !== 'instructor') {
      return next(
        new ErrorResponse(`El usuario con id ${req.params.id} no es un instructor`, 400)
      );
    }

    if (
      req.user.rol === 'instructor' &&
      req.user._id.toString() !== instructor._id.toString()
    ) {
      return next(
        new ErrorResponse('No autorizado para ver alumnos de otro instructor', 403)
      );
    }

    const alumnos = await User.find({
      sociedad: instructor.sociedad,
      rol: 'alumno',
      tipo: instructor.tipo,
    }).populate('sociedad');

    res.status(200).json({
      success: true,
      count: alumnos.length,
      data: alumnos,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUsersByHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;

    if (req.user.rol === 'coordinador') {
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
    if (req.user.rol === 'formador') {
      query.rol = 'residente';
      if (req.user.especialidad && req.user.especialidad !== 'ALL') {
        query.especialidad = req.user.especialidad;
      }
    } else if (req.user.rol === 'coordinador') {
      query.rol = { $in: ['residente', 'formador'] };
    }

    const users = await User.find(query)
      .populate('hospital')
      .populate('sociedad');

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
