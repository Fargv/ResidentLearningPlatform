const ErrorResponse = require('../utils/errorResponse');
const FaseSoc = require('../models/FaseSoc');
const ActividadSoc = require('../models/ActividadSoc');
const ProgresoResidente = require('../models/ProgresoResidente');
const { createAuditLog } = require('../utils/auditLog');

// @desc    Obtener todas las fases
// @route   GET /api/fases
// @access  Private
exports.getFases = async (req, res, next) => {
  try {
    const fases = await FaseSoc.find().sort('orden');

    res.status(200).json({
      success: true,
      count: fases.length,
      data: fases
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener una fase específica
// @route   GET /api/fases/:id
// @access  Private
exports.getFase = async (req, res, next) => {
  try {
    const fase = await FaseSoc.findById(req.params.id);

    if (!fase) {
      return next(new ErrorResponse(`Fase no encontrada con id ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: fase
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Crear una nueva fase
// @route   POST /api/fases
// @access  Private/Admin
exports.createFase = async (req, res, next) => {
  try {
    if (req.body.orden === undefined || req.body.orden === null) {
      req.body.orden = req.body.numero;
    }
    const fase = await FaseSoc.create(req.body);
    
    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'crear_fase',
      descripcion: `Fase creada: ${fase.nombre}`,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      data: fase
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar una fase
// @route   PUT /api/fases/:id
// @access  Private/Admin
exports.updateFase = async (req, res, next) => {
  try {
    let fase = await FaseSoc.findById(req.params.id);

    if (!fase) {
      return next(new ErrorResponse(`Fase no encontrada con id ${req.params.id}`, 404));
    }

    fase = await FaseSoc.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'actualizar_fase',
      descripcion: `Fase actualizada: ${fase.nombre}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: fase
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Eliminar una fase
// @route   DELETE /api/fases/:id
// @access  Private/Admin
exports.deleteFase = async (req, res, next) => {
  try {
    const fase = await FaseSoc.findById(req.params.id);

    if (!fase) {
      return next(new ErrorResponse(`Fase no encontrada con id ${req.params.id}`, 404));
    }

    // Verificar si hay actividades asociadas a la fase
    const actividadesCount = await ActividadSoc.countDocuments({ fase: req.params.id });
    
    if (actividadesCount > 0) {
      return next(new ErrorResponse(`No se puede eliminar la fase porque tiene ${actividadesCount} actividades asociadas`, 400));
    }

    const deleteResult = await ProgresoResidente.deleteMany({
      fase: req.params.id,
      estadoGeneral: { $ne: 'validado' }
    });

    const preservedCount = await ProgresoResidente.countDocuments({
      fase: req.params.id,
      estadoGeneral: 'validado'
    });

    await fase.remove();
    
    await createAuditLog({
      usuario: req.user._id,
      accion: 'eliminar_fase',
      descripcion: `Fase eliminada: ${fase.nombre}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      removedCount: deleteResult.deletedCount || 0,
      preservedCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener actividades de una fase
// @route   GET /api/fases/:id/actividades
// @access  Private
exports.getFaseActividades = async (req, res, next) => {
  try {
    const fase = await FaseSoc.findById(req.params.id);

    if (!fase) {
      return next(new ErrorResponse(`Fase no encontrada con id ${req.params.id}`, 404));
    }

    const actividades = await ActividadSoc.find({ fase: req.params.id }).sort('orden');

    res.status(200).json({
      success: true,
      count: actividades.length,
      data: actividades
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reordenar fases
// @route   PUT /api/fases/reorder
// @access  Private/Admin
exports.reorderFases = async (req, res, next) => {
  try {
    const { ordenFases } = req.body;
    
    if (!ordenFases || !Array.isArray(ordenFases)) {
      return next(new ErrorResponse('Se requiere un array de ordenFases', 400));
    }
    
    // Verificar que todos los IDs existen
    for (const item of ordenFases) {
      if (!item.id || !item.orden) {
        return next(new ErrorResponse('Cada elemento debe tener id y orden', 400));
      }
      
      const fase = await FaseSoc.findById(item.id);
      if (!fase) {
        return next(new ErrorResponse(`Fase no encontrada con id ${item.id}`, 404));
      }
    }
    
    // Actualizar el orden de cada fase
    const updatePromises = ordenFases.map(item => {
      return FaseSoc.findByIdAndUpdate(item.id, { orden: item.orden });
    });
    
    await Promise.all(updatePromises);
    
    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'reordenar_fases',
      descripcion: 'Fases reordenadas',
      ip: req.ip
    });
    
    // Obtener las fases actualizadas
    const fases = await FaseSoc.find().sort('orden');
    
    res.status(200).json({
      success: true,
      data: fases
    });
  } catch (err) {
    next(err);
  }
};
