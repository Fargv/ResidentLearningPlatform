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
    let createdCount = 0;
    for (let i = 0; i < fases.length; i++) {
      const fase = fases[i];

      if (fase.actividades.length === 0) {
        console.warn(`⚠️  La fase "${fase.nombre}" no tiene actividades asociadas`);
        continue;
      }

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
      createdCount += 1;
    }

    console.log(`✅ Progreso inicializado para ${usuario.email}: ${createdCount} registros creados`);
    return createdCount;
  } catch (err) {
    console.error('❌ Error al inicializar progreso formativo:', err);
  }
};

module.exports = { inicializarProgresoFormativo };