const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const User = require('../src/models/User');

dotenv.config();

function extractOid(value) {
  if (value && typeof value === 'object' && '$oid' in value) {
    return value.$oid;
  }
  if (typeof value === 'string') {
    const match = value.match(/ObjectId\(['"]?([a-fA-F0-9]{24})['"]?\)/);
    if (match) return match[1];
  }
  return null;
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const raw = fs.readFileSync(path.join(__dirname, '../data/test.users.json'));
    const usersJSON = JSON.parse(raw);

    await User.deleteMany({});
    console.log('🧹 Usuarios anteriores eliminados');

    for (const u of usersJSON) {
      const hospitalId = extractOid(u.hospital);
      const sociedadId = extractOid(u.sociedad);

      const data = {
        ...u,
        hospital: hospitalId ? new mongoose.Types.ObjectId(hospitalId) : undefined,
        sociedad: sociedadId ? new mongoose.Types.ObjectId(sociedadId) : undefined
      };
      await User.create(data);
    }

    console.log(`✅ ${usersJSON.length} usuarios insertados correctamente`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al reiniciar usuarios:', err);
    process.exit(1);
  }
}

main();
