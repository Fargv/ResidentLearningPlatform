// Uso:
//   node scripts/addZonaField.js
//
// Recorre todos los documentos de "Hospital" y garantiza que el campo "zona"
// exista. Si un hospital no tiene definido "zona", se establece en null.
// Se necesita tener configurada la variable de entorno MONGO_URI.

const dotenv = require('dotenv');
const connectDB = require('../src/config/database');
const Hospital = require('../src/models/Hospital');

dotenv.config();

async function run() {
  await connectDB();

  try {
    const hospitals = await Hospital.find();
    let updated = 0;
    for (const hospital of hospitals) {
      if (hospital.zona === undefined) {
        hospital.zona = null;
        await hospital.save();
        updated++;
        console.log(`Hospital ${hospital.nombre} actualizado`);
      }
    }
    console.log(`Actualizados ${updated} hospitales`);
  } catch (err) {
    console.error('Error al actualizar hospitales:', err);
  }

  process.exit();
}

run();