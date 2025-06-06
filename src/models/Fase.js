const mongoose = require('mongoose');

const faseSchema = new mongoose.Schema({
  numero: {
    type: Number,
    required: [true, 'Por favor proporcione un número de fase'],
    min: 1,
    max: 4
  },
  nombre: {
    type: String,
    required: [true, 'Por favor proporcione un nombre para la fase'],
    trim: true
  },
  descripcion: {
    type: String,
    required: [true, 'Por favor proporcione una descripción']
  },
  orden: {
    type: Number,
    required: true,
    default: function () {
      return this.numero;
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para obtener las actividades asociadas a la fase
faseSchema.virtual('actividades', {
  ref: 'Actividad',
  localField: '_id',
  foreignField: 'fase',
  justOne: false
});

const Fase = mongoose.model('Fase', faseSchema);

module.exports = Fase;
