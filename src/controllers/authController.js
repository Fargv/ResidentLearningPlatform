const jwt = require('jsonwebtoken');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Fase = require('../models/Fase');
const ProgresoResidente = require('../models/ProgresoResidente');
const ErrorResponse = require('../utils/errorResponse');
const config = require('../config/config');

const inicializarProgresoParaNuevoUsuario  = async (usuario) => {
  if (usuario.rol !== 'residente') return;
  const fases = await Fase.find().sort({ numero: 1 });
  for (const fase of fases) {
    await ProgresoResidente.create({
      residente: usuario._id,
      fase: fase._id,
      actividades: fase.actividades.map(a => ({ nombre: a.nombre, completada: false })),
      estadoGeneral: fase.numero === 1 ? 'en progreso' : 'bloqueada'
    });
  }
};

const register = async (req, res, next) => {
  try {
    const { nombre, apellidos, email, password, codigoAcceso, hospital, consentimientoDatos, especialidad} = req.body;
    const accessCode = codigoAcceso;

    if (!accessCode) {
      return next(new ErrorResponse('Código de acceso requerido', 400));
    }

    if (!consentimientoDatos) {
      return next(new ErrorResponse('Debe aceptar el tratamiento de datos personales', 400));
    }

    let rol = null;
    if (accessCode === 'ABEXFOR2025') {
      rol = 'formador';
    } else if (accessCode === 'ABEXRES2025') {
      rol = 'residente';
    } else {
      return next(new ErrorResponse('Código de acceso inválido', 400));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('El usuario ya está registrado', 400));
    }

    const newUser = await User.create({
      nombre,
      apellidos,
      email,
      password,
      rol,
      hospital,
      especialidad,
      activo: true,
      consentimientoDatos: true,
      fechaRegistro: Date.now()
    });

    await inicializarProgresoFormativo(newUser);

    const jwtToken = generateToken(newUser);

    res.status(200).json({
      success: true,
      token: jwtToken,
      data: {
        _id: newUser._id,
        nombre: newUser.nombre,
        apellidos: newUser.apellidos,
        email: newUser.email,
        rol: newUser.rol,
        hospital: newUser.hospital
      }
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorResponse('Por favor, proporcione email y contraseña', 400));
    }

    const user = await User.findOne({ email }).select('+password').populate('hospital', 'nombre');

    if (!user || !user.activo) {
      return next(new ErrorResponse('Credenciales inválidas o cuenta inactiva', 401));
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Credenciales inválidas', 401));
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      data: {
        _id: user._id,
        nombre: user.nombre,
        apellidos: user.apellidos,
        email: user.email,
        rol: user.rol,
        hospital: user.hospital
      }
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('hospital', 'nombre');
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      nombre: req.body.nombre,
      apellidos: req.body.apellidos,
      email: req.body.email
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    }).populate('hospital', 'nombre');

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(new ErrorResponse('Debe proporcionar ambas contraseñas', 400));
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse('Contraseña actual incorrecta', 401));
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user);
    res.status(200).json({ success: true, token });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorResponse('No existe un usuario con ese email', 404));
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, resetToken });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ErrorResponse('Token inválido o expirado', 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user);
    res.status(200).json({ success: true, token });
  } catch (err) {
    next(err);
  }
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, rol: user.rol },
    config.jwtSecret,
    { expiresIn: config.jwtExpire }
  );
};

module.exports = {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword
};