const ErrorResponse = require('../utils/errorResponse');
const ActividadSoc = require('../models/ActividadSoc');
const FaseSoc = require('../models/FaseSoc');
const ProgresoResidente = require('../models/ProgresoResidente');
const { createAuditLog } = require('../utils/auditLog');

// @desc    Obtener todas las actividades
// @route   GET /api/actividades
// @access  Private
exports.getActividades = async (req, res, next) => {
  try {
    const actividades = await ActividadSoc.find().populate('fase').sort('orden');

    res.status(200).json({
      success: true,
      count: actividades.length,
      data: actividades
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener una actividad específica
// @route   GET /api/actividades/:id
// @access  Private
exports.getActividad = async (req, res, next) => {
  try {
    const actividad = await ActividadSoc.findById(req.params.id).populate('fase');

    if (!actividad) {
      return next(new ErrorResponse(`Actividad no encontrada con id ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: actividad
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Crear una nueva actividad
// @route   POST /api/actividades
// @access  Private/Admin
exports.createActividad = async (req, res, next) => {
  try {
    // Verificar que la fase existe
    const fase = await FaseSoc.findById(req.body.fase);
    if (!fase) {
      return next(new ErrorResponse(`Fase no encontrada con id ${req.body.fase}`, 404));
    }

    const actividad = await ActividadSoc.create(req.body);
    
    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'crear_actividad',
      descripcion: `Actividad creada: ${actividad.nombre}`,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      data: actividad
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar una actividad
// @route   PUT /api/actividades/:id
// @access  Private/Admin
exports.updateActividad = async (req, res, next) => {
  try {
    let actividad = await ActividadSoc.findById(req.params.id);

    if (!actividad) {
      return next(new ErrorResponse(`Actividad no encontrada con id ${req.params.id}`, 404));
    }

    const tipoAnterior = actividad.tipo;

    // Si se está cambiando la fase, verificar que existe
    if (req.body.fase && req.body.fase !== actividad.fase.toString()) {
      const fase = await FaseSoc.findById(req.body.fase);
      if (!fase) {
        return next(new ErrorResponse(`Fase no encontrada con id ${req.body.fase}`, 404));
      }
    }

    actividad = await ActividadSoc.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('fase');

    let progresosActualizados = 0;
    if (req.body.tipo && req.body.tipo !== tipoAnterior) {
      const updateResult = await ProgresoResidente.updateMany(
        { 'actividades.actividad': req.params.id },
        { $set: { 'actividades.$[elem].tipo': req.body.tipo } },
        { arrayFilters: [{ 'elem.actividad': req.params.id }] }
      );
      progresosActualizados = updateResult.modifiedCount;
    }

    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'actualizar_actividad',
      descripcion: `Actividad actualizada: ${actividad.nombre}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: actividad,
      progresosActualizados
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Eliminar una actividad
// @route   DELETE /api/actividades/:id
// @access  Private/Admin
exports.deleteActividad = async (req, res, next) => {
  try {
    const actividad = await ActividadSoc.findById(req.params.id);

    if (!actividad) {
      return next(new ErrorResponse('Actividad no encontrada', 404));
    }

   // Eliminar actividad de los progresos que la contengan y no esté validada
    const updateResult = await ProgresoResidente.updateMany(
      { 'actividades.actividad': req.params.id },
      { $pull: { actividades: { actividad: req.params.id, estado: { $ne: 'validado' } } } }
    );

    // Luego eliminar la actividad
    await actividad.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      mensaje: `Actividad eliminada y ${updateResult.modifiedCount} progresos actualizados`
    });
  } catch (err) {
    next(err);
  }
};


// @desc    Reordenar actividades
// @route   PUT /api/actividades/reorder
// @access  Private/Admin
exports.reorderActividades = async (req, res, next) => {
  try {
    const { ordenActividades } = req.body;
    
    if (!ordenActividades || !Array.isArray(ordenActividades)) {
      return next(new ErrorResponse('Se requiere un array de ordenActividades', 400));
    }
    
    // Verificar que todos los IDs existen
    for (const item of ordenActividades) {
      if (!item.id || !item.orden) {
        return next(new ErrorResponse('Cada elemento debe tener id y orden', 400));
      }
      
      const actividad = await ActividadSoc.findById(item.id);
      if (!actividad) {
        return next(new ErrorResponse(`Actividad no encontrada con id ${item.id}`, 404));
      }
    }
    
    // Actualizar el orden de cada actividad
    const updatePromises = ordenActividades.map(item => {
      return ActividadSoc.findByIdAndUpdate(item.id, { orden: item.orden });
    });
    
    await Promise.all(updatePromises);
    
    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'reordenar_actividades',
      descripcion: 'Actividades reordenadas',
      ip: req.ip
    });
    
    // Obtener las actividades actualizadas
    const actividades = await ActividadSoc.find().populate('fase').sort('orden');
    
    res.status(200).json({
      success: true,
      data: actividades
    });
  } catch (err) {
    next(err);
  }
};
