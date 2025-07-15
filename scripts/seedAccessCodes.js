const mongoose = require('mongoose');
const AccessCode = require('../src/models/AccessCode');
require('dotenv').config();

const uri = process.env.MONGO_URI;

const codes = [
  { codigo: 'ABEXRES2025', rol: 'residente', tipo: 'Programa Residentes' },
  { codigo: 'ABEXFOR2025', rol: 'formador', tipo: 'Programa Residentes' },
  { codigo: 'ABEXSOCUSER2025', rol: 'alumno', tipo: 'Programa Sociedades' },
  { codigo: 'ABEXSOCFOR2025', rol: 'instructor', tipo: 'Programa Sociedades' }
];

async function run() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    for (const code of codes) {
      await AccessCode.updateOne({ codigo: code.codigo }, code, { upsert: true });
      console.log(`Código ${code.codigo} registrado`);
    }

    console.log('✅ Códigos de acceso iniciales creados');
    process.exit();
  } catch (err) {
    console.error('❌ Error al crear códigos de acceso:', err);
    process.exit(1);
  }
}

run();

