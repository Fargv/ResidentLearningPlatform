const ProgresoResidente = require('../models/ProgresoResidente');
const Fase = require('../models/Fase');

/**
 * Inicializa el progreso formativo agrupado por fase para un residente.
 * @param {Object} usuario - Usuario recién creado con rol 'residente'.
 */
const inicializarProgresoFormativo = async (usuario) => {
  try {
    const fases = await Fase.find()
      .sort('orden')
      .populate({ path: 'actividades', options: { sort: { orden: 1 } } });
    for (let i = 0; i < fases.length; i++) {
      const fase = fases[i];
      const actividades = fase.actividades.map(act => ({
        actividad: act._id,
        nombre: act.nombre,
        completada: false,
        estado: 'pendiente',
        comentariosResidente: '',
        comentariosFormador: '',
        fechaRealizacion: null,
        firmaDigital: '',
      }));

      await ProgresoResidente.create({
        residente: usuario._id,
        fase: fase._id,
        actividades,
        estadoGeneral: i === 0 ? 'en progreso' : 'bloqueada',
        fechaRegistro: new Date(),
      });
    }

    console.log(`✅ Progreso inicializado para ${usuario.email}`);
  } catch (err) {
    console.error('❌ Error al inicializar progreso formativo:', err);
  }
};

module.exports = { inicializarProgresoFormativo };


