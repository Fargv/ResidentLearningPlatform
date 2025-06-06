const dotenv = require('dotenv');
const connectDB = require('../src/config/database');
const Fase = require('../src/models/Fase');

dotenv.config();

async function run() {
  await connectDB();

  try {
    const fases = await Fase.find().sort('numero');
    for (const fase of fases) {
      fase.orden = fase.numero;
      await fase.save();
      console.log(`Fase ${fase.nombre} actualizada con orden ${fase.orden}`);
    }
    console.log('Actualización completada');
  } catch (err) {
    console.error('Error al actualizar fases:', err);
  }

  process.exit();
}

run();