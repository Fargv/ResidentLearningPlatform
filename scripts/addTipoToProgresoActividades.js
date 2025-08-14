// Uso:
//   node scripts/addTipoToProgresoActividades.js
//
// Recorre todos los documentos de "ProgresoResidente" y asegura que cada
// actividad embebida tenga el campo "tipo". Si falta, lo rellena con el valor
// de la actividad referenciada o "teórica" por defecto.

const dotenv = require('dotenv');
const connectDB = require('../src/config/database');
const ProgresoResidente = require('../src/models/ProgresoResidente');

dotenv.config();

async function run() {
  await connectDB();

  try {
    const progresos = await ProgresoResidente.find().populate('actividades.actividad');
    let updated = 0;

    for (const progreso of progresos) {
      let modified = false;
      for (const act of progreso.actividades) {
        if (!act.tipo) {
          act.tipo = act.actividad?.tipo || 'teórica';
          modified = true;
        }
      }
      if (modified) {
        await progreso.save();
        updated++;
        console.log(`Progreso ${progreso._id} actualizado`);
      }
    }

    console.log(`Progresos actualizados: ${updated}`);
  } catch (err) {
    console.error('Error al actualizar progresos:', err);
  }

  process.exit();
}

run();
