const mongoose = require('mongoose');

const actividadSchema = new mongoose.Schema({
  fase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FaseSoc',
    required: [true, 'Por favor proporcione la fase a la que pertenece esta actividad']
  },
  nombre: {
    type: String,
    required: [true, 'Por favor proporcione un nombre para la actividad'],
    trim: true
  },
  descripcion: {
    type: String,
    required: [true, 'Por favor proporcione una descripción']
  },
  tipo: {
    type: String,
    enum: ['teórica', 'práctica', 'evaluación', 'observación', 'cirugia'],
    required: [true, 'Por favor especifique el tipo de actividad']
  },
  requiereValidacion: {
    type: Boolean,
    default: true
  },
  requiereFirma: {
    type: Boolean,
    default: false
  },
  requierePorcentaje: {
    type: Boolean,
    default: false
  },
  requiereAdjunto: {
    type: Boolean,
    default: false
  },
  orden: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

const ActividadSoc = mongoose.model('ActividadSoc', actividadSchema);

module.exports = ActividadSoc;
