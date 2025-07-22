const Hospital = require('../src/models/Hospital');

dotenv.config();

function extractOid(value) {
  if (value && typeof value === 'object' && '$oid' in value) return value.$oid;
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

    const raw = fs.readFileSync(path.join(__dirname, '../data/test.hospitals.json'));
    const hospitalsJSON = JSON.parse(raw);

    await Hospital.deleteMany({});
    console.log('🧹 Hospitales anteriores eliminados');

    const hospitals = hospitalsJSON.map(h => ({
      ...h,
      _id: new mongoose.Types.ObjectId(extractOid(h._id))
    }));

    await Hospital.insertMany(hospitals);
    console.log(`✅ ${hospitals.length} hospitales insertados correctamente`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al reiniciar hospitales:', err);
    process.exit(1);
  }
}

main();
