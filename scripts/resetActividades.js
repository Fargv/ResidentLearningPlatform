const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Actividad = require('../src/models/Actividad');

dotenv.config();

// Puedes dejar esta URI en .env o pegarla directamente aquí si prefieres:
const MONGO_URI = 'mongodb+srv://fernandoacedorico:Fall061023!!@cluster0.cxzh9ls.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

const main = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const raw = fs.readFileSync(path.join(__dirname, '../data/test.actividades.json'));
    const actividadesJSON = JSON.parse(raw);

    await Actividad.deleteMany({});
    console.log('🧹 Actividades anteriores eliminadas');

    const actividades = actividadesJSON.map(a => ({
      _id: a._id.$oid,
      nombre: a.nombre,
      fase: new mongoose.Types.ObjectId(a.fase.$oid),
      orden: a.orden,
      descripcion: a.nombre,
      tipo: 'práctica',
      requiereValidacion: true,
      requiereFirma: false,
      requierePorcentaje: false,
      requiereAdjunto: false,
    }));

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
