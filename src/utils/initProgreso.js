const ProgresoResidente = require('../models/ProgresoResidente');
const Fase = require('../models/Fase');
const Actividad = require('../models/Actividad');

const inicializarProgresoFormativo = async (usuario) => {
  try {
    const fases = await Fase.find().sort('numero');  // ✅ Corrección aquí
    console.log("📦 Fases encontradas:", fases.map(f => ({ id: f._id, nombre: f.nombre })));
    let createdCount = 0;

    for (let i = 0; i < fases.length; i++) {
      const fase = fases[i];

      const actividadesDB = await Actividad.find({ fase: fase._id }).sort('orden');

      if (!actividadesDB.length) {
        console.warn(`⚠️  La fase "${fase.nombre}" no tiene actividades asociadas`);
        continue;
      }

      const actividades = actividadesDB.map(act => ({
          actividad: {
            _id: act._id,
            nombre: act.nombre,
            descripcion: act.descripcion || '',
            orden: act.orden || 0,
            fase: act.fase,
          },
          nombre: act.nombre,
          completada: false,
          estado: 'pendiente',
          comentariosResidente: '',
          comentariosFormador: '',
          fechaRealizacion: null,
          firmaDigital: '',
        }));

      const creado = await ProgresoResidente.create({
        residente: usuario._id,
        fase: fase._id,
        actividades,
        estadoGeneral: i === 0 ? 'en progreso' : 'bloqueada',  // Solo la 1ª en progreso
        fechaRegistro: new Date(),
      });

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
