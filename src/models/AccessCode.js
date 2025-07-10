const mongoose = require('mongoose');

const accessCodeSchema = new mongoose.Schema({
  codigo: {
    type: String,
    unique: true,
    required: [true, 'Por favor proporcione un código']
  },
  rol: {
    type: String,
    enum: ['residente', 'formador', 'administrador', 'alumno', 'instructor'],
    required: [true, 'Por favor especifique un rol']
  },
  tipo: {
    type: String,
    enum: ['Programa Residentes', 'Programa Sociedades'],
    required: [true, 'Por favor especifique un tipo de programa']
  }
}, {
  timestamps: true
});

const AccessCode = mongoose.model('AccessCode', accessCodeSchema);

module.exports = AccessCode;
