const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Role } = require('../utils/roles');

// Definición del esquema de usuario
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Por favor proporcione un email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor proporcione un email válido']
  },
  password: {
    type: String,
    required: [true, 'Por favor proporcione una contraseña'],
    minlength: 8,
    select: false // No devolver la contraseña en las consultas
  },
  nombre: {
    type: String,
    required: [true, 'Por favor proporcione un nombre']
  },
  apellidos: {
    type: String,
    required: [true, 'Por favor proporcione apellidos']
  },
  rol: {
    type: String,
    enum: Object.values(Role),
    required: [true, 'Por favor especifique un rol']
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: function() {
      return this.rol === Role.RESIDENTE || this.rol === Role.TUTOR;
    }
  },

  especialidad: {
    type: String,
    // 'ALL' solo es válida para tutores
    enum: ['URO', 'GEN', 'GYN', 'THOR', 'ORL', 'ALL'],
    required: function() {
      return this.rol === Role.RESIDENTE || this.rol === Role.TUTOR;
    }
  },
   tipo: {
    type: String,
    enum: ['Programa Residentes', 'Programa Sociedades'],
    required: function() {
      return this.rol !== Role.ADMINISTRADOR;
    }
  },
  sociedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sociedades',
    required: function() {
      return this.tipo === 'Programa Sociedades';
    }
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  profesor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  zona: {
    type: String,
    enum: ['NORDESTE', 'NORTE', 'CENTRO', 'ANDALUCÍA', 'PORTUGAL', 'LEVANTE', 'CANARIAS'],
    required: function() {
      return this.rol === Role.CSM;
    }
  },
  activo: {
    type: Boolean,
    default: true
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  ultimoAcceso: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  consentimientoDatos: {
    type: Boolean,
    default: false
  },
  fechaConsentimiento: Date
}, {
  timestamps: true
});

// Índices compuestos para búsquedas frecuentes
userSchema.index({ hospital: 1, especialidad: 1, rol: 1 });
userSchema.index({ hospital: 1, rol: 1 });

// Middleware para encriptar la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  // Solo encriptar si la contraseña ha sido modificada
  if (!this.isModified('password')) {
    return next();
  }
  
  // Generar salt y hash
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Asegurar que solo los residentes tengan asignado un tutor
userSchema.pre('save', function(next) {
  if (this.rol !== Role.RESIDENTE) {
    this.tutor = null;
  }
  next();
});

// Método para comparar contraseñas
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Método para generar token de restablecimiento de contraseña
userSchema.methods.getResetPasswordToken = function(durationMs = 10 * 60 * 1000) {
  // Generar token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token y establecer en resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Establecer expiración utilizando la duración proporcionada
  this.resetPasswordExpire = Date.now() + durationMs;

  return resetToken;
};

// Método para registrar el último acceso
userSchema.methods.updateLastAccess = function() {
  this.ultimoAcceso = Date.now();
  return this.save();
};

// Método para verificar si el usuario ha dado consentimiento LOPD
userSchema.methods.hasConsent = function() {
  return this.consentimientoDatos === true;
};

// Método para registrar consentimiento LOPD
userSchema.methods.giveConsent = function() {
  this.consentimientoDatos = true;
  this.fechaConsentimiento = Date.now();
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
