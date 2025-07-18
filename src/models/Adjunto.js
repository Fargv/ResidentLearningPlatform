const mongoose = require('mongoose');

const adjuntoSchema = new mongoose.Schema({
  progreso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProgresoResidente',
    required: [true, 'Por favor proporcione el registro de progreso al que pertenece']
  },
  nombreArchivo: {
    type: String,
    required: [true, 'Por favor proporcione el nombre del archivo']
  },
  rutaArchivo: {
    type: String,
    // Para adjuntos almacenados en la BD no se necesita ruta física
    required: false
  },
  // Contenido binario opcional para almacenamiento en MongoDB
  datos: Buffer,
  mimeType: String,
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actividadIndex: Number,
  tipoArchivo: {
    type: String,
    enum: ['certificado', 'imagen', 'documento', 'otro'],
    default: 'otro'
  },
  fechaSubida: {
    type: Date,
    default: Date.now
  },
  // Campos para cumplimiento LOPD
  contieneDatosSensibles: {
    type: Boolean,
    default: false
  },
  cifrado: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Método para marcar archivo como contenedor de datos sensibles
adjuntoSchema.methods.marcarComoSensible = function() {
  this.contieneDatosSensibles = true;
  return this.save();
};

// Método para marcar archivo como cifrado
adjuntoSchema.methods.marcarComoCifrado = function() {
  this.cifrado = true;
  return this.save();
};

const Adjunto = mongoose.model('Adjunto', adjuntoSchema);

module.exports = Adjunto;
