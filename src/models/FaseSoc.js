const mongoose = require('mongoose');

const faseSchema = new mongoose.Schema({
  numero: {
    type: Number,
    required: [true, 'Por favor proporcione un número de fase'],
    min: 1,
    max: 10
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
    unique: true,
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
  ref: 'ActividadSoc',
  localField: '_id',
  foreignField: 'fase',
  justOne: false
});

const FaseSoc = mongoose.model('FaseSoc', faseSchema);

module.exports = FaseSoc;
