const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Por favor proporcione el usuario destinatario']
  },
  tipo: {
    type: String,
    enum: ['validacion', 'rechazo', 'comentario', 'invitacion', 'sistema', 'passwordReset'],
    required: [true, 'Por favor especifique el tipo de notificación']
  },
  mensaje: {
    type: String,
    required: [true, 'Por favor proporcione el contenido de la notificación']
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  leida: {
    type: Boolean,
    default: false
  },
  enlace: {
    type: String
  },
  entidadRelacionada: {
    tipo: {
      type: String,
      enum: ['progreso', 'validacion', 'usuario', 'hospital', 'fase', 'actividad']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  }
}, {
  timestamps: true
});

// Método para marcar como leída
notificacionSchema.methods.marcarComoLeida = function() {
  this.leida = true;
  return this.save();
};

const Notificacion = mongoose.model('Notificacion', notificacionSchema);

module.exports = Notificacion;
