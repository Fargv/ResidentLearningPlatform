const ErrorResponse = require('../utils/errorResponse');
const ProgresoResidente = require('../models/ProgresoResidente');
const Actividad = require('../models/Actividad');
const User = require('../models/User');
const Validacion = require('../models/Validacion');
const Adjunto = require('../models/Adjunto');
const Notificacion = require('../models/Notificacion');
const Fase = require('../models/Fase');
const Hospital = require('../models/Hospital');
const { Role } = require('../utils/roles');
const { createAuditLog } = require('../utils/auditLog');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { inicializarProgresoFormativo: inicializarProgresoFormativoDB } = require('../utils/initProgreso');

const updatePhaseStatus = async (progreso) => {
  await progreso.populate(['fase', 'residente']);

  const todasValidadas = progreso.actividades.every(a => a.estado === 'validado');
  if (!todasValidadas) {
    logger.info(`⏳ No todas las actividades están validadas aún en fase "${progreso.fase.nombre}" para ${progreso.residente.email}`);
    return;
  }

  if (progreso.estadoGeneral !== 'validado') {
    progreso.estadoGeneral = 'validado';
    await progreso.save();
    logger.info(`✅ Fase "${progreso.fase.nombre}" marcada como COMPLETADA para ${progreso.residente.email}`);
  }

  const ModeloFase = mongoose.model(progreso.faseModel || 'Fase');
  const nextFase = await ModeloFase.findOne({ orden: progreso.fase.orden + 1 });
  if (!nextFase) {
    logger.info(`🎉 No hay más fases después de "${progreso.fase.nombre}". Fin del plan formativo para ${progreso.residente.email}`);
    return;
  }

  const nextProgreso = await ProgresoResidente.findOne({
    residente: progreso.residente._id,
    fase: nextFase._id
  });

  if (nextProgreso && nextProgreso.estadoGeneral === 'bloqueada') {
    nextProgreso.estadoGeneral = 'en progreso';
    await nextProgreso.save();
    logger.info(`🚀 Fase "${nextFase.nombre}" DESBLOQUEADA para ${progreso.residente.email}`);
  } else {
    logger.info(`ℹ️ Fase "${nextFase.nombre}" ya estaba desbloqueada o no encontrada`);
  }
};


const buildActividadDisplayData = (actividad = {}) => {
  const actividadMaestra =
    actividad.actividad && typeof actividad.actividad === 'object'
      ? actividad.actividad
      : null;

  return {
    nombre: actividadMaestra?.nombre || actividad.nombre,
    descripcion:
      actividadMaestra?.descripcion !== undefined
        ? actividadMaestra.descripcion
        : actividad.descripcion,
    tipo: actividadMaestra?.tipo || actividad.tipo,
    requiereAdjunto:
      actividadMaestra?.requiereAdjunto !== undefined
        ? actividadMaestra.requiereAdjunto
        : actividad.requiereAdjunto,
    actividadModel:
      actividadMaestra?.constructor?.modelName || actividad.actividadModel,
    actividadId: actividadMaestra?._id || actividad.actividad
  };
};


const formatProgresoParaResidente = (progresoDoc) => {
  const plain = progresoDoc.toObject ? progresoDoc.toObject({ virtuals: true }) : progresoDoc;
  const adjuntosPorIndice = (plain.adjuntos || []).reduce((acc, adj) => {
    if (typeof adj.actividadIndex !== 'number') return acc;
    const key = adj.actividadIndex;
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      _id: adj._id.toString(),
      nombreArchivo: adj.nombreArchivo,
      mimeType: adj.mimeType,
      fechaSubida: adj.fechaSubida
    });
    return acc;
  }, {});

  return {
    _id: plain._id.toString(),
    fase: plain.fase,
    faseModel: plain.faseModel,
    estadoGeneral: plain.estadoGeneral,
    actividades: (plain.actividades || []).map((act, index) => {
      const actividadData = buildActividadDisplayData(act);

      return {
        nombre: actividadData.nombre,
        descripcion: actividadData.descripcion,
        tipo: actividadData.tipo,
        actividad: actividadData.actividadId,
        actividadModel: actividadData.actividadModel,
        completada: act.estado === 'validado',
        comentariosResidente: act.comentariosResidente || '',
        comentariosTutor: act.comentariosTutor || '',
        firmaDigital: act.firmaDigital || '',
        fecha: act.fechaRealizacion,
        fechaValidacion: act.fechaValidacion,
        comentariosRechazo: act.comentariosRechazo || '',
        fechaRechazo: act.fechaRechazo,
        estado: act.estado,
        porcentajeParticipacion: act.porcentajeParticipacion,
        cirugia: act.cirugia,
        otraCirugia: act.otraCirugia,
        nombreCirujano: act.nombreCirujano,
        adjuntos: adjuntosPorIndice[index] || [],
        requiereAdjunto: Boolean(actividadData.requiereAdjunto)
      };
    })
  };
};

const getPhaseOrder = (fase) => {
  if (!fase) return 0;
  if (typeof fase.orden === 'number') return fase.orden;
  if (typeof fase.numero === 'number') return fase.numero;
  return 0;
};

const getLatestDateFromProgreso = (progreso) => {
  const dates = [];
  if (progreso.updatedAt) dates.push(new Date(progreso.updatedAt));
  if (progreso.fechaRegistro) dates.push(new Date(progreso.fechaRegistro));
  if (progreso.fechaInicio) dates.push(new Date(progreso.fechaInicio));
  if (progreso.fechaFin) dates.push(new Date(progreso.fechaFin));
  (progreso.actividades || []).forEach((actividad) => {
    if (actividad.fechaRealizacion) dates.push(new Date(actividad.fechaRealizacion));
    if (actividad.fechaValidacion) dates.push(new Date(actividad.fechaValidacion));
    if (actividad.fechaRechazo) dates.push(new Date(actividad.fechaRechazo));
  });
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
};

