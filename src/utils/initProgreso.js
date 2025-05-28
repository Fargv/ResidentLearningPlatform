const ProgresoResidente = require('../models/ProgresoResidente');
const Fase = require('../models/Fase');

/**
 * Inicializa el progreso formativo agrupado por fase para un residente.
 * @param {Object} usuario - Usuario recién creado con rol 'residente'.
 */
const inicializarProgresoFormativo = async (usuario) => {
  try {
    const fases = await Fase.find().populate('actividades');

    for (const fase of fases) {
      const actividades = fase.actividades.map(act => ({
        actividad: act._id,
        nombre: act.nombre,
        completada: false,
        estado: null,
        comentariosResidente: '',
        comentariosFormador: '',
        fechaRealizacion: null,
        firmaDigital: '',
      }));

      await ProgresoResidente.create({
        residente: usuario._id,
        fase: fase._id,
        actividades,
        estadoGeneral: 'bloqueada',
        fechaRegistro: new Date(),
      });
    }

    console.log(`✅ Progreso inicializado para ${usuario.email}`);
  } catch (err) {
    console.error('❌ Error al inicializar progreso formativo:', err);
  }
};

module.exports = inicializarProgresoFormativo;

