const mongoose = require('mongoose');

const progresoResidenteSchema = new mongoose.Schema({
  residente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Por favor proporcione el residente']
  },
  actividad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Actividad',
    required: [true, 'Por favor proporcione la actividad realizada']
  },
  fechaRealizacion: {
    type: Date,
    required: [true, 'Por favor proporcione la fecha de realización']
  },
  porcentajeParticipacion: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  comentariosResidente: {
    type: String
  },
  estado: {
    type: String,
    enum: ['pendiente', 'completado', 'validado', 'rechazado'],
    default: 'pendiente'
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  // Campos para cumplimiento LOPD
  datosAnonimizados: {
    type: Boolean,
    default: false
  },
  fechaAnonimizacion: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals para obtener validaciones y adjuntos asociados
progresoResidenteSchema.virtual('validaciones', {
  ref: 'Validacion',
  localField: '_id',
  foreignField: 'progreso',
  justOne: false
});

progresoResidenteSchema.virtual('adjuntos', {
  ref: 'Adjunto',
  localField: '_id',
  foreignField: 'progreso',
  justOne: false
});

// Método para anonimizar datos personales (cumplimiento LOPD)
progresoResidenteSchema.methods.anonimizar = function() {
  this.comentariosResidente = '[Datos anonimizados]';
  this.datosAnonimizados = true;
  this.fechaAnonimizacion = Date.now();
  return this.save();
};

const ProgresoResidente = mongoose.model('ProgresoResidente', progresoResidenteSchema);

module.exports = ProgresoResidente;
