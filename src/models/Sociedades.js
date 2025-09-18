const mongoose = require('mongoose');

const SociedadSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  status: {
    type: String,
    enum: ['ACTIVO', 'INACTIVO'],
    default: 'ACTIVO'
  },
  urlLogo: { type: String },
  responsablePrograma: { type: String },
  fechaConvocatoria: { type: Date },
  fechaPresentacion: { type: Date },
  fechaModulosOnline: { type: Date },
  fechaSimulacion: { type: Date },
  fechaAtividadesFirstAssistant: { type: Date },
  fechaModuloOnlineStepByStep: { type: Date },
  fechaHandOn: { type: Date },
}, {
  timestamps: true
});

module.exports = mongoose.model('Sociedades', SociedadSchema);
