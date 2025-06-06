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

    await Fase.collection.createIndex({ orden: 1 }, { unique: true });
    console.log('Índice único creado en el campo orden');
  } catch (err) {
    console.error('Error al actualizar fases o crear índice:', err);
  }

  process.exit();
}

run();
