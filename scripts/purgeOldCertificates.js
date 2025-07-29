// scripts/purgeOldCertificates.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Adjunto = require('../src/models/Adjunto');

dotenv.config();

async function purgeOldCertificates() {
  await mongoose.connect(process.env.MONGO_URI);

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 1);

  const result = await Adjunto.deleteMany({
    nombreArchivo: /^certificado/i,
    createdAt: { $lt: cutoff }
  });

  console.log(`${result.deletedCount} documentos eliminados`);
  await mongoose.disconnect();
}

purgeOldCertificates().catch(err => {
  console.error('Error al eliminar adjuntos:', err);
  mongoose.disconnect();
});
