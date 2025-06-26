const ErrorResponse = require('../utils/errorResponse');
const ProgresoResidente = require('../models/ProgresoResidente');
const Actividad = require('../models/Actividad');
const User = require('../models/User');
const Validacion = require('../models/Validacion');
const Adjunto = require('../models/Adjunto');
const Notificacion = require('../models/Notificacion');
const Fase = require('../models/Fase');
const { createAuditLog } = require('../utils/auditLog');
const mongoose = require('mongoose');
const { inicializarProgresoFormativo: inicializarProgresoFormativoDB } = require('../utils/initProgreso');

const updatePhaseStatus = async (progreso) => {
  await progreso.populate(['fase', 'residente']);

  const todasValidadas = progreso.actividades.every(a => a.estado === 'validado');
  if (!todasValidadas) {
    console.log(`⏳ No todas las actividades están validadas aún en fase "${progreso.fase.nombre}" para ${progreso.residente.email}`);
    return;
  }

  if (progreso.estadoGeneral !== 'validado') {
    progreso.estadoGeneral = 'validado';
    await progreso.save();
    console.log(`✅ Fase "${progreso.fase.nombre}" marcada como COMPLETADA para ${progreso.residente.email}`);
  }

  const ModeloFase = mongoose.model(progreso.faseModel || 'Fase');
  const nextFase = await ModeloFase.findOne({ orden: progreso.fase.orden + 1 });
  if (!nextFase) {
    console.log(`🎉 No hay más fases después de "${progreso.fase.nombre}". Fin del plan formativo para ${progreso.residente.email}`);
    return;
  }

  const nextProgreso = await ProgresoResidente.findOne({
    residente: progreso.residente._id,
    fase: nextFase._id
  });

  if (nextProgreso && nextProgreso.estadoGeneral === 'bloqueada') {
    nextProgreso.estadoGeneral = 'en progreso';
    await nextProgreso.save();
    console.log(`🚀 Fase "${nextFase.nombre}" DESBLOQUEADA para ${progreso.residente.email}`);
  } else {
    console.log(`ℹ️ Fase "${nextFase.nombre}" ya estaba desbloqueada o no encontrada`);
  }
};




