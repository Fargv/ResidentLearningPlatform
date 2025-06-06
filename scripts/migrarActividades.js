// Uso:
//   node scripts/migrarActividades.js
//
// Este script extrae las actividades embebidas en cada documento de "Fase" y
// las crea en la colección "Actividad". Se espera que la variable de entorno
// MONGO_URI esté definida para establecer la conexión.

const mongoose = require('mongoose');
const Fase = require('../src/models/Fase');
const Actividad = require('../src/models/Actividad');
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
          descripcion: act.descripcion || 'Descripción pendiente',
          tipo: act.tipo || 'teórica',
          fase: fase._id,
          orden: i + 1,
          requiereValidacion: act.requiereValidacion,
          requiereFirma: act.requiereFirma,
          requierePorcentaje: act.requierePorcentaje,
          requiereAdjunto: act.requiereAdjunto
        });
        console.log(
          `✅ Insertada actividad "${act.nombre}" en fase "${fase.titulo || fase.nombre}"`
        );
      } else {
        console.log(`⏩ Ya existía: "${act.nombre}"`);
      }
    }
  }

  console.log("🎉 Migración completada.");
  mongoose.disconnect();
}

migrarActividades().catch(console.error);