const getCurrentPhaseStatus = (progresos) => {
  if (!progresos.length) {
    return { faseActual: null, estadoFaseActual: 'sin_iniciar' };
  }
  const ordered = [...progresos].sort(
    (a, b) => getPhaseOrder(a.fase) - getPhaseOrder(b.fase)
  );
  const enProgreso = ordered.find((progreso) => progreso.estadoGeneral === 'en progreso');
  if (enProgreso) {
    return { faseActual: enProgreso.fase || null, estadoFaseActual: 'en_progreso' };
  }
  const started = ordered.some((progreso) => progreso.estadoGeneral !== 'bloqueada');
  const allCompleted = started && ordered.every((progreso) =>
    ['completado', 'validado'].includes(progreso.estadoGeneral)
  );
  if (allCompleted) {
    return { faseActual: null, estadoFaseActual: 'completadas' };
  }
  if (!started) {
    return { faseActual: null, estadoFaseActual: 'sin_iniciar' };
  }
  const lastStarted = [...ordered]
    .filter((progreso) => progreso.estadoGeneral !== 'bloqueada')
    .pop();
  return {
    faseActual: lastStarted?.fase || null,
    estadoFaseActual: lastStarted?.fase ? 'en_progreso' : 'sin_iniciar'
  };
};

const summarizeUserProgress = (user, progresos = []) => {
  const totalActividades = progresos.reduce(
    (acc, item) => acc + (item.actividades ? item.actividades.length : 0),
    0
  );
  const actividadesValidadas = progresos.reduce(
    (acc, item) =>
      acc +
      (item.actividades || []).filter((actividad) => actividad.estado === 'validado')
        .length,
    0
  );
  const pendientesValidacion = progresos.reduce(
    (acc, item) =>
      acc +
      (item.actividades || []).filter((actividad) => actividad.estado === 'completado')
        .length,
    0
  );

  const lastUpdates = progresos
    .map(getLatestDateFromProgreso)
    .filter(Boolean)
    .map((date) => date.getTime());
  const ultimaActualizacion = lastUpdates.length
    ? new Date(Math.max(...lastUpdates))
    : null;

  const { faseActual, estadoFaseActual } = getCurrentPhaseStatus(progresos);
  const sociedad = user?.tipo === 'Programa Sociedades' ? user?.sociedad : null;
  const hasSchedule =
    Boolean(
      sociedad &&
        [
          'fechaConvocatoria',
          'fechaPresentacion',
          'fechaModulosOnline',
          'fechaSimulacion',
          'fechaAtividadesFirstAssistant',
          'fechaModuloOnlineStepByStep',
          'fechaHandOn'
        ].some((key) => sociedad?.[key])
    );
  const societyPhaseDate = (() => {
    if (!sociedad || !faseActual) return null;
    const phaseOrder = getPhaseOrder(faseActual);
    switch (phaseOrder) {
      case 1:
        return (
          sociedad.fechaModulosOnline ||
          sociedad.fechaPresentacion ||
          sociedad.fechaConvocatoria ||
          null
        );
      case 2:
        return sociedad.fechaSimulacion || null;
      case 3:
        return sociedad.fechaAtividadesFirstAssistant || null;
      case 4:
        return sociedad.fechaModuloOnlineStepByStep || null;
      case 5:
        return sociedad.fechaHandOn || null;
      default:
        return null;
    }
  })();
  const isOnSchedule = Boolean(
    societyPhaseDate && new Date(societyPhaseDate) >= new Date()
  );

  const progresoCompleto =
    progresos.length > 0 &&
    progresos.every((item) => item.estadoGeneral === 'validado');

  let estadoGeneral = 'sin_actividad';
  if (pendientesValidacion > 0) {
    estadoGeneral = 'pendiente_validacion';
  } else if (progresoCompleto) {
    estadoGeneral = 'progreso_completado';
  } else if (totalActividades === 0) {
    estadoGeneral = 'sin_actividad';
  } else if (hasSchedule && isOnSchedule) {
    estadoGeneral = 'al_dia';
  } else {
    estadoGeneral = 'en_curso';
  }

  return {
    user: {
      _id: user._id,
      nombre: user.nombre,
      apellidos: user.apellidos,
      email: user.email,
      tipo: user.tipo,
      hospital: user.hospital,
      sociedad: user.sociedad
    },
    faseActual,
    estadoFaseActual,
    progreso: {
      total: totalActividades,
      validadas: actividadesValidadas,
      porcentaje: totalActividades
        ? Math.round((actividadesValidadas / totalActividades) * 100)
        : 0
    },
    pendientesValidacion,
    ultimaActualizacion,
    estadoGeneral
  };
};


const inicializarProgresoFormativo = async (req, res, next) => {
  try {
  const user = await User.findById(req.params.id);
  if (!user || (user.rol !== 'residente' && user.rol !== 'participante')) {
    return res.status(404).json({ success: false, error: 'Residente no válido' });
  }

     if (req.body.tipo) user.tipo = req.body.tipo;
    const count = await inicializarProgresoFormativoDB(user);
    res.status(200).json({ success: true, count });
  } catch (err) {
    next(err);
  }
};





