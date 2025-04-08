const ErrorResponse = require('../utils/errorResponse');
const Notificacion = require('../models/Notificacion');
const { createAuditLog } = require('../utils/auditLog');

// @desc    Obtener notificaciones del usuario actual
// @route   GET /api/notificaciones
// @access  Private
exports.getNotificacionesUsuario = async (req, res, next) => {
  try {
    const notificaciones = await Notificacion.find({ usuario: req.user.id })
      .sort('-fechaCreacion');

    res.status(200).json({
      success: true,
      count: notificaciones.length,
      data: notificaciones
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener notificaciones no leídas del usuario actual
// @route   GET /api/notificaciones/no-leidas
// @access  Private
exports.getNotificacionesNoLeidas = async (req, res, next) => {
  try {
    const notificaciones = await Notificacion.find({ 
      usuario: req.user.id,
      leida: false
    }).sort('-fechaCreacion');

    res.status(200).json({
      success: true,
      count: notificaciones.length,
      data: notificaciones
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Marcar notificación como leída
// @route   PUT /api/notificaciones/:id/leer
// @access  Private
exports.marcarComoLeida = async (req, res, next) => {
  try {
    let notificacion = await Notificacion.findById(req.params.id);

    if (!notificacion) {
      return next(new ErrorResponse(`Notificación no encontrada con id ${req.params.id}`, 404));
    }

    // Verificar que la notificación pertenece al usuario
    if (notificacion.usuario.toString() !== req.user.id) {
      return next(new ErrorResponse('No autorizado para acceder a esta notificación', 403));
    }

    await notificacion.marcarComoLeida();
    
    notificacion = await Notificacion.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: notificacion
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Marcar todas las notificaciones como leídas
// @route   PUT /api/notificaciones/leer-todas
// @access  Private
exports.marcarTodasComoLeidas = async (req, res, next) => {
  try {
    await Notificacion.updateMany(
      { usuario: req.user.id, leida: false },
      { leida: true }
    );
    
    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'marcar_notificaciones_leidas',
      descripcion: 'Todas las notificaciones marcadas como leídas',
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

// @desc    Eliminar una notificación
// @route   DELETE /api/notificaciones/:id
// @access  Private
exports.eliminarNotificacion = async (req, res, next) => {
  try {
    const notificacion = await Notificacion.findById(req.params.id);

    if (!notificacion) {
      return next(new ErrorResponse(`Notificación no encontrada con id ${req.params.id}`, 404));
    }

    // Verificar que la notificación pertenece al usuario
    if (notificacion.usuario.toString() !== req.user.id) {
      return next(new ErrorResponse('No autorizado para eliminar esta notificación', 403));
    }

    await notificacion.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Crear una notificación (para uso interno)
// @access  Private
exports.crearNotificacion = async (datos) => {
  try {
    const notificacion = await Notificacion.create(datos);
    return notificacion;
  } catch (err) {
    console.error('Error al crear notificación:', err);
    return null;
  }
};
