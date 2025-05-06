
const ProgresoResidente = require('../models/ProgresoResidente');
const Actividad = require('../models/Actividad');

/**
 * Inicializa el progreso formativo para un usuario residente.
 * @param {Object} usuario - Objeto de usuario (debe ser rol: 'residente').
 * @returns {Promise<Number>} - Número de registros insertados.
 */
const inicializarProgresoFormativo = async (usuario) => {
  if (!usuario || usuario.rol !== 'residente') {
    throw new Error('Usuario no válido o no es residente');
  }

  const actividades = await Actividad.find().populate('fase');

  const nuevosRegistros = actividades.map((act) => ({
    residente: usuario._id,
    actividad: act._id,
    estado: act.requiereValidacion ? 'pendiente' : 'validado',
    comentarios: '',
    fechaRegistro: new Date(),
  }));

  await ProgresoResidente.insertMany(nuevosRegistros);
  return nuevosRegistros.length;
};

module.exports = { inicializarProgresoFormativo };
