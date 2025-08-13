const mongoose = require('mongoose');
const SurgeryType = require('../src/models/SurgeryType');
require('dotenv').config();

const uri = process.env.MONGO_URI;

const types = [
  { name: 'Urología (URO)' },
  { name: 'Cirugía General (GEN)' },
  { name: 'Ginecología (GYN)' },
  { name: 'Torácica (THOR)' },
  { name: 'Otorrino (ORL)' }
];

async function run() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    for (const type of types) {
      await SurgeryType.updateOne({ name: type.name }, type, { upsert: true });
      console.log(`Procedimiento quirúrgico ${type.name} registrado`);
    }

    console.log('✅ Procedimientos quirúrgicos iniciales creados');
    process.exit();
  } catch (err) {
    console.error('❌ Error al crear tipos de cirugía:', err);
    process.exit(1);
  }
}

run();

