const ErrorResponse = require('../utils/errorResponse');
const ProgresoResidente = require('../models/ProgresoResidente');
const User = require('../models/User');
const { updatePhaseStatus } = require('./progresoController');

const getAllActiveProgress = async (req, res, next) => {
  try {
    const residentes = await User.find({ rol: 'residente', activo: true })
      .populate('hospital');

    const data = await Promise.all(residentes.map(async (residente) => {
      const progresos = await ProgresoResidente.find({ residente: residente._id })
        .populate('fase')
        .populate('actividades.actividad');

      progresos.sort((a, b) => a.fase.orden - b.fase.orden);

      const fases = progresos.map(p => ({
        _id: p._id,
        fase: p.fase,
        estadoGeneral: p.estadoGeneral,
        actividades: p.actividades
      }));

      return {
        residente: {
          _id: residente._id,
          nombre: residente.nombre,
          apellidos: residente.apellidos,
          email: residente.email,
          hospital: residente.hospital
        },
        fases
      };
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

const updateActivityStatus = async (req, res, next) => {
  try {
    const { progresoId, index, estado } = req.body;

    const progreso = await ProgresoResidente.findById(progresoId).populate(['fase', 'residente']);
    if (!progreso || !progreso.actividades[index]) {
      return next(new ErrorResponse('Actividad no encontrada', 404));
    }

    const actividad = progreso.actividades[index];
    actividad.estado = estado;

    if (estado === 'completado') {
      actividad.completada = true;
      actividad.fechaRealizacion = actividad.fechaRealizacion || new Date();
    }
    if (estado === 'validado') {
      actividad.fechaValidacion = new Date();
    }
    if (estado === 'rechazado') {
      actividad.fechaRechazo = new Date();
    }

    await progreso.save();
    await updatePhaseStatus(progreso);

    res.status(200).json({ success: true, data: progreso });
  } catch (err) {
    next(err);
  }
};

const updatePhaseStatusAdmin = async (req, res, next) => {
  try {
    const { progresoId, estadoGeneral } = req.body;
    const progreso = await ProgresoResidente.findById(progresoId).populate(['fase','residente']);
    if (!progreso) {
      return next(new ErrorResponse('Progreso no encontrado', 404));
    }

   // Permitir cambios desde cualquier estado. Si se vuelve a 'en progreso' o
    // a 'bloqueada', limpiamos campos de finalización o validación previos
    if (estadoGeneral === 'en progreso' || estadoGeneral === 'bloqueada') {
      progreso.estadoGeneral = estadoGeneral;
      progreso.fechaFin = undefined;
      progreso.validadoPor = undefined;
      await progreso.save();
      return res.status(200).json({ success: true, data: progreso });
    }

    if (estadoGeneral === 'completado') {
      const todasCompletadas = progreso.actividades.every(a => a.estado === 'completado' || a.estado === 'validado');
      if (!todasCompletadas) {
        return next(new ErrorResponse('Todas las actividades deben estar completadas para marcar la fase como completada', 400));
      }
      if (!progreso.fechaFin) {
        progreso.fechaFin = new Date();
      }
    }

    if (estadoGeneral === 'validado') {
      const todasValidadas = progreso.actividades.every(a => a.estado === 'validado');
      if (!todasValidadas) {
        return next(new ErrorResponse('Todas las actividades deben estar validadas para marcar la fase como validada', 400));
      }
    }

    progreso.estadoGeneral = estadoGeneral;
    await progreso.save();
    
    if (estadoGeneral === 'validado') {
      await updatePhaseStatus(progreso);
    }

    res.status(200).json({ success: true, data: progreso });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllActiveProgress,
  updateActivityStatus,
  updatePhaseStatusAdmin
};
