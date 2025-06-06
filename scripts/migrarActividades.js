const mongoose = require('mongoose');
const Fase = require('./models/Fase');
const Actividad = require('./models/Actividad');
require('dotenv').config(); // Asegúrate de tener MONGO_URI en .env

async function migrarActividades() {
  await mongoose.connect(process.env.MONGO_URI);
  const fases = await Fase.find();

  for (const fase of fases) {
    if (!fase.actividades || fase.actividades.length === 0) {
      console.log(`⚠️  Fase "${fase.titulo}" no tiene actividades embebidas`);
      continue;
    }

    for (let i = 0; i < fase.actividades.length; i++) {
      const act = fase.actividades[i];
      const yaExiste = await Actividad.findOne({ nombre: act.nombre, fase: fase._id });

      if (!yaExiste) {
        await Actividad.create({
          nombre: act.nombre,
          fase: fase._id,
          orden: i + 1
        });
        console.log(`✅ Insertada actividad "${act.nombre}" en fase "${fase.titulo}"`);
      } else {
        console.log(`⏩ Ya existía: "${act.nombre}"`);
      }
    }
  }

  console.log("🎉 Migración completada.");
  mongoose.disconnect();
}

migrarActividades().catch(console.error);
