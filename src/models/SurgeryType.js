const mongoose = require('mongoose');

const surgeryTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: [true, 'Por favor proporcione un nombre para el tipo de cirugía'],
    trim: true
  }
}, {
  timestamps: true
});

const SurgeryType = mongoose.model('SurgeryType', surgeryTypeSchema);

module.exports = SurgeryType;
