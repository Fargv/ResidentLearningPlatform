// userController.js COMPLETO CON INICIALIZACIÓN DEL PROGRESO
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Invitacion = require('../models/Invitacion');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { createAuditLog } = require('../utils/auditLog');
const ProgresoResidente = require('../models/ProgresoResidente');




// @desc    Obtener todos los usuarios (admin) o usuarios del hospital (formador)
// @route   GET /api/users
// @access  Private/Admin|Formador
exports.getUsers = async (req, res, next) => {
  try {
    let users;

    if (req.user.rol === 'administrador') {
      users = await User.find().populate('hospital').populate('sociedad');
    } else if (req.user.rol === 'formador') {
      users = await User.find({ hospital: req.user.hospital })
        .populate('hospital')
        .populate('sociedad');
    } else {
      return next(new ErrorResponse('No autorizado para ver usuarios', 403));
    }

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
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

// @desc    Eliminar un usuario y su progreso
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse(`Usuario no encontrado con id ${req.params.id}`, 404));
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
    const { email, rol, hospital } = req.body;

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

// @desc    Obtener todas las invitaciones
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
    const formador = await User.findById(req.params.id);

    if (!formador) {
      return next(new ErrorResponse(`Formador no encontrado con id ${req.params.id}`, 404));
    }

    if (formador.rol !== 'formador') {
      return next(new ErrorResponse(`El usuario con id ${req.params.id} no es un formador`, 400));
    }

    // Obtener residentes del mismo hospital que el formador
    const residentes = await User.find({
      hospital: formador.hospital,
      rol: 'residente'
    })
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
    const residente = await User.findById(req.params.id);

    if (!residente) {
      return next(new ErrorResponse(`Residente no encontrado con id ${req.params.id}`, 404));
    }

    if (residente.rol !== 'residente') {
      return next(new ErrorResponse(`El usuario con id ${req.params.id} no es un residente`, 400));
    }

    // Obtener formadores del mismo hospital que el residente
    const formadores = await User.find({
      hospital: residente.hospital,
      rol: 'formador'
    })
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

exports.getUsersByHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;

    const users = await User.find({ hospital: hospitalId })
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
