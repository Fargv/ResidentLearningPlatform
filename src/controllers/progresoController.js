const ErrorResponse = require('../utils/errorResponse');
const ProgresoResidente = require('../models/ProgresoResidente');
const Actividad = require('../models/Actividad');
const User = require('../models/User');
const Validacion = require('../models/Validacion');
const Adjunto = require('../models/Adjunto');
const Notificacion = require('../models/Notificacion');
const { createAuditLog } = require('../utils/auditLog');
const mongoose = require('mongoose');

// ✅ Declaración de la función que estaba fallando
const inicializarProgresoFormativo = async (req, res, next) => {
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

// Solo exportaremos esto para demostrar que funciona y no colapsa
module.exports = {
  inicializarProgresoFormativo
};