const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Fase = require('../src/models/Fase');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Si no usas .env, puedes poner directamente tu URI aquí:
const MONGO_URI = 'mongodb+srv://fernandoacedorico:Fall061023!!@cluster0.cxzh9ls.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

const main = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Leer el archivo corregido
    const raw = fs.readFileSync(path.join(__dirname, '../test.fases.nombre.json'));
    const fasesJSON = JSON.parse(raw);

    // Eliminar fases actuales
    await Fase.deleteMany({});
    console.log('🧹 Fases anteriores eliminadas');

    // Insertar las nuevas fases con campo "nombre"
    const fases = fasesJSON.map(f => ({
      _id: f._id.$oid,
      numero: f.numero,
      nombre: f.nombre,
      descripcion: f.descripcion,
    }));

    await Fase.insertMany(fases);
    console.log(`✅ ${fases.length} fases insertadas correctamente`);

    console.log('📋 Títulos cargados:');
    fases.forEach(f => console.log(`- ${f.nombre}`));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error al reiniciar fases:', err);
    process.exit(1);
  }
};

main();
