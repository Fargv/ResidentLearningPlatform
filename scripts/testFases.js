const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Fase = require('../src/models/Fase');

dotenv.config();
const MONGO_URI = 'mongodb+srv://fernandoacedorico:Fall061023!!@cluster0.cxzh9ls.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

const main = async () => {
  await mongoose.connect(MONGO_URI);
  const fases = await Fase.find();
  console.log("📋 Fases desde Mongo:", fases.map(f => ({ id: f._id, nombre: f.nombre })));
  process.exit(0);
};

main();
