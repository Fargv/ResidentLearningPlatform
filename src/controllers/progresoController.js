const ErrorResponse = require('../utils/errorResponse');
const ProgresoResidente = require('../models/ProgresoResidente');
const Actividad = require('../models/Actividad');
const User = require('../models/User');
const Validacion = require('../models/Validacion');
const Adjunto = require('../models/Adjunto');
const Notificacion = require('../models/Notificacion');
const { createAuditLog } = require('../utils/auditLog');
const mongoose = require('mongoose');

// @desc    Obtener todos los registros de progreso
// @route   GET /api/progreso
// @access  Private/Admin
exports.getAllProgreso = async (req, res, next) => {
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
      .populate({
        path: 'actividad',
        select: 'nombre descripcion tipo fase',
        populate: { path: 'fase', select: 'nombre numero' }
      });

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

exports.inicializarProgresoFormativo = async (req, res, next) => {
  try {
    const residente = await User.findById(req.params.id);
    if (!residente || residente.rol !== 'residente') {
      return next(new ErrorResponse('Residente no válido', 404));
    }

    const actividades = await Actividad.find().populate('fase');

    const nuevosRegistros = actividades.map((act) => ({
      residente: residente._id,
      actividad: act._id,
      estado: act.requiereValidacion ? 'pendiente' : 'validado',
      comentarios: '',
      fechaRegistro: new Date()
    }));

    await ProgresoResidente.insertMany(nuevosRegistros);

    res.status(200).json({ success: true, count: nuevosRegistros.length });
  } catch (err) {
    next(err);
  }
};

exports.getProgresoResidente = async (req, res, next) => {
  try {
    const residente = await User.findById(req.params.id);

    if (!residente) {
      return next(new ErrorResponse(`Residente no encontrado con id ${req.params.id}`, 404));
    }

    if (residente.rol !== 'residente') {
      return next(new ErrorResponse(`El usuario con id ${req.params.id} no es un residente`, 400));
    }

    if (
      req.user.rol === 'residente' && req.user.id !== req.params.id
    ) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver el progreso de otro residente' });
    }

    if (
      req.user.rol === 'formador' && req.user.hospital.toString() !== residente.hospital.toString()
    ) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver residentes de otro hospital' });
    }

    const progresoRaw = await ProgresoResidente.find({ residente: new mongoose.Types.ObjectId(req.params.id) })
      .populate({
        path: 'actividad',
        select: 'nombre descripcion tipo fase',
        populate: { path: 'fase', select: 'nombre numero' }
      });

    const agrupadoPorFase = {};

    for (const prog of progresoRaw) {
      const faseId = prog.actividad.fase._id;
      if (!agrupadoPorFase[faseId]) {
        agrupadoPorFase[faseId] = {
          fase: prog.actividad.fase,
          actividades: [],
          estadoGeneral: 'en progreso',
        };
      }

      agrupadoPorFase[faseId].actividades.push({
        nombre: prog.actividad.nombre,
        completada: prog.estado === 'validado',
        comentariosResidente: prog.comentarios,
        estado: prog.estado
      });
    }

    res.status(200).json({
      success: true,
      data: Object.values(agrupadoPorFase)
    });
  } catch (err) {
    next(err);
  }
};

