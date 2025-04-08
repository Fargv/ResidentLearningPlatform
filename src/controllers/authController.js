import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import ErrorResponse from '../utils/errorResponse.js';
import config from '../config/config.js';

// @desc    Registrar un usuario a partir de una invitación
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { nombre, apellidos, password, token, consentimientoDatos } = req.body;

    if (!token) {
      return next(new ErrorResponse('Token de invitación requerido', 400));
    }

    if (!consentimientoDatos) {
      return next(new ErrorResponse('Debe aceptar el tratamiento de datos personales', 400));
    }

    // Verificar token de invitación
    const invitacion = await User.findOne({
      invitacionToken: token,
      invitacionExpira: { $gt: Date.now() }
    });

    if (!invitacion) {
      return next(new ErrorResponse('Token de invitación inválido o expirado', 400));
    }

    // Actualizar usuario con datos de registro
    invitacion.nombre = nombre || invitacion.nombre;
    invitacion.apellidos = apellidos || invitacion.apellidos;
    invitacion.password = password;
    invitacion.invitacionToken = undefined;
    invitacion.invitacionExpira = undefined;
    invitacion.activo = true;
    invitacion.consentimientoDatos = true;
    invitacion.fechaRegistro = Date.now();

    await invitacion.save();

    // Generar token JWT
    const jwtToken = generateToken(invitacion);

    res.status(200).json({
      success: true,
      token: jwtToken,
      data: {
        _id: invitacion._id,
        nombre: invitacion.nombre,
        apellidos: invitacion.apellidos,
        email: invitacion.email,
        rol: invitacion.rol,
        hospital: invitacion.hospital
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar email y password
    if (!email || !password) {
      return next(new ErrorResponse('Por favor, proporcione email y contraseña', 400));
    }

    // Verificar si el usuario existe
    const user = await User.findOne({ email }).select('+password').populate('hospital', 'nombre');

    if (!user) {
      return next(new ErrorResponse('Credenciales inválidas', 401));
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
      return next(new ErrorResponse('Su cuenta no está activa. Por favor, complete el registro o contacte con el administrador', 401));
    }

    // Verificar si la contraseña coincide
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Credenciales inválidas', 401));
    }

    // Generar token JWT
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('hospital', 'nombre');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar datos de usuario
// @route   PUT /api/auth/updatedetails
// @access  Private
export const updateDetails = async (req, res, next) => {
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

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar contraseña
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new ErrorResponse('Por favor, proporcione la contraseña actual y la nueva', 400));
    }

    const user = await User.findById(req.user.id).select('+password');

    // Verificar contraseña actual
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return next(new ErrorResponse('Contraseña actual incorrecta', 401));
    }

    user.password = newPassword;
    await user.save();

    // Generar nuevo token JWT
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Solicitar restablecimiento de contraseña
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return next(new ErrorResponse('No existe un usuario con ese email', 404));
    }

    // Generar token de restablecimiento
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token y establecer campo resetPasswordToken
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Establecer fecha de expiración (10 minutos)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // TODO: Enviar email con token de restablecimiento
    // Por ahora, solo devolvemos el token para pruebas
    res.status(200).json({
      success: true,
      resetToken
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Restablecer contraseña
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    // Obtener token hasheado
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ErrorResponse('Token inválido o expirado', 400));
    }

    // Establecer nueva contraseña
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generar token JWT
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token
    });
  } catch (err) {
    next(err);
  }
};

// Función para generar token JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      rol: user.rol
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpire
    }
  );
};