const inicializarProgresoFormativo = async (req, res, next) => {
  try {
  const user = await User.findById(req.params.id);
  if (!user || (user.rol !== 'residente' && user.rol !== 'alumno')) {
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
      .populate('actividades.actividad');

    res.status(200).json({
      success: true,
      count: progreso.length,
      data: progreso
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
    const residente = await User.findById(req.params.id);

    if (!residente) {
      return next(new ErrorResponse(`Residente no encontrado con id ${req.params.id}`, 404));
    }

  if (residente.rol !== 'residente' && residente.rol !== 'alumno') {
      return next(new ErrorResponse(`El usuario con id ${req.params.id} no es un residente`, 400));
  }

  if ((req.user.rol === 'residente' || req.user.rol === 'alumno') && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver el progreso de otro residente' });
  }


    if (req.user.rol === 'formador' && req.user.hospital.toString() !== residente.hospital.toString()) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver residentes de otro hospital' });
    }

    if (req.user.rol === 'instructor' && (!residente.sociedad || req.user.sociedad.toString() !== residente.sociedad.toString())) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver residentes de otra sociedad' });
    }

    const progresoPorFase = await ProgresoResidente.find({ residente: req.params.id })
      .populate('fase')
      .populate('actividades.actividad');

    // Ordenar las fases por su campo 'orden'
    progresoPorFase.sort((a, b) => a.fase.orden - b.fase.orden);
      const resultado = progresoPorFase.map(item => {
        return {
          _id: item._id.toString(),
          fase: item.fase,
          estadoGeneral: item.estadoGeneral,
          actividades: item.actividades.map(act => ({
            nombre: act.nombre,
            completada: act.estado === 'validado',
            comentariosResidente: act.comentariosResidente || '',
            fecha: act.fechaRealizacion,
            estado: act.estado
          }))
        };
      });
      

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
    const residente = await User.findById(req.params.id);

    if (!residente) {
      return next(new ErrorResponse(`Residente no encontrado con id ${req.params.id}`, 404));
    }

  if (residente.rol !== 'residente' && residente.rol !== 'alumno') {
      return next(new ErrorResponse(`El usuario con id ${req.params.id} no es un residente`, 400));
  }

  if ((req.user.rol === 'residente' || req.user.rol === 'alumno') && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver el progreso de otro residente' });
  }

    if (req.user.rol === 'formador' && req.user.hospital.toString() !== residente.hospital.toString()) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver residentes de otro hospital' });
    }

    const progreso = await ProgresoResidente.find({ residente: req.params.id })
      .populate('fase')
      .populate('actividades.actividad');

    res.status(200).json({
      success: true,
      count: progreso.length,
      data: progreso
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
  if ((req.user.rol === 'residente' || req.user.rol === 'alumno') && req.body.residente !== req.user.id) {
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

  if (residente.rol !== 'residente' && residente.rol !== 'alumno') {
      return next(new ErrorResponse(`El usuario con id ${req.body.residente} no es un residente`, 400));
  }

    // Crear el registro de progreso
    const progreso = await ProgresoResidente.create({
      ...req.body,
      estado: actividad.requiereValidacion ? 'pendiente' : 'completado'
    });

    // Si la actividad requiere validación, crear notificación para los formadores
    if (actividad.requiereValidacion) {
      // Obtener formadores del hospital del residente
      const formadores = await User.find({
        hospital: residente.hospital,
        rol: 'formador'
      });

      // Crear notificaciones para cada formador
      const notificacionesPromises = formadores.map(formador => {
        return Notificacion.create({
          usuario: formador._id,
          tipo: 'validacion',
          mensaje: `El residente ${residente.nombre} ${residente.apellidos} ha completado la actividad "${actividad.nombre}" y requiere validación.`,
          entidadRelacionada: {
            tipo: 'progreso',
            id: progreso._id
          }
        });
      });

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
      .populate('actividades.actividad');

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
      .populate('residente')
      .populate('actividad');

    if (!progreso) {
      return next(new ErrorResponse(`Progreso no encontrado con id ${req.params.id}`, 404));
    }

    // Verificar permisos: solo el propio residente, formadores de su hospital o administradores
    if (
      req.user.rol !== 'administrador' &&
      req.user.id !== progreso.residente._id.toString() &&
      (
        (req.user.rol !== 'formador' || req.user.hospital.toString() !== progreso.residente.hospital.toString()) &&
        (req.user.rol !== 'instructor' || !progreso.residente.sociedad || req.user.sociedad.toString() !== progreso.residente.sociedad.toString())
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
      .populate('actividades.actividad');

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
// @access  Private/Formador|Instructor|Admin
const validarProgreso = async (req, res, next) => {
  try {
    // Verificar que el usuario es formador, instructor o administrador
    if (req.user.rol !== 'formador' && req.user.rol !== 'instructor' && req.user.rol !== 'administrador') {
      return next(new ErrorResponse('No autorizado para validar progreso', 403));
    }

    const progreso = await ProgresoResidente.findById(req.params.id)
      .populate('residente')
      .populate('actividad');

    if (!progreso) {
      return next(new ErrorResponse(`Progreso no encontrado con id ${req.params.id}`, 404));
    }

    // Si es formador o instructor, verificar que pertenece al mismo hospital o sociedad que el residente
    if (
      (req.user.rol === 'formador' && req.user.hospital.toString() !== progreso.residente.hospital.toString()) ||
      (req.user.rol === 'instructor' && (!progreso.residente.sociedad || req.user.sociedad.toString() !== progreso.residente.sociedad.toString()))
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
      formador: req.user._id,
      comentarios: req.body.comentarios,
      firmaDigital: req.body.firmaDigital,
    });

    // Registrar información de auditoría
    await validacion.registrarAuditoria(req.ip, req.headers['user-agent']);

    // Actualizar estado del progreso
    progreso.estado = 'validado';
    await progreso.save();

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
          }
        ]
      })
      .populate('formador', 'nombre apellidos email');

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
// @access  Private/Formador|Instructor|Admin
const rechazarProgreso = async (req, res, next) => {
  try {
    // Verificar que el usuario es formador, instructor o administrador
    if (req.user.rol !== 'formador' && req.user.rol !== 'instructor' && req.user.rol !== 'administrador') {
      return next(new ErrorResponse('No autorizado para rechazar progreso', 403));
    }

    const progreso = await ProgresoResidente.findById(req.params.id)
      .populate('residente')
      .populate('actividad');

    if (!progreso) {
      return next(new ErrorResponse(`Progreso no encontrado con id ${req.params.id}`, 404));
    }

    // Si es formador o instructor, verificar que pertenece al mismo hospital o sociedad que el residente
    if (
      (req.user.rol === 'formador' && req.user.hospital.toString() !== progreso.residente.hospital.toString()) ||
      (req.user.rol === 'instructor' && (!progreso.residente.sociedad || req.user.sociedad.toString() !== progreso.residente.sociedad.toString()))
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
      .populate('actividades.actividad');

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
    const { fechaRealizacion, comentariosResidente } = req.body;

    const progreso = await ProgresoResidente.findById(id);
    if (!progreso || !progreso.actividades || !progreso.actividades[index]) {
      return next(new ErrorResponse('Progreso o actividad no válida', 404));
    }

    const actividadOriginal = progreso.actividades[index];
    if (!actividadOriginal || !actividadOriginal.actividad) {
      return next(new ErrorResponse('La actividad está incompleta o mal formada', 400));
    }

    const actividadExistente = progreso.actividades[index];

          actividadExistente.estado = 'completado';
          actividadExistente.completada = true;
          actividadExistente.fechaRealizacion = fechaRealizacion ? new Date(fechaRealizacion) : new Date();
          actividadExistente.comentariosResidente = comentariosResidente;


    await progreso.save();

    res.status(200).json({ success: true, data: progreso });
  } catch (err) {
    next(err);
  }
};

// GET /api/progreso/formador/pendientes
// @access Private/Formador|Instructor
const getProgresosPendientesDelHospital = async (req, res, next) => {
  try {
    if (req.user.rol !== 'formador' && req.user.rol !== 'instructor') {
      return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    const pendientes = await ProgresoResidente.find({
      estado: { $in: ['pendiente', 'validado', 'rechazado'] }
    })
    .populate({
      path: 'residente',
      select: 'nombre apellidos hospital sociedad',
      match: req.user.rol === 'instructor'
        ? { sociedad: req.user.sociedad } // Filtra por sociedad para instructores
        : { hospital: req.user.hospital } // Filtra por hospital para formadores
    })
    .populate({
      path: 'actividad',
      select: 'nombre descripcion fase',
      populate: { path: 'fase', select: 'nombre numero' }
    });

    // Filtrar los que sí pertenecen al hospital (match no quita nulls automáticamente)
    const filtrados = pendientes.filter(p => p.residente !== null);

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
// @route GET /api/progreso/formador/validaciones/pendientes
// @access Private/Formador|Instructor
const getValidacionesPendientes = async (req, res, next) => {
  try {
    if (req.user.rol !== 'formador' && req.user.rol !== 'instructor') {
      return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    const progresos = await ProgresoResidente.find()
      .populate({
        path: 'residente',
        match: req.user.rol === 'instructor'
          ? { sociedad: req.user.sociedad }
          : { hospital: req.user.hospital },
        select: 'nombre apellidos hospital sociedad'
      })
      .populate('fase')
      .populate('actividades.actividad');

    const pendientes = [];
    const validadas = [];
    const rechazadas = [];

    for (const progreso of progresos) {
      if (!progreso.residente) continue;

      progreso.actividades.forEach((actividad, index) => {
        const item = {
          _id: `${progreso._id}-${index}`,
          progresoId: progreso._id,
          index,
          actividad,
          residente: progreso.residente,
          fase: progreso.fase,
          fechaCreacion: actividad.fechaRealizacion || progreso.fechaRegistro,
          estado: actividad.estado
        };

        if (actividad.estado === 'completado') pendientes.push(item);
        if (actividad.estado === 'validado') validadas.push(item);
        if (actividad.estado === 'rechazado') rechazadas.push(item);
      });
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
    await progreso.populate(['residente', 'fase']); // ⬅️ AÑADIDO CRUCIAL

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
    actividad.comentariosFormador = comentarios;
    actividad.firmaDigital = firmaDigital;
    actividad.fechaValidacion = new Date();

    await progreso.save();
    await updatePhaseStatus(progreso);

    await Notificacion.create({
      usuario: progreso.residente._id,
      tipo: 'validacion',
      mensaje: `Tu actividad "${actividad.actividad.nombre || actividad.nombre}" ha sido validada.`
    });

    res.status(200).json({ success: true, data: progreso });
  } catch (err) {
    next(err);
  }
};


const rechazarActividad = async (req, res, next) => {
  try {
    const { id, index } = req.params;
    const { comentarios } = req.body;

    const progreso = await ProgresoResidente.findById(id).populate('residente');
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
  if (!usuario || (usuario.rol !== 'residente' && usuario.rol !== 'alumno')) {
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
  validarActividad,
  rechazarActividad,
  crearProgresoParaUsuario,
  updatePhaseStatus,
  getCountProgresosByActividad,
  getCountProgresosByFase
};
