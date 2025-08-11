// scripts/insertAccessCodes.js

const mongoose = require('mongoose');
const AccessCode = require('../src/models/AccessCode');

require('dotenv').config();

// 🔒 Cadena de conexión a MongoDB obtenida de MONGO_URI
const uri = process.env.MONGO_URI;
async function run() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const codes = [
      { codigo: 'ADMIN', rol: 'administrador', tipo: 'Programa Residentes' },
      { codigo: 'TUTOR', rol: 'tutor', tipo: 'Programa Residentes' },
      { codigo: 'RESIDENTE', rol: 'residente', tipo: 'Programa Residentes' }
    ];

    for (const code of codes) {
      await AccessCode.updateOne({ codigo: code.codigo }, code, { upsert: true });
      console.log(`Código ${code.codigo} registrado`);
    }

    console.log('✅ Códigos de acceso iniciales insertados');
  } catch (err) {
    console.error('❌ Error al insertar códigos de acceso:', err);
  } finally {
    mongoose.connection.close();
  }
}

run();
