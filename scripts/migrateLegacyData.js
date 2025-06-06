require('dotenv').config();
const connectDB = require('../src/config/database');
const Fase = require('../src/models/Fase');
const Actividad = require('../src/models/Actividad');
const ProgresoResidente = require('../src/models/ProgresoResidente');

async function updateFases() {
  const query = { $or: [{ nombre: { $exists: false } }, { nombre: null }] };
  const fases = await Fase.find(query);
  let count = 0;
  for (const fase of fases) {
    if (!fase.nombre && fase.titulo) {
      fase.nombre = fase.titulo;
    }
    if (fase.orden === undefined || fase.orden === null) {
      fase.orden = fase.numero;
    }
    await fase.save();
    count += 1;
  }
  console.log(`Actualizadas ${count} fases`);
}

async function updateProgresos() {
  const progresos = await ProgresoResidente.find();
  let updated = 0;
  for (const progreso of progresos) {
    let modified = false;
    for (const act of progreso.actividades) {
      if (!act.actividad) {
        const actividad = await Actividad.findOne({ nombre: act.nombre, fase: progreso.fase });
        if (actividad) {
          act.actividad = actividad._id;
          modified = true;
        } else {
          console.warn(`Actividad "${act.nombre}" no encontrada para progreso ${progreso._id}`);
        }
      }
    }
    if (modified) {
      await progreso.save();
      updated += 1;
    }
  }
  console.log(`Actualizados ${updated} progresos de residente`);
}

(async () => {
  await connectDB();
  try {
    await updateFases();
    await updateProgresos();
  } catch (err) {
    console.error('Error en la migración:', err);
  }
  process.exit();
})();