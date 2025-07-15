const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'test';

async function clonarActividads() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    const fases = await db.collection('fases').find().toArray();
    const fasesocs = await db.collection('fasesocs').find().toArray();
    const actividades = await db.collection('actividads').find().toArray();

    if (!fases.length || !fasesocs.length || !actividades.length) {
      console.log('⚠️ No se encontraron datos para procesar.');
      return;
    }

    // Crear mapa para reemplazar ID de fase → faseocs
    const mapaFaseId = {};
    fases.forEach(fase => {
      const match = fasesocs.find(fs =>
        fs.numero === fase.numero &&
        fs.nombre === fase.nombre &&
        fs.descripcion === fase.descripcion
      );
      if (match) {
        mapaFaseId[fase._id.toString()] = match._id;
      }
    });

    // Filtrar e insertar
    const nuevosDocs = actividades.map(({ _id, fase, ...rest }) => {
      const idFaseOriginal = fase.toString();
      const nuevaFase = mapaFaseId[idFaseOriginal];
      if (!nuevaFase) {
        console.warn(`⚠️ No se encontró fase equivalente para ${idFaseOriginal}, se omite.`);
        return null;
      }
      return {
        ...rest,
        fase: nuevaFase
      };
    }).filter(Boolean); // Eliminar nulls

    await db.collection('actividadsocs').deleteMany({});
    const res = await db.collection('actividadsocs').insertMany(nuevosDocs);

    console.log(`✅ Clonadas ${res.insertedCount} actividades con fase asociada`);
  } catch (err) {
    console.error('❌ Error al clonar actividades:', err);
  } finally {
    await client.close();
  }
}

clonarActividads();
