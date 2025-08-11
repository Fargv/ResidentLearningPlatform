const ErrorResponse = require('../utils/errorResponse');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const ProgresoResidente = require('../models/ProgresoResidente');
const { createAuditLog } = require('../utils/auditLog');

// @desc    Obtener todos los hospitales
// @route   GET /api/hospitals
// @access  Private/Admin
exports.getHospitals = async (req, res, next) => {
  try {
    const hospitals = await Hospital.find();

    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener un hospital específico
// @route   GET /api/hospitals/:id
// @access  Private
exports.getHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return next(new ErrorResponse(`Hospital no encontrado con id ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: hospital
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Crear un nuevo hospital
// @route   POST /api/hospitals
// @access  Private/Admin
exports.createHospital = async (req, res, next) => {
  try {
    const fields = ['nombre','codigoNumerico','direccion','ciudad','provincia','zona','codigoPostal','telefono','email','tipoSistema','activo','urlHospiLogo'];
    const data = {};
    fields.forEach(f => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });
    const hospital = await Hospital.create(data);
    
    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'crear_hospital',
      descripcion: `Hospital creado: ${hospital.nombre}`,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      data: hospital
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar un hospital
// @route   PUT /api/hospitals/:id
// @access  Private/Admin
exports.updateHospital = async (req, res, next) => {
  try {
    let hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return next(new ErrorResponse(`Hospital no encontrado con id ${req.params.id}`, 404));
    }

    const prevZona = hospital.zona;

    const fields = ['nombre','codigoNumerico','direccion','ciudad','provincia','zona','codigoPostal','telefono','email','tipoSistema','activo','urlHospiLogo'];
    const updates = {};
    fields.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    hospital = await Hospital.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (updates.zona && updates.zona !== prevZona) {
      await User.updateMany({ hospital: hospital._id }, { zona: updates.zona });
    }
    
    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'actualizar_hospital',
      descripcion: `Hospital actualizado: ${hospital.nombre}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: hospital
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Eliminar un hospital
// @route   DELETE /api/hospitals/:id
// @access  Private/Admin
exports.deleteHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return next(new ErrorResponse(`Hospital no encontrado con id ${req.params.id}`, 404));
    }

     // Obtener usuarios asociados
    const users = await User.find({ hospital: req.params.id });
    const userIds = users.map(u => u._id);

    // Contar progresos de estos usuarios
    const progressCount = await ProgresoResidente.countDocuments({ residente: { $in: userIds } });

    // Eliminar progresos y usuarios
    await ProgresoResidente.deleteMany({ residente: { $in: userIds } });
    await User.deleteMany({ hospital: req.params.id });

    await hospital.remove();

    // Crear registro de auditoría
    await createAuditLog({
      usuario: req.user._id,
      accion: 'eliminar_hospital',
      descripcion: `Hospital eliminado: ${hospital.nombre}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      deletedUsers: users.length,
      deletedProgress: progressCount,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener residentes de un hospital
// @route   GET /api/hospitals/:id/residentes
// @access  Private/Admin,tutor
exports.getHospitalResidentes = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return next(new ErrorResponse(`Hospital no encontrado con id ${req.params.id}`, 404));
    }

    const residentes = await User.find({ 
      hospital: req.params.id,
      rol: 'residente'
    });

    res.status(200).json({
      success: true,
      count: residentes.length,
      data: residentes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener tutores de un hospital
// @route   GET /api/hospitals/:id/tutores
// @access  Private/Admin
exports.getHospitalTutores = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return next(new ErrorResponse(`Hospital no encontrado con id ${req.params.id}`, 404));
    }

    const tutores = await User.find({
      hospital: req.params.id,
      rol: 'tutor'
    });

    res.status(200).json({
      success: true,
      count: tutores.length,
      data: tutores
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener estadísticas de un hospital
// @route   GET /api/hospitals/:id/stats
// @access  Private/Admin,tutor
exports.getHospitalStats = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return next(new ErrorResponse(`Hospital no encontrado con id ${req.params.id}`, 404));
    }

  // Contar residentes y tutores
  const residentesCount = await User.countDocuments({
    hospital: req.params.id,
    rol: 'residente'
  });

  const tutoresCount = await User.countDocuments({
    hospital: req.params.id,
    rol: 'tutor'
  });

    // Obtener estadísticas adicionales si es necesario
    // Aquí se podrían agregar más consultas para obtener estadísticas de progreso, etc.

    res.status(200).json({
      success: true,
      data: {
        residentes: residentesCount,
        tutores: tutoresCount,
        tipoSistema: hospital.tipoSistema
      }
    });
  } catch (err) {
    next(err);
  }
};
