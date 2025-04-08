const mongoose = require('mongoose');

const invitacionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Por favor proporcione un email'],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor proporcione un email válido']
  },
  rol: {
    type: String,
    enum: ['residente', 'formador', 'administrador'],
    required: [true, 'Por favor especifique un rol']
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: function() {
      return this.rol === 'residente' || this.rol === 'formador';
    }
  },
  token: {
    type: String,
    required: true
  },
  fechaEnvio: {
    type: Date,
    default: Date.now
  },
  fechaExpiracion: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aceptada', 'expirada'],
    default: 'pendiente'
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Por favor proporcione el administrador que envió la invitación']
  }
}, {
  timestamps: true
});

// Método para verificar si la invitación ha expirado
invitacionSchema.methods.haExpirado = function() {
  return Date.now() > this.fechaExpiracion;
};

// Método para marcar como aceptada
invitacionSchema.methods.marcarComoAceptada = function() {
  this.estado = 'aceptada';
  return this.save();
};

// Método para marcar como expirada
invitacionSchema.methods.marcarComoExpirada = function() {
  this.estado = 'expirada';
  return this.save();
};

const Invitacion = mongoose.model('Invitacion', invitacionSchema);

module.exports = Invitacion;
