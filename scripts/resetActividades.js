const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Actividad = require('../models/Actividad');

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

const main = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Leer y parsear el JSON
    const raw = fs.readFileSync(path.join(__dirname, '../test.actividades.json'));
    const actividadesJSON = JSON.parse(raw);

    // Eliminar actividades existentes
    await Actividad.deleteMany({});
    console.log('🧹 Actividades anteriores eliminadas');

    // Transformar _id y fase.$oid
    const actividades = actividadesJSON.map(a => ({
      _id: a._id.$oid,
      nombre: a.nombre,
      fase: a.fase.$oid,
      orden: a.orden,
      descripcion: a.nombre, // Puedes mejorar esto si tienes descripciones reales
      tipo: 'práctica', // O 'teórica'/'observación' según el caso
      requiereValidacion: true
    }));

    await Actividad.insertMany(actividades);
    console.log(`✅ ${actividades.length} actividades insertadas correctamente`);

    // Listado breve
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