// @desc    Obtener todos los registros de progreso
// @route   GET /api/progreso
// @access  Private/Admin
const getAllProgreso = async (req, res, next) => {
  try {
    // Solo administrador puede acceder a todos los progresos
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({ success: false, error: 'No autorizado para acceder a todos los progresos' });
    }

    const progreso = await ProgresoResidente.find()
      .populate({
        path: 'residente',
        select: 'nombre apellidos email hospital',
        populate: { path: 'hospital', select: 'nombre' }
      })
     .populate('fase')
      .populate('actividades.actividad')
      .populate('actividades.cirugia')
      .lean();

    const filtered = progreso.filter(p => p.residente);

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener resumen de seguimiento de usuarios
// @route   GET /api/progreso/seguimiento
// @access  Private/Profesor|CSM|Admin
const getSeguimientoUsuarios = async (req, res, next) => {
  try {
    const {
      programa = 'all',
      hospitalId = 'all',
      sociedadId = 'all',
      search = '',
      faseId = 'all',
      estado = 'all',
      dateFrom,
      dateTo,
      userId
    } = req.query;
    let usersQuery = {};
    let emptyReason;

    if (req.user.rol === Role.ADMINISTRADOR) {
      usersQuery = { rol: { $in: [Role.RESIDENTE, Role.PARTICIPANTE] } };
    } else if (req.user.rol === Role.CSM) {
      if (!req.user.zona) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
          message: 'No hay usuarios asignados a tu zona'
        });
      }
      const hospitales = await Hospital.find({ zona: req.user.zona }).select('_id');
      const ids = hospitales.map((h) => h._id);
      usersQuery = {
        hospital: { $in: ids },
        rol: Role.RESIDENTE,
        tipo: 'Programa Residentes'
      };
    } else if (req.user.rol === Role.PROFESOR) {
      if (req.user.tipo === 'Programa Residentes') {
        if (!req.user.hospital) {
          emptyReason = 'No hay usuarios asignados para tu hospital';
          usersQuery = { _id: null };
        } else {
          usersQuery = {
            hospital: req.user.hospital,
            rol: Role.RESIDENTE,
            tipo: 'Programa Residentes'
          };
        }
      } else {
        if (!req.user.sociedad) {
          emptyReason = 'No hay usuarios asignados para tu sociedad';
          usersQuery = { _id: null };
        } else {
          usersQuery = {
            sociedad: req.user.sociedad,
            rol: Role.PARTICIPANTE,
            tipo: 'Programa Sociedades'
          };
        }
      }
    } else {
      return res.status(403).json({ success: false, error: 'No autorizado para ver seguimiento' });
    }

    if (programa !== 'all') {
      usersQuery.tipo = programa;
    }
    if (hospitalId !== 'all') {
      usersQuery.hospital = hospitalId;
    }
    if (sociedadId !== 'all') {
      usersQuery.sociedad = sociedadId;
    }
    if (userId) {
      usersQuery._id = userId;
    }

    const users = await User.find(usersQuery)
      .populate('hospital', 'nombre zona')
      .populate(
        'sociedad',
        [
          'titulo',
          'fechaConvocatoria',
          'fechaPresentacion',
          'fechaModulosOnline',
          'fechaSimulacion',
          'fechaAtividadesFirstAssistant',
          'fechaModuloOnlineStepByStep',
          'fechaHandOn'
        ].join(' ')
      )
      .select('nombre apellidos email tipo hospital sociedad')
      .lean();

    const filteredUsers = users.filter((user) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        user.nombre?.toLowerCase().includes(q) ||
        user.apellidos?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q)
      );
    });

    const userIds = filteredUsers.map((user) => user._id);
    const progresos = await ProgresoResidente.find({ residente: { $in: userIds } })
      .populate('fase', 'nombre numero orden')
      .select('residente fase actividades estadoGeneral fechaRegistro fechaInicio fechaFin updatedAt')
      .lean();

    const progresosMap = progresos.reduce((acc, item) => {
      const key = item.residente?.toString();
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    let summaries = filteredUsers.map((user) =>
      summarizeUserProgress(user, progresosMap[user._id.toString()] || [])
    );

    if (faseId !== 'all') {
      summaries = summaries.filter((summary) =>
        summary.faseActual && summary.faseActual._id.toString() === faseId
      );
    }

    if (estado !== 'all') {
      summaries = summaries.filter((summary) => summary.estadoGeneral === estado);
    }

    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      summaries = summaries.filter((summary) => {
        if (!summary.ultimaActualizacion) return false;
        const date = new Date(summary.ultimaActualizacion);
        if (from && date < from) return false;
        if (to) {
          const end = new Date(to);
          end.setHours(23, 59, 59, 999);
          if (date > end) return false;
        }
        return true;
      });
    }

    res.status(200).json({
      success: true,
      count: summaries.length,
      data: summaries,
      message: summaries.length === 0 && emptyReason ? emptyReason : undefined
    });
  } catch (err) {
    next(err);
  }
};


// @desc    Obtener progreso de un residente específico
// @route   GET /api/progreso/residente/:id
// @access  Private



const getProgresoResidente = async (req, res, next) => {
  try {
    const residente = await User.findById(req.params.id).populate('hospital');

    if (!residente) {
      return next(new ErrorResponse(`Residente no encontrado con id ${req.params.id}`, 404));
    }

  if (residente.rol !== 'residente' && residente.rol !== 'participante') {
      return next(new ErrorResponse(`El usuario con id ${req.params.id} no es un residente`, 400));
  }

  if ((req.user.rol === 'residente' || req.user.rol === 'participante') && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver el progreso de otro residente' });
  }


    if (
      req.user.rol === 'tutor' &&
      (req.user.hospital.toString() !== residente.hospital._id.toString() ||
        (req.user.especialidad !== 'ALL' && req.user.especialidad !== residente.especialidad))
    ) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver residentes de otro hospital' });
    }
    if (req.user.rol === 'csm' && req.user.zona !== residente.hospital.zona) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver residentes de otra zona' });
    }

    if (req.user.rol === 'profesor') {
      if (residente.tipo === 'Programa Residentes') {
        if (!req.user.hospital || req.user.hospital.toString() !== residente.hospital._id.toString()) {
          return res.status(403).json({ success: false, error: 'No autorizado para ver residentes de otro hospital' });
        }
      } else if (!residente.sociedad || !req.user.sociedad || req.user.sociedad.toString() !== residente.sociedad.toString()) {
        return res.status(403).json({ success: false, error: 'No autorizado para ver residentes de otra sociedad' });
      }
    }

    const progresoPorFase = await ProgresoResidente.find({ residente: req.params.id })
      .populate('fase')
      .populate('actividades.actividad')
      .populate('actividades.cirugia');

    await ProgresoResidente.populate(progresoPorFase, {
      path: 'adjuntos',
      select: 'nombreArchivo mimeType fechaSubida actividadIndex'
    });

    // Ordenar las fases por su campo 'orden'
    progresoPorFase.sort((a, b) => a.fase.orden - b.fase.orden);
    const resultado = progresoPorFase.map(formatProgresoParaResidente);
      

    res.status(200).json({
      success: true,
      count: resultado.length,
      data: resultado
    });
  } catch (err) {
    console.error("Error en getProgresoResidente:", err);
    next(err);
  }

};


