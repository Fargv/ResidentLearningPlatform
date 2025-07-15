const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Fase = require('../src/models/Fase');
const fs = require('fs');
const path = require('path');

dotenv.config();

// La URI se toma de la variable de entorno MONGO_URI
const MONGO_URI = process.env.MONGO_URI;

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
