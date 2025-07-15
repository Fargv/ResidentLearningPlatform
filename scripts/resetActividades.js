const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Actividad = require('../src/models/Actividad');

dotenv.config();

function extractOid(value) {
  if (value && typeof value === 'object' && '$oid' in value) {
    return value.$oid;
  }
  if (typeof value === 'string') {
    const match = value.match(/ObjectId\(['"]?([a-fA-F0-9]{24})['"]?\)/);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// La URI se obtiene de la variable de entorno MONGO_URI
const MONGO_URI = process.env.MONGO_URI;

const main = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const raw = fs.readFileSync(path.join(__dirname, '../data/test.actividades.json'));
    const actividadesJSON = JSON.parse(raw);

    await Actividad.deleteMany({});
    console.log('🧹 Actividades anteriores eliminadas');

     const actividades = actividadesJSON.map(a => {
      const idHex = extractOid(a._id);
      const faseHex = extractOid(a.fase);

      if (!mongoose.Types.ObjectId.isValid(idHex) || !mongoose.Types.ObjectId.isValid(faseHex)) {
        throw new Error(`ID inválido en actividad: ${a.nombre}`);
      }

      return {
        _id: new mongoose.Types.ObjectId(idHex),
        nombre: a.nombre,
        fase: new mongoose.Types.ObjectId(faseHex),
        orden: a.orden,
        descripcion: a.nombre,
        tipo: 'práctica',
        requiereValidacion: true,
        requiereFirma: false,
        requierePorcentaje: false,
        requiereAdjunto: false,
      };
    });

    await Actividad.insertMany(actividades);
    console.log(`✅ ${actividades.length} actividades insertadas correctamente`);

    const resumen = actividades.reduce((acc, act) => {
      acc[act.fase] = acc[act.fase] ? acc[act.fase] + 1 : 1;
      return acc;
    }, {});
    console.log('📊 Actividades por fase:', resumen);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error al reiniciar actividades:', err);
    process.exit(1);
  }
};

main();