const getProgresoResidentePorFase = async (req, res, next) => {
  try {
    const residente = await User.findById(req.params.id).populate('hospital');

    if (!residente) {
      return next(new ErrorResponse(`Residente no encontrado con id ${req.params.id}`, 404));
    }

  if (residente.rol !== 'residente' && residente.rol !== 'participante') {
      return next(new ErrorResponse(`El usuario con id ${req.params.id} no es un residente`, 400));
  }

  if ((req.user.rol === 'residente' || req.user.rol === 'participante') && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver el progreso de otro residente' });
  }

    if (
      req.user.rol === 'tutor' &&
      (req.user.hospital.toString() !== residente.hospital._id.toString() ||
        (req.user.especialidad !== 'ALL' && req.user.especialidad !== residente.especialidad))
    ) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver residentes de otro hospital' });
    }
    if (req.user.rol === 'csm' && req.user.zona !== residente.hospital.zona) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver residentes de otra zona' });
    }
    if (req.user.rol === 'profesor') {
      if (residente.tipo === 'Programa Residentes') {
        if (!req.user.hospital || req.user.hospital.toString() !== residente.hospital._id.toString()) {
          return res.status(403).json({ success: false, error: 'No autorizado para ver residentes de otro hospital' });
        }
      } else if (!residente.sociedad || !req.user.sociedad || req.user.sociedad.toString() !== residente.sociedad.toString()) {
        return res.status(403).json({ success: false, error: 'No autorizado para ver residentes de otra sociedad' });
      }
    }

    const progreso = await ProgresoResidente.find({ residente: req.params.id })
      .populate('fase')
      .populate('actividades.actividad')
      .populate('actividades.cirugia');

    await ProgresoResidente.populate(progreso, {
      path: 'adjuntos',
      select: 'nombreArchivo mimeType fechaSubida actividadIndex'
    });

    const resultado = progreso.map(item => {
      const plain = item.toObject({ virtuals: true });
      const adjuntosPorIndice = (plain.adjuntos || []).reduce((acc, adj) => {
        if (typeof adj.actividadIndex !== 'number') return acc;
        const key = adj.actividadIndex;
        if (!acc[key]) acc[key] = [];
        acc[key].push({
          _id: adj._id.toString(),
          nombreArchivo: adj.nombreArchivo,
          mimeType: adj.mimeType,
          fechaSubida: adj.fechaSubida
        });
        return acc;
      }, {});

      return {
        ...plain,
        actividades: plain.actividades.map((act, index) => {
          const actividadData = buildActividadDisplayData(act);

          return {
            ...act,
            nombre: actividadData.nombre,
            descripcion: actividadData.descripcion,
            tipo: actividadData.tipo,
            actividadModel: actividadData.actividadModel,
            actividad: actividadData.actividadId,
            requiereAdjunto: Boolean(actividadData.requiereAdjunto),
            adjuntos: adjuntosPorIndice[index] || []
          };
        })
      };
    });

    const filtered = resultado.filter(p => p.residente);

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  } catch (err) {
    next(err);
  }
};


// @desc    Registrar nuevo progreso
// @route   POST /api/progreso
// @access  Private




