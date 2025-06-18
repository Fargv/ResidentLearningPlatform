const mongoose = require('mongoose');
const ProgresoResidente = require('../models/ProgresoResidente');
const Fase = require('../models/Fase');
const Actividad = require('../models/Actividad');

const inicializarProgresoFormativo = async (usuario) => {
  try {
    const fases = await Fase.find().sort('numero').populate('actividades');
    console.log("📦 Fases encontradas:", fases.map(f => ({ id: f._id, nombre: f.nombre })));
    let createdCount = 0;

    for (let i = 0; i < fases.length; i++) {
      const fase = fases[i];
      const actividadesDB = Array.isArray(fase.actividades)
        ? fase.actividades
        : await Actividad.find({ fase: fase._id }).sort('orden');

      if (!actividadesDB.length) {
        console.warn(`⚠️  La fase "${fase.nombre}" no tiene actividades asociadas`);
        continue;
      }

      const actividades = actividadesDB.map(act => ({
        actividad: mongoose.Types.ObjectId.isValid(act._id)
          ? new mongoose.Types.ObjectId(act._id)
          : act._id,
        nombre: act.nombre,
        completada: false,
        estado: 'pendiente',
        comentariosResidente: '',
        comentariosFormador: '',
        fechaRealizacion: null,
        firmaDigital: '',
      }));

      if (i === 0) {
        console.log('🧪 ACTIVIDAD 0:', actividades[0]);
        console.log('🧪 tipo actividad:', typeof actividades[0].actividad);
        console.log('🧪 es ObjectId:', actividades[0].actividad instanceof mongoose.Types.ObjectId);
      }

      const creado = await ProgresoResidente.create({
        residente: usuario._id,
        fase: fase._id,
        actividades,
        estadoGeneral: i === 0 ? 'en progreso' : 'bloqueada',
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
