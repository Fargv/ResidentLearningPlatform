const ProgresoResidente = require('../models/ProgresoResidente');
const Fase = require('../models/Fase');
const Actividad = require('../models/Actividad');

const inicializarProgresoFormativo = async (usuario) => {
  try {
    const fases = await Fase.find().sort('orden');
    let createdCount = 0;

    for (let i = 0; i < fases.length; i++) {
      const fase = fases[i];
      const actividadesDB = await Actividad.find({ fase: fase._id }).sort('orden');

      if (!actividadesDB.length) {
        console.warn(`⚠️  La fase "${fase.titulo}" no tiene actividades asociadas en la colección Actividades`);
        continue;
      }

      const actividades = actividadesDB.map(act => ({
        actividad: act._id,
        nombre: act.nombre,
        completada: false,
        estado: 'pendiente',
        comentariosResidente: '',
        comentariosFormador: '',
        fechaRealizacion: null,
        firmaDigital: '',
      }));
      console.log(`➡️ Fase: ${fase.titulo}`);
      console.log(`🔢 Actividades encontradas: ${actividadesDB.length}`);
      console.log(`🧩 Actividades para guardar:`);
      console.log(actividades);
      const creado = await ProgresoResidente.create({
        residente: usuario._id,
        fase: fase._id,
        actividades,
        estadoGeneral: i === 0 ? 'en progreso' : 'bloqueada',
        fechaRegistro: new Date(),
      });
      console.log(`✅ Progreso guardado para fase ${fase.titulo} con ID: ${creado._id}`);
      createdCount++;
    }

    console.log(`✅ Progreso inicializado para ${usuario.email}: ${createdCount} fases creadas`);
    return createdCount;
  } catch (err) {
    console.error('❌ Error al inicializar progreso formativo:', err);
    throw err;
  }
};

module.exports = { inicializarProgresoFormativo };

