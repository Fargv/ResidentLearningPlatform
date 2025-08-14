// scripts/addTipoToProgresoActividades-direct.js
// Ejecutar con: node scripts/addTipoToProgresoActividades-direct.js

const { MongoClient, ObjectId } = require('mongodb');

// Cadena de conexión directa
const uri = 'mongodb+srv://fernandoacedorico:Fall061023%21%21@cluster0.cxzh9ls.mongodb.net/test?retryWrites=true&w=majority';
// Nombre de la base de datos que contiene tus colecciones
const dbName = 'test'; // cámbialo si tu DB no es "test"

async function run() {
  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');

    const db = client.db(dbName);
    const progresosCol = db.collection('progresoresidentes');
    const actividadesCol = db.collection('actividades');

    const progresos = await progresosCol.find({}).toArray();
    let updated = 0;

    for (const progreso of progresos) {
      let modified = false;

      for (const act of progreso.actividades) {
        if (!act.tipo) {
          let tipo = 'teórica';

          if (act.actividad) {
            const actividadRef = await actividadesCol.findOne({ _id: new ObjectId(act.actividad) });
            if (actividadRef?.tipo) {
              tipo = actividadRef.tipo;
            }
          }

          act.tipo = tipo;
          modified = true;
        }
      }

      if (modified) {
        await progresosCol.updateOne(
          { _id: progreso._id },
          { $set: { actividades: progreso.actividades } }
        );
        console.log(`Progreso ${progreso._id} actualizado`);
        updated++;
      }
    }

    console.log(`Progresos actualizados: ${updated}`);
  } catch (err) {
    console.error('❌ Error al actualizar progresos:', err);
  } finally {
    await client.close();
  }
}

run();
