const mongoose = require('mongoose');
const Actividad = require('../src/models/Actividad');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function fixFaseObjectIds() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const actividades = await Actividad.find({});
    let actualizadas = 0;

    for (const act of actividades) {
      if (typeof act.fase === 'object' && act.fase.$oid) {
        act.fase = new mongoose.Types.ObjectId(act.fase.$oid);
        await act.save();
        actualizadas++;
      } else if (typeof act.fase === 'string') {
        act.fase = new mongoose.Types.ObjectId(act.fase);
        await act.save();
        actualizadas++;
      }
    }

    console.log(`✅ Actividades corregidas: ${actualizadas}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error corrigiendo actividades:', err);
    process.exit(1);
  }
}

fixFaseObjectIds();
