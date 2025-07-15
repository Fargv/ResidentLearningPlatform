const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'test';

async function resetYClonar() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    const origen = 'fases';
    const destino = 'fasesocs';

    // 🔥 1. Borrar TODO el contenido de fasesocs
    await db.collection(destino).deleteMany({});
    console.log(`🧹 ${destino} vaciada completamente`);

    // 2. Obtener los documentos desde fases
    const docs = await db.collection(origen).find().toArray();
    if (docs.length === 0) {
      console.log(`⚠️ La colección ${origen} está vacía. Nada que clonar.`);
      return;
    }

    // 3. Quitar _id para evitar conflictos
    const nuevosDocs = docs.map(({ _id, ...rest }) => ({ ...rest }));

    // 4. Insertar en fasesocs
    const res = await db.collection(destino).insertMany(nuevosDocs);
    console.log(`✅ Clonados ${res.insertedCount} documentos de ${origen} a ${destino}`);
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.close();
  }
}

resetYClonar();
