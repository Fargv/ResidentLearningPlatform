const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'Por favor proporcione un nombre para el hospital'],
    trim: true
  },
  codigoNumerico: {
    type: Number,
    unique: true,
    required: [true, 'Debe especificar un ID numérico']
  },
  direccion: {
    type: String,
    required: [true, 'Por favor proporcione una dirección']
  },
  ciudad: {
    type: String,
    required: [true, 'Por favor proporcione una ciudad']
  },
  provincia: {
    type: String,
    required: [true, 'Por favor proporcione una provincia']
  },
  zona: {
    type: String,
    enum: ['NORDESTE', 'NORTE', 'CENTRO', 'ANDALUCÍA', 'PORTUGAL', 'LEVANTE', 'CANARIAS']
  },
  codigoPostal: {
    type: String,
    required: [true, 'Por favor proporcione un código postal']
  },
  telefono: {
    type: String
  },
  email: {
    type: String,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor proporcione un email válido']
  },
  urlHospiLogo: {
    type: String
  },
  tipoSistema: {
    type: String,
    enum: ['Xi', 'X', 'SP', 'Otro'],
    required: [true, 'Por favor especifique el tipo de sistema da Vinci']
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals para obtener los usuarios asociados al hospital
hospitalSchema.virtual('residentes', {
  ref: 'User',
  localField: '_id',
  foreignField: 'hospital',
  justOne: false,
  match: { rol: 'residente' }
});

hospitalSchema.virtual('formadores', {
  ref: 'User',
  localField: '_id',
  foreignField: 'hospital',
  justOne: false,
  match: { rol: 'tutor' }
});

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;