const registrarProgreso = async (req, res, next) => {
  try {
    // Si el usuario es residente, solo puede registrar su propio progreso
  if ((req.user.rol === 'residente' || req.user.rol === 'participante') && req.body.residente !== req.user.id) {
      return next(new ErrorResponse('No autorizado para registrar progreso de otro residente', 403));
  }

    // Verificar que la actividad existe
    const actividad = await Actividad.findById(req.body.actividad);
    if (!actividad) {
      return next(new ErrorResponse(`Actividad no encontrada con id ${req.body.actividad}`, 404));
    }

    // Verificar que el residente existe y es un residente
    const residente = await User.findById(req.body.residente);
    if (!residente) {
      return next(new ErrorResponse(`Residente no encontrado con id ${req.body.residente}`, 404));
    }

  if (residente.rol !== 'residente' && residente.rol !== 'participante') {
      return next(new ErrorResponse(`El usuario con id ${req.body.residente} no es un residente`, 400));
  }

    // Crear el registro de progreso
    const progreso = await ProgresoResidente.create({
      ...req.body,
      estado: actividad.requiereValidacion ? 'pendiente' : 'completado'
    });

// Si la actividad requiere validación, crear notificación para tutores y profesores asignados
      if (actividad.requiereValidacion) {
        const destinatarios = [residente.tutor, residente.profesor].filter(Boolean);

        const notificacionesPromises = destinatarios.map(usuarioId =>
          Notificacion.create({
            usuario: usuarioId,
            tipo: 'validacion',
            mensaje: `El residente ${residente.nombre} ${residente.apellidos} ha completado la actividad "${actividad.nombre}" y requiere validación.`,
            enlace: '/dashboard/validaciones',
            entidadRelacionada: {
              tipo: 'progreso',
              id: progreso._id
            }
          })
        );

        await Promise.all(notificacionesPromises);
      }

    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'registrar_progreso',
      descripcion: `Progreso registrado para residente ${residente.email} en actividad ${actividad.nombre}`,
      ip: req.ip
    });

    // Devolver el progreso creado con datos relacionados
    const progresoCompleto = await ProgresoResidente.findById(progreso._id)
      .populate({
        path: 'residente',
        select: 'nombre apellidos email hospital',
        populate: { path: 'hospital', select: 'nombre' }
      })
      .populate('fase')
      .populate('actividades.actividad')
      .populate('actividades.cirugia');

    res.status(201).json({
      success: true,
      data: progresoCompleto
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar registro de progreso
// @route   PUT /api/progreso/:id
// @access  Private
const actualizarProgreso = async (req, res, next) => {
  try {
    let progreso = await ProgresoResidente.findById(req.params.id)
      .populate({ path: 'residente', populate: { path: 'hospital' } })
      .populate('actividad');

    if (!progreso) {
      return next(new ErrorResponse(`Progreso no encontrado con id ${req.params.id}`, 404));
    }

    // Verificar permisos: solo el propio residente, formadores de su hospital o administradores
    if (
      req.user.rol !== 'administrador' &&
      req.user.id !== progreso.residente._id.toString() &&
      (
        (req.user.rol !== 'tutor' ||
          req.user.hospital.toString() !== progreso.residente.hospital._id.toString() ||
          (req.user.especialidad !== 'ALL' && req.user.especialidad !== progreso.residente.especialidad)) &&
        (req.user.rol !== 'csm' || req.user.zona !== progreso.residente.hospital.zona) &&
        (req.user.rol !== 'profesor' || !progreso.residente.sociedad || req.user.sociedad.toString() !== progreso.residente.sociedad.toString())
      )
    ) {
      return next(new ErrorResponse('No autorizado para actualizar este progreso', 403));
    }

    // No permitir cambiar el residente o la actividad
    delete req.body.residente;
    delete req.body.actividad;

    // Actualizar el progreso
    progreso = await ProgresoResidente.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate({
        path: 'residente',
        select: 'nombre apellidos email hospital',
        populate: { path: 'hospital', select: 'nombre' }
      })
      .populate('fase')
      .populate('actividades.actividad')
      .populate('actividades.cirugia');

    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'actualizar_progreso',
      descripcion: `Progreso actualizado para residente ${progreso.residente.email} en actividad ${progreso.actividad.nombre}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: progreso
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Validar progreso de residente
// @route   POST /api/progreso/:id/validar
// @access  Private/Tutor|Profesor|CSM|Admin
const validarProgreso = async (req, res, next) => {
  try {
    // Verificar que el usuario es tutor, profesor o administrador
    if (req.user.rol !== 'tutor' && req.user.rol !== 'profesor' && req.user.rol !== 'administrador') {
      return next(new ErrorResponse('No autorizado para validar progreso', 403));
    }

    const progreso = await ProgresoResidente.findById(req.params.id)
      .populate({ path: 'residente', populate: { path: 'hospital' } })
      .populate('actividad');

    if (!progreso) {
      return next(new ErrorResponse(`Progreso no encontrado con id ${req.params.id}`, 404));
    }

    // Si es tutor o profesor, verificar que pertenece al mismo hospital o sociedad que el residente
    if (
      (req.user.rol === 'tutor' &&
        (req.user.hospital.toString() !== progreso.residente.hospital._id.toString() ||
          (req.user.especialidad !== 'ALL' && req.user.especialidad !== progreso.residente.especialidad))) ||
      (req.user.rol === 'csm' && req.user.zona !== progreso.residente.hospital.zona) ||
      (req.user.rol === 'profesor' && (!progreso.residente.sociedad || req.user.sociedad.toString() !== progreso.residente.sociedad.toString()))
    ) {
      return next(new ErrorResponse('No autorizado para validar progreso de residentes de otro centro', 403));
    }

    // Verificar que el progreso está pendiente
    if (progreso.estado !== 'pendiente') {
      return next(new ErrorResponse(`El progreso ya ha sido ${progreso.estado === 'validado' ? 'validado' : 'rechazado'}`, 400));
    }

    // Crear validación
    const validacion = await Validacion.create({
      progreso: progreso._id,
      tutor: req.user._id,
      comentarios: req.body.comentarios,
      firmaDigital: req.body.firmaDigital,
    });

    // Registrar información de auditoría
    await validacion.registrarAuditoria(req.ip, req.headers['user-agent']);

    // Actualizar estado del progreso
    progreso.estado = 'validado';
    await progreso.save();

    // Eliminar notificaciones pendientes para tutor y profesor asignados
    const destinatarios = [progreso.residente.tutor, progreso.residente.profesor].filter(Boolean);
    await Notificacion.updateMany(
      {
        usuario: { $in: destinatarios },
        'entidadRelacionada.tipo': 'progreso',
        'entidadRelacionada.id': progreso._id
      },
      { leida: true }
    );

    // Crear notificación para el residente
    await Notificacion.create({
      usuario: progreso.residente._id,
      tipo: 'validacion',
      mensaje: `Tu actividad "${progreso.actividad.nombre}" ha sido validada por ${req.user.nombre} ${req.user.apellidos}.`,
      entidadRelacionada: {
        tipo: 'validacion',
        id: validacion._id
      }
    });

    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'validar_progreso',
      descripcion: `Progreso validado para residente ${progreso.residente.email} en actividad ${progreso.actividad.nombre}`,
      ip: req.ip
    });

    // Devolver la validación creada con datos relacionados
    const validacionCompleta = await Validacion.findById(validacion._id)
      .populate({
        path: 'progreso',
        populate: [
          {
            path: 'residente',
            select: 'nombre apellidos email'
          },
          {
            path: 'fase'
          },
          {
            path: 'actividades.actividad'
          },
          {
            path: 'actividades.cirugia'
          }
        ]
      })
      .populate('tutor', 'nombre apellidos email');

    res.status(201).json({
      success: true,
      data: validacionCompleta
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Rechazar progreso de residente
// @route   POST /api/progreso/:id/rechazar
// @access  Private/Tutor|Profesor|CSM|Admin
const rechazarProgreso = async (req, res, next) => {
  try {
    // Verificar que el usuario es tutor, profesor o administrador
    if (req.user.rol !== 'tutor' && req.user.rol !== 'profesor' && req.user.rol !== 'administrador') {
      return next(new ErrorResponse('No autorizado para rechazar progreso', 403));
    }

    const progreso = await ProgresoResidente.findById(req.params.id)
      .populate({ path: 'residente', populate: { path: 'hospital' } })
      .populate('actividad');

    if (!progreso) {
      return next(new ErrorResponse(`Progreso no encontrado con id ${req.params.id}`, 404));
    }

    // Si es tutor o profesor, verificar que pertenece al mismo hospital o sociedad que el residente
    if (
      (req.user.rol === 'tutor' &&
        (req.user.hospital.toString() !== progreso.residente.hospital._id.toString() ||
          (req.user.especialidad !== 'ALL' && req.user.especialidad !== progreso.residente.especialidad))) ||
      (req.user.rol === 'csm' && req.user.zona !== progreso.residente.hospital.zona) ||
      (req.user.rol === 'profesor' && (!progreso.residente.sociedad || req.user.sociedad.toString() !== progreso.residente.sociedad.toString()))
    ) {
      return next(new ErrorResponse('No autorizado para rechazar progreso de residentes de otro centro', 403));
    }

    // Verificar que el progreso está pendiente
    if (progreso.estado !== 'pendiente') {
      return next(new ErrorResponse(`El progreso ya ha sido ${progreso.estado === 'validado' ? 'validado' : 'rechazado'}`, 400));
    }

    // Actualizar estado del progreso
    progreso.estado = 'rechazado';
    await progreso.save();

    // Eliminar notificaciones pendientes para tutor y profesor asignados
    const destinatariosRechazo = [progreso.residente.tutor, progreso.residente.profesor].filter(Boolean);
    await Notificacion.updateMany(
      {
        usuario: { $in: destinatariosRechazo },
        'entidadRelacionada.tipo': 'progreso',
        'entidadRelacionada.id': progreso._id
      },
      { leida: true }
    )

    // Crear notificación para el residente
    await Notificacion.create({
      usuario: progreso.residente._id,
      tipo: 'rechazo',
      mensaje: `Tu actividad "${progreso.actividad.nombre}" ha sido rechazada por ${req.user.nombre} ${req.user.apellidos}. Motivo: ${req.body.comentarios}`,
      entidadRelacionada: {
        tipo: 'progreso',
        id: progreso._id
      }
    });

    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'rechazar_progreso',
      descripcion: `Progreso rechazado para residente ${progreso.residente.email} en actividad ${progreso.actividad.nombre}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: progreso
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener estadísticas de progreso por residente
// @route   GET /api/progreso/stats/residente/:id
// @access  Private
const getEstadisticasResidente = async (req, res, next) => {
  try {
    const residenteId = req.params.id;

    const progresos = await ProgresoResidente.find({ residente: residenteId })
      .populate('fase')
      .populate('actividades.actividad')
      .populate('actividades.cirugia');

    const estadisticas = progresos.map(item => {
      const total = item.actividades.length;
      const completadas = item.actividades.filter(act => act.estado === 'validado').length;
      return {
        fase: item.fase,
        total,
        completadas,
        porcentaje: total ? Math.round((completadas / total) * 100) : 0
      };
    });

    res.status(200).json({
      success: true,
      data: estadisticas
    });
  } catch (err) {
    console.error("Error en getEstadisticasResidente:", err);
    next(err);
  }
};
// PUT /api/progreso/:id/actividad/:index
const marcarActividadCompletada = async (req, res, next) => {
  try {
    const { id, index } = req.params;
    const { fechaRealizacion, comentariosResidente, cirugia, otraCirugia, nombreCirujano, porcentajeParticipacion } = req.body;

    const progreso = await ProgresoResidente.findById(id).populate([
      'residente',
      'actividades.actividad'
    ]);
    if (!progreso || !progreso.actividades || !progreso.actividades[index]) {
      return next(new ErrorResponse('Progreso o actividad no válida', 404));
    }

    const actividadOriginal = progreso.actividades[index];
    if (!actividadOriginal || !actividadOriginal.actividad) {
      return next(new ErrorResponse('La actividad está incompleta o mal formada', 400));
    }

    const actividadExistente = progreso.actividades[index];
    const estadoPrevio = actividadExistente.estado;
    const actividadIndex = Number(index);

    const existingAdjuntos = await Adjunto.find({ progreso: id, actividadIndex });

    let adjuntosAEliminar = [];
    if (req.body.adjuntosAEliminar) {
      try {
        const raw = req.body.adjuntosAEliminar;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) {
          adjuntosAEliminar = parsed.filter(item => typeof item === 'string');
        } else if (typeof parsed === 'string') {
          adjuntosAEliminar = [parsed];
        } else {
          return next(new ErrorResponse('Formato de adjuntos a eliminar no válido', 400));
        }
      } catch (err) {
        return next(new ErrorResponse('Formato de adjuntos a eliminar no válido', 400));
      }
    }

    if (actividadOriginal.tipo === 'cirugia') {
      const porcentaje = Number(porcentajeParticipacion);
      if (!nombreCirujano) {
        return next(new ErrorResponse('Nombre del cirujano es requerido', 400));
      }
      if (!cirugia && !otraCirugia) {
        return next(new ErrorResponse('Debe especificar la cirugía', 400));
      }
      if (![0, 25, 50, 75, 100].includes(porcentaje)) {
        return next(new ErrorResponse('Porcentaje de participación inválido', 400));
      }
      actividadExistente.cirugia = cirugia;
      actividadExistente.otraCirugia = otraCirugia;
      actividadExistente.nombreCirujano = nombreCirujano;
      actividadExistente.porcentajeParticipacion = porcentaje;
    }

    actividadExistente.estado = 'completado';
    actividadExistente.completada = true;
    actividadExistente.fechaRealizacion = fechaRealizacion ? new Date(fechaRealizacion) : new Date();
    actividadExistente.comentariosResidente = comentariosResidente;

    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/heic', 'image/heif'];
    const MAX_FILES = 5;

    const filesFromRequest = [];
    if (req.files) {
      const posiblesCampos = ['adjunto', 'adjuntos'];
      for (const campo of posiblesCampos) {
        const value = req.files[campo];
        if (!value) continue;
        if (Array.isArray(value)) {
          filesFromRequest.push(...value);
        } else {
          filesFromRequest.push(value);
        }
      }
    }

    for (const file of filesFromRequest) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return next(new ErrorResponse(`Tipo de archivo no permitido: ${file.name}`, 400));
      }
      if (file.size > 5 * 1024 * 1024) {
        return next(new ErrorResponse(`El archivo ${file.name} supera el límite de 5MB`, 400));
      }
    }

    const existingMap = new Map(existingAdjuntos.map(adj => [adj._id.toString(), adj]));
    const idsParaEliminar = adjuntosAEliminar.filter(idEliminar => existingMap.has(idEliminar));
    const restantes = existingAdjuntos.filter(adj => !idsParaEliminar.includes(adj._id.toString()));

    const requiereAdjuntoObligatorio = Boolean(
      actividadExistente.actividad && actividadExistente.actividad.requiereAdjunto
    );

    if (requiereAdjuntoObligatorio && restantes.length + filesFromRequest.length === 0) {
      return next(new ErrorResponse('Esta actividad requiere al menos un adjunto', 400));
    }

    if (restantes.length + filesFromRequest.length > MAX_FILES) {
      return next(new ErrorResponse('Solo se permiten hasta 5 archivos adjuntos por actividad', 400));
    }

    if (idsParaEliminar.length > 0) {
      await Adjunto.deleteMany({
        _id: { $in: idsParaEliminar },
        progreso: id,
        actividadIndex
      });
    }

    if (filesFromRequest.length > 0) {
      const adjuntosParaCrear = filesFromRequest.map(file => ({
        progreso: id,
        usuario: req.user._id,
        actividadIndex,
        nombreArchivo: file.name,
        mimeType: file.mimetype,
        datos: file.data,
        tipoArchivo: file.mimetype === 'application/pdf' ? 'documento' : 'imagen'
      }));

      await Adjunto.insertMany(adjuntosParaCrear);
    }

    await progreso.save();

    if (
      estadoPrevio === 'pendiente' &&
      actividadExistente.actividad &&
      actividadExistente.actividad.requiereValidacion
    ) {
      const responsables = [
        progreso.residente.tutor,
        progreso.residente.profesor
      ]
        .filter(Boolean)
        .map(id => id.toString());

      const destinatarios = [...new Set(responsables)];

      const mensaje = `El residente ${progreso.residente.nombre} ${progreso.residente.apellidos} ha completado la actividad "${actividadExistente.actividad.nombre}" y requiere validación.`;

      for (const usuario of destinatarios) {
        await Notificacion.create({
          usuario,
          tipo: 'validacion',
          mensaje,
          enlace: '/dashboard/validaciones',
          entidadRelacionada: {
            tipo: 'progreso',
            id: progreso._id
          }
        });
      }
    }

    await progreso.populate(['fase', 'actividades.actividad', 'actividades.cirugia']);
    await progreso.populate({
      path: 'adjuntos',
      select: 'nombreArchivo mimeType fechaSubida actividadIndex'
    });

    res.status(200).json({ success: true, data: formatProgresoParaResidente(progreso) });
  } catch (err) {
    next(err);
  }
};

// GET /api/progreso/tutor/pendientes
// @access Private/Tutor|Profesor
const getProgresosPendientesDelHospital = async (req, res, next) => {
  try {
    if (req.user.rol !== 'tutor' && req.user.rol !== 'profesor' && req.user.rol !== 'csm') {
      return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    const pendientes = await ProgresoResidente.find({
      estado: { $in: ['pendiente', 'validado', 'rechazado'] }
    })
    .populate({
      path: 'residente',
      select: 'nombre apellidos hospital sociedad especialidad',
      match: req.user.rol === 'profesor'
        ? { sociedad: req.user.sociedad }
        : req.user.rol === 'tutor'
        ? {
            hospital: req.user.hospital,
            ...(req.user.especialidad !== 'ALL'
              ? { especialidad: req.user.especialidad }
              : {})
          }
        : {},
      populate: { path: 'hospital', select: 'zona' }
    })
    .populate({
      path: 'actividad',
      select: 'nombre descripcion fase',
      populate: { path: 'fase', select: 'nombre numero' }
    });

    // Filtrar los que sí pertenecen al hospital (match no quita nulls automáticamente)
    const filtrados = pendientes.filter(p => {
      if (!p.residente) return false;
      if (req.user.rol === 'csm') return p.residente.hospital && p.residente.hospital.zona === req.user.zona;
      if (req.user.rol === 'tutor')
        return (
          p.residente.hospital &&
          p.residente.hospital._id.toString() === req.user.hospital.toString() &&
          (req.user.especialidad === 'ALL' || p.residente.especialidad === req.user.especialidad)
        );
      return true;
    });

    res.status(200).json({
      success: true,
      count: filtrados.length,
      data: filtrados
    });
  } catch (err) {
    next(err);
  }
};


// @desc Obtener lista plana de validaciones pendientes por actividad
// @route GET /api/progreso/tutor/validaciones/pendientes
// @access Private/Tutor|Profesor
const getValidacionesPendientes = async (req, res, next) => {
  try {
    if (req.user.rol !== 'tutor' && req.user.rol !== 'profesor' && req.user.rol !== 'csm') {
      return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    const progresos = await ProgresoResidente.find()
      .populate({
        path: 'residente',
        match: req.user.rol === 'profesor'
          ? { sociedad: req.user.sociedad }
          : req.user.rol === 'tutor'
          ? {
              hospital: req.user.hospital,
              ...(req.user.especialidad !== 'ALL'
                ? { especialidad: req.user.especialidad }
                : {})
            }
          : {},
        select: 'nombre apellidos hospital sociedad especialidad',
        populate: { path: 'hospital', select: 'zona' }
      })
      .populate('fase')
      .populate('actividades.actividad')
      .populate('actividades.cirugia');

    const pendientes = [];
    const validadas = [];
    const rechazadas = [];

    const filtrados = progresos.filter(p => {
      if (!p.residente) return false;
      if (req.user.rol === 'csm') return p.residente.hospital && p.residente.hospital.zona === req.user.zona;
      return true;
    });

    const progresoIds = filtrados.map(p => p._id);
    const adjuntosPorActividad = new Map();

    if (progresoIds.length) {
      const adjuntos = await Adjunto.find({
        progreso: { $in: progresoIds },
        actividadIndex: { $ne: null }
      })
        .select('_id progreso actividadIndex nombreArchivo mimeType fechaSubida')
        .lean();

      adjuntos.forEach(adjunto => {
        const key = `${adjunto.progreso.toString()}-${adjunto.actividadIndex}`;
        if (!adjuntosPorActividad.has(key)) {
          adjuntosPorActividad.set(key, []);
        }
        adjuntosPorActividad.get(key).push({
          _id: adjunto._id,
          nombreArchivo: adjunto.nombreArchivo,
          mimeType: adjunto.mimeType,
          fechaSubida: adjunto.fechaSubida
        });
      });

      for (const lista of adjuntosPorActividad.values()) {
        lista.sort((a, b) => new Date(a.fechaSubida).getTime() - new Date(b.fechaSubida).getTime());
      }
    }

    for (const progreso of filtrados) {

      for (let index = 0; index < progreso.actividades.length; index++) {
        const actividad = progreso.actividades[index];
        const key = `${progreso._id.toString()}-${index}`;
        const adjuntos = adjuntosPorActividad.get(key) || [];

        const item = {
          _id: `${progreso._id}-${index}`,
          progresoId: progreso._id,
          index,
          actividad,
          residente: progreso.residente,
          fase: progreso.fase,
          fechaCreacion:
            actividad.fechaRealizacion || progreso.fechaRegistro,
          estado: actividad.estado,
          comentariosRechazo: actividad.comentariosRechazo || '',
          tieneAdjunto: adjuntos.length > 0,
          adjuntos
        };

        if (actividad.estado === 'completado') pendientes.push(item);
        if (actividad.estado === 'validado') validadas.push(item);
        if (actividad.estado === 'rechazado') rechazadas.push(item);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        pendientes,
        validadas,
        rechazadas
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc Obtener lista de validaciones pendientes sin filtros
// @route GET /api/progreso/admin/validaciones/pendientes
// @access Private/Admin
const getValidacionesPendientesAdmin = async (req, res, next) => {
  try {
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    const progresos = await ProgresoResidente.find()
      .populate({
        path: 'residente',
        select: 'nombre apellidos email tipo hospital sociedad'
      })
      .populate('fase')
      .populate('actividades.actividad')
      .populate('actividades.cirugia');

    const pendientes = [];
    const validadas = [];
    const rechazadas = [];

    const progresoIds = progresos.map(p => p._id);
    const adjuntosPorActividad = new Map();

    if (progresoIds.length) {
      const adjuntos = await Adjunto.find({
        progreso: { $in: progresoIds },
        actividadIndex: { $ne: null }
      })
        .select('_id progreso actividadIndex nombreArchivo mimeType fechaSubida')
        .lean();

      adjuntos.forEach(adjunto => {
        const key = `${adjunto.progreso.toString()}-${adjunto.actividadIndex}`;
        if (!adjuntosPorActividad.has(key)) {
          adjuntosPorActividad.set(key, []);
        }
        adjuntosPorActividad.get(key).push({
          _id: adjunto._id,
          nombreArchivo: adjunto.nombreArchivo,
          mimeType: adjunto.mimeType,
          fechaSubida: adjunto.fechaSubida
        });
      });

      for (const lista of adjuntosPorActividad.values()) {
        lista.sort((a, b) => new Date(a.fechaSubida).getTime() - new Date(b.fechaSubida).getTime());
      }
    }

    for (const progreso of progresos) {
      if (!progreso.residente) continue;

      for (let index = 0; index < progreso.actividades.length; index++) {
        const actividad = progreso.actividades[index];
        const key = `${progreso._id.toString()}-${index}`;
        const adjuntos = adjuntosPorActividad.get(key) || [];

        const item = {
          _id: `${progreso._id}-${index}`,
          progresoId: progreso._id,
          index,
          actividad,
          residente: progreso.residente,
          fase: progreso.fase,
          fechaCreacion:
            actividad.fechaRealizacion || progreso.fechaRegistro,
          estado: actividad.estado,
          comentariosRechazo: actividad.comentariosRechazo || '',
          tieneAdjunto: adjuntos.length > 0,
          adjuntos
        };

        if (actividad.estado === 'completado') pendientes.push(item);
        if (actividad.estado === 'validado') validadas.push(item);
        if (actividad.estado === 'rechazado') rechazadas.push(item);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        pendientes,
        validadas,
        rechazadas
      }
    });
  } catch (err) {
    next(err);
  }
};

  const validarActividad = async (req, res, next) => {
  try {
    const { id, index } = req.params;
    const { comentarios, firmaDigital } = req.body;

    const progreso = await ProgresoResidente.findById(id);
    await progreso.populate(['residente', 'fase', 'actividades.actividad', 'actividades.cirugia']); // ⬅️ AÑADIDO CRUCIAL

    if (!progreso || !progreso.actividades || !progreso.actividades[index]) {
      return next(new ErrorResponse('Progreso o actividad no válida', 404));
    }

    const actividad = progreso.actividades[index];
    if (!actividad || !actividad.actividad) {
      return next(new ErrorResponse('La actividad está incompleta o mal formada', 400));
    }

    if (actividad.estado !== 'completado') {
      return next(new ErrorResponse('Solo se pueden validar actividades completadas', 400));
    }

    actividad.estado = 'validado';
    actividad.comentariosTutor = comentarios;
    actividad.firmaDigital = firmaDigital;
    actividad.fechaValidacion = new Date();

    await progreso.save();
    await updatePhaseStatus(progreso);

    const destinatarios = [progreso.residente.tutor, progreso.residente.profesor].filter(Boolean);
    await Notificacion.updateMany(
      {
        usuario: { $in: destinatarios },
        'entidadRelacionada.tipo': 'progreso',
        'entidadRelacionada.id': progreso._id
      },
      { leida: true }
    );

    await Notificacion.create({
      usuario: progreso.residente._id,
      tipo: 'validacion',
      mensaje: `Tu actividad "${actividad.actividad.nombre || actividad.nombre}" ha sido validada.`
    });

    // Borrar adjuntos temporales asociados a la actividad
    await Adjunto.deleteMany({ progreso: id, actividadIndex: Number(index) });

    res.status(200).json({ success: true, data: progreso });
  } catch (err) {
    next(err);
  }
};


const rechazarActividad = async (req, res, next) => {
  try {
    const { id, index } = req.params;
    const { comentarios } = req.body;

    const progreso = await ProgresoResidente.findById(id)
      .populate('residente')
      .populate('fase')
      .populate('actividades.actividad')
      .populate('actividades.cirugia');
    if (!progreso || !progreso.actividades || !progreso.actividades[index]) {
      return next(new ErrorResponse('Progreso o actividad no válida', 404));
    }

    const actividad = progreso.actividades[index];
    if (!actividad || !actividad.actividad) {
      return next(new ErrorResponse('La actividad está incompleta o mal formada', 400));
    }

    if (actividad.estado !== 'completado') {
      return next(new ErrorResponse('Solo se pueden rechazar actividades completadas', 400));
    }

    actividad.estado = 'rechazado';
    actividad.comentariosRechazo = comentarios;
    actividad.fechaRechazo = new Date();

    await progreso.save();
    await progreso.populate(['fase', 'actividades.actividad', 'actividades.cirugia']);
    
    const destinatarios = [progreso.residente.tutor, progreso.residente.profesor].filter(Boolean);
    await Notificacion.updateMany(
      {
        usuario: { $in: destinatarios },
        'entidadRelacionada.tipo': 'progreso',
        'entidadRelacionada.id': progreso._id
      },
      { leida: true }
    );
    
    await Notificacion.create({
      usuario: progreso.residente._id,
      tipo: 'rechazo',
      mensaje: `Tu actividad "${actividad.actividad.nombre || actividad.nombre}" ha sido rechazada. Motivo: ${comentarios}`
    });

    await Adjunto.deleteMany({ progreso: id, actividadIndex: Number(index) });

    res.status(200).json({ success: true, data: progreso });
  } catch (err) {
    next(err);
  }
};



const crearProgresoParaUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;

  const usuario = await User.findById(id);
  if (!usuario || (usuario.rol !== 'residente' && usuario.rol !== 'participante')) {
      return res.status(400).json({ success: false, error: 'Usuario no válido o no es residente' });
  }

    const yaTiene = await ProgresoResidente.findOne({ residente: id });
    if (yaTiene) {
      return res.status(400).json({ success: false, error: 'Ya tiene progreso formativo' });
    }

    if (req.body.tipo) usuario.tipo = req.body.tipo;
    await inicializarProgresoFormativoDB(usuario);
    res.status(200).json({ success: true, message: 'Progreso formativo creado' });
  } catch (err) {
    next(err);
  }
};

const getCountProgresosByActividad = async (req, res, next) => {
  try {
    const count = await ProgresoResidente.countDocuments({
      'actividades.actividad': req.params.id
    });
    res.status(200).json({ success: true, count });
  } catch (err) {
    next(err);
  }
};

const getCountProgresosByFase = async (req, res, next) => {
  try {
    const count = await ProgresoResidente.countDocuments({ fase: req.params.id });
    res.status(200).json({ success: true, count });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  inicializarProgresoFormativo,
  getAllProgreso,
  getSeguimientoUsuarios,
  getProgresoResidente,
  getProgresoResidentePorFase,
  registrarProgreso,
  actualizarProgreso,
  validarProgreso,
  rechazarProgreso,
  getEstadisticasResidente,
  marcarActividadCompletada,
  getProgresosPendientesDelHospital,
  getValidacionesPendientes,
  getValidacionesPendientesAdmin,
  validarActividad,
  rechazarActividad,
  crearProgresoParaUsuario,
  updatePhaseStatus,
  getCountProgresosByActividad,
  getCountProgresosByFase
};
