const mongoose = require('mongoose');
const { Schema } = mongoose;

const actividadSchema = new Schema({
  nombre: { type: String, required: true },
  tipo: {
    type: String,
    enum: ['teórica','práctica','evaluación','observación','cirugia'],
    required: true
  },
  completada: { type: Boolean, default: false },
  fechaRealizacion: Date,
  actividadModel: { type: String, default: 'Actividad' },
  actividad: {
    type: Schema.Types.ObjectId,
    refPath: 'actividades.actividadModel',
    required: true
  },
  comentariosTutor: String,
  comentariosRechazo: String,
  firmaDigital: String,
  fechaValidacion: Date,
  fechaRechazo: Date,
  cirugia: {
    type: Schema.Types.ObjectId,
    ref: 'SurgeryType'
  },
  otraCirugia: String,
  nombreCirujano: String,
  porcentajeParticipacion: {
    type: Number,
    enum: [0, 25, 50, 75, 100],
    default: 100
  },
  comentariosResidente: String,
  estado: {
    type: String,
    enum: ['pendiente', 'completado', 'validado', 'rechazado'],
    default: 'pendiente'
  }
});

const progresoResidenteSchema = new Schema({
  residente: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  faseModel: { type: String, default: 'Fase' },
  fase: {
    type: Schema.Types.ObjectId,
    refPath: 'faseModel',
    required: true
  },
  actividades: [actividadSchema],
  comentariosFinales: String,
  estadoGeneral: {
    type: String,
    enum: ['bloqueada','en progreso', 'completado', 'validado'],
    default: 'en progreso'
  },
  validadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  fechaRegistro: { type: Date, default: Date.now },
  fechaInicio: {
    type: Date,
    default: Date.now
  },
  fechaFin: Date,
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

progresoResidenteSchema.methods.anonimizar = function () {
  this.comentariosFinales = '[Datos anonimizados]';
  this.datosAnonimizados = true;
  this.fechaAnonimizacion = Date.now();
  return this.save();
};

const ProgresoResidente = mongoose.model('ProgresoResidente', progresoResidenteSchema);

module.exports = ProgresoResidente;
