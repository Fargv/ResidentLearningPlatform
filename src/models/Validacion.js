const mongoose = require('mongoose');

const validacionSchema = new mongoose.Schema({
  progreso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProgresoResidente',
    required: [true, 'Por favor proporcione el registro de progreso a validar']
  },
  formador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Por favor proporcione el formador que valida']
  },
  fechaValidacion: {
    type: Date,
    default: Date.now
  },
  comentarios: {
    type: String
  },
  firmaDigital: {
    type: String
  },
  // Campos para auditoría y cumplimiento LOPD
  ipValidacion: String,
  navegadorValidacion: String
}, {
  timestamps: true
});

// Método para registrar información de auditoría
validacionSchema.methods.registrarAuditoria = function(ip, navegador) {
  this.ipValidacion = ip;
  this.navegadorValidacion = navegador;
  return this.save();
};

const Validacion = mongoose.model('Validacion', validacionSchema);

module.exports = Validacion;
