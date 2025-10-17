const ErrorResponse = require('../utils/errorResponse');
const ProgresoResidente = require('../models/ProgresoResidente');
const Actividad = require('../models/Actividad');
const User = require('../models/User');
const Validacion = require('../models/Validacion');
const Adjunto = require('../models/Adjunto');
const Notificacion = require('../models/Notificacion');
const Fase = require('../models/Fase');
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
    actividades: (plain.actividades || []).map((act, index) => ({
      nombre: act.nombre,
      tipo: act.tipo,
      completada: act.estado === 'validado',
      comentariosResidente: act.comentariosResidente || '',
      comentariosTutor: act.comentariosTutor || '',
      fecha: act.fechaRealizacion,
      fechaValidacion: act.fechaValidacion,
      comentariosRechazo: act.comentariosRechazo || '',
      fechaRechazo: act.fechaRechazo,
      estado: act.estado,
      porcentajeParticipacion: act.porcentajeParticipacion,
      cirugia: act.cirugia,
      otraCirugia: act.otraCirugia,
      nombreCirujano: act.nombreCirujano,
      adjuntos: adjuntosPorIndice[index] || []
    }))
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

    if (req.user.rol === 'profesor' && (!residente.sociedad || req.user.sociedad.toString() !== residente.sociedad.toString())) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver residentes de otra sociedad' });
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
        actividades: plain.actividades.map((act, index) => ({
          ...act,
          adjuntos: adjuntosPorIndice[index] || []
        }))
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

    // Si el residente adjunta un archivo, guardarlo como Adjunto en MongoDB
    if (req.files && req.files.adjunto) {
      const file = req.files.adjunto;
      const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
      if (!allowed.includes(file.mimetype)) {
        return next(new ErrorResponse('Tipo de archivo no permitido', 400));
      }
      if (file.size > 5 * 1024 * 1024) {
        return next(new ErrorResponse('El archivo supera el límite de 5MB', 400));
      }
      await Adjunto.deleteMany({ progreso: id, actividadIndex: Number(index) });
      await Adjunto.create({
        progreso: id,
        usuario: req.user._id,
        actividadIndex: Number(index),
        nombreArchivo: file.name,
        mimeType: file.mimetype,
        datos: file.data,
        tipoArchivo: file.mimetype === 'application/pdf' ? 'documento' : 'imagen'
      });
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

    for (const progreso of filtrados) {

      for (let index = 0; index < progreso.actividades.length; index++) {
        const actividad = progreso.actividades[index];
        const existeAdjunto = await Adjunto.exists({
          progreso: progreso._id,
          actividadIndex: index
        });

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
          tieneAdjunto: !!existeAdjunto
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
        select: 'nombre apellidos tipo hospital sociedad'
      })
      .populate('fase')
      .populate('actividades.actividad')
      .populate('actividades.cirugia');

    const pendientes = [];
    const validadas = [];
    const rechazadas = [];

    for (const progreso of progresos) {
      if (!progreso.residente) continue;

      for (let index = 0; index < progreso.actividades.length; index++) {
        const actividad = progreso.actividades[index];
        const existeAdjunto = await Adjunto.exists({
          progreso: progreso._id,
          actividadIndex: index
        });

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
          tieneAdjunto: !!existeAdjunto
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