exports.getProgresoResidentePorFase = async (req, res, next) => {
  try {
    const residente = await User.findById(req.params.id);

    if (!residente) {
      return next(new ErrorResponse(`Residente no encontrado con id ${req.params.id}`, 404));
    }

    if (residente.rol !== 'residente') {
      return next(new ErrorResponse(`El usuario con id ${req.params.id} no es un residente`, 400));
    }

    if (
      req.user.rol === 'residente' && req.user.id !== req.params.id
    ) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver el progreso de otro residente' });
    }

    if (
      req.user.rol === 'formador' && req.user.hospital.toString() !== residente.hospital.toString()
    ) {
      return res.status(403).json({ success: false, error: 'No autorizado para ver residentes de otro hospital' });
    }

    const actividades = await Actividad.find({ fase: req.params.faseId });
    const actividadesIds = actividades.map(act => act._id);

    const progreso = await ProgresoResidente.find({ 
      residente: req.params.id,
      actividad: { $in: actividadesIds }
    })
      .populate({
        path: 'actividad',
        select: 'nombre descripcion tipo fase',
        populate: { path: 'fase', select: 'nombre numero' }
      })
      .populate({
        path: 'validaciones',
        populate: { 
          path: 'formador',
          select: 'nombre apellidos email'
        }
      })
      .populate('adjuntos');

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
exports.registrarProgreso = async (req, res, next) => {
  try {
    // Si el usuario es residente, solo puede registrar su propio progreso
    if (req.user.rol === 'residente' && req.body.residente !== req.user.id) {
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

    if (residente.rol !== 'residente') {
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
      .populate({
        path: 'actividad',
        select: 'nombre descripcion tipo fase',
        populate: { path: 'fase', select: 'nombre numero' }
      });

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
exports.actualizarProgreso = async (req, res, next) => {
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
      (req.user.rol !== 'formador' || req.user.hospital.toString() !== progreso.residente.hospital.toString())
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
      .populate({
        path: 'actividad',
        select: 'nombre descripcion tipo fase',
        populate: { path: 'fase', select: 'nombre numero' }
      });

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
// @access  Private/Formador,Admin
exports.validarProgreso = async (req, res, next) => {
  try {
    // Verificar que el usuario es formador o administrador
    if (req.user.rol !== 'formador' && req.user.rol !== 'administrador') {
      return next(new ErrorResponse('No autorizado para validar progreso', 403));
    }

    const progreso = await ProgresoResidente.findById(req.params.id)
      .populate('residente')
      .populate('actividad');

    if (!progreso) {
      return next(new ErrorResponse(`Progreso no encontrado con id ${req.params.id}`, 404));
    }

    // Si es formador, verificar que pertenece al mismo hospital que el residente
    if (req.user.rol === 'formador' && req.user.hospital.toString() !== progreso.residente.hospital.toString()) {
      return next(new ErrorResponse('No autorizado para validar progreso de residentes de otro hospital', 403));
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
            path: 'actividad',
            select: 'nombre descripcion'
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
// @access  Private/Formador,Admin
exports.rechazarProgreso = async (req, res, next) => {
  try {
    // Verificar que el usuario es formador o administrador
    if (req.user.rol !== 'formador' && req.user.rol !== 'administrador') {
      return next(new ErrorResponse('No autorizado para rechazar progreso', 403));
    }

    const progreso = await ProgresoResidente.findById(req.params.id)
      .populate('residente')
      .populate('actividad');

    if (!progreso) {
      return next(new ErrorResponse(`Progreso no encontrado con id ${req.params.id}`, 404));
    }

    // Si es formador, verificar que pertenece al mismo hospital que el residente
    if (req.user.rol === 'formador' && req.user.hospital.toString() !== progreso.residente.hospital.toString()) {
      return next(new ErrorResponse('No autorizado para rechazar progreso de residentes de otro hospital', 403));
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
exports.getEstadisticasResidente = async (req, res, next) => {
  try {
    const residente = await User.findById(req.params.id);

    if (!residente) {
      return next(new ErrorResponse(`Residente no encontrado con id ${req.params.id}`, 404));
    }

    if (residente.rol !== 'residente') {
      return next(new ErrorResponse(`El usuario con id ${req.params.id} no es un residente`, 400));
    }

    // Verificar permisos: solo el propio residente, formadores de su hospital o administradores
    if (
      req.user.rol !== 'administrador' && 
      req.user.id !== req.params.id && 
      (req.user.rol !== 'formador' || req.user.hospital.toString() !== residente.hospital.toString())
    ) {
      return next(new ErrorResponse('No autorizado para acceder a este recurso', 403));
    }

    // Obtener todas las actividades agrupadas por fase
    const fases = await Actividad.aggregate([
      {
        $lookup: {
          from: 'fases',
          localField: 'fase',
          foreignField: '_id',
          as: 'faseInfo'
        }
      },
      {
        $unwind: '$faseInfo'
      },
      {
        $group: {
          _id: '$fase',
          fase: { $first: '$faseInfo' },
          totalActividades: { $sum: 1 },
          actividades: { $push: '$$ROOT' }
        }
      },
      {
        $sort: { 'fase.orden': 1 }
      }
    ]);

    // Obtener progreso del residente
    const progreso = await ProgresoResidente.find({ residente: req.params.id })
      .populate('actividad');

    // Calcular estadísticas
    const estadisticas = fases.map(fase => {
      const actividadesFase = fase.actividades.map(act => act._id.toString());
      
      const progresoFase = progreso.filter(p => 
        actividadesFase.includes(p.actividad._id.toString())
      );
      
      const completadas = progresoFase.filter(p => p.estado === 'validado').length;
      const pendientes = progresoFase.filter(p => p.estado === 'pendiente').length;
      const rechazadas = progresoFase.filter(p => p.estado === 'rechazado').length;
      
      const porcentajeCompletado = fase.totalActividades > 0 
        ? Math.round((completadas / fase.totalActividades) * 100) 
        : 0;
      
      return {
        fase: {
          _id: fase._id,
          nombre: fase.fase.nombre,
          numero: fase.fase.numero,
          orden: fase.fase.orden
        },
        totalActividades: fase.totalActividades,
        completadas,
        pendientes,
        rechazadas,
        porcentajeCompletado
      };
    });

    // Calcular estadísticas globales
    const totalActividades = fases.reduce((sum, fase) => sum + fase.totalActividades, 0);
    const totalCompletadas = estadisticas.reduce((sum, est) => sum + est.completadas, 0);
    const porcentajeTotal = totalActividades > 0 
      ? Math.round((totalCompletadas / totalActividades) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        porcentajeTotal,
        totalActividades,
        totalCompletadas,
        fases: estadisticas
      }
    });
  } catch (err) {
    next(err);
  }
};
