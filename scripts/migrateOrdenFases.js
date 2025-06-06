require('dotenv').config();
const connectDB = require('../src/config/database');
const Fase = require('../src/models/Fase');

(async () => {
  try {
    await connectDB();
    const fases = await Fase.find();
    for (const fase of fases) {
      fase.orden = fase.numero;
      await fase.save();
    }
    console.log(`Actualizadas ${fases.length} fases`);
    process.exit(0);
  } catch (err) {
    console.error('Error en la migración:', err);
    process.exit(1);
  }
})();