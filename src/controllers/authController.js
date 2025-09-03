const jwt = require('jsonwebtoken');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const crypto = require('crypto');
const User = require('../models/User');
const Fase = require('../models/Fase');
const ProgresoResidente = require('../models/ProgresoResidente');
const Sociedades = require('../models/Sociedades');
const AccessCode = require('../models/AccessCode');
const Hospital = require('../models/Hospital');
const ErrorResponse = require('../utils/errorResponse');
const config = require('../config/config');
const { inicializarProgresoFormativo } = require('../utils/initProgreso');
const { Role } = require('../utils/roles');
const { resolveTutor } = require('../utils/resolveTutor');

const legacyRoles = {
  formador: Role.TUTOR,
  coordinador: Role.CSM,
  instructor: Role.PROFESOR,
  alumno: Role.PARTICIPANTE
};

const checkAccessCode = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const data = await AccessCode.findOne({ codigo }).lean();

    if (!data) {
      return next(new ErrorResponse('Código de acceso inválido', 400));
    }
    const role = legacyRoles[data.rol] || data.rol;
    res.status(200).json({ success: true, data: { ...data, rol: role } });
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const {
      nombre,
      apellidos,
      email,
      password,
      codigoAcceso,
      hospital,
      sociedad,
      consentimientoDatos,
      especialidad,
      tutor,
      zona: zonaInput
    } = req.body;

    const access = await AccessCode.findOne({ codigo: codigoAcceso });
    if (!codigoAcceso || !access) {
      return next(new ErrorResponse('Código de acceso inválido', 400));
    }

    const { rol: rawRol, tipo } = access;
    const rol = legacyRoles[rawRol] || rawRol;

    let zona = zonaInput;
    if (hospital) {
      const selectedHospital = await Hospital.findById(hospital);
      if (!selectedHospital) {
        return next(new ErrorResponse('Hospital no encontrado', 404));
      }
      zona = selectedHospital.zona;
    }

    if (rol === Role.CSM && !zona) {
      return next(new ErrorResponse('Zona requerida', 400));
    }

    if (!consentimientoDatos) {
      return next(new ErrorResponse('Debe aceptar el tratamiento de datos personales', 400));
    }

    if (
      tipo === 'Programa Residentes' &&
      ![
        Role.RESIDENTE,
        Role.TUTOR,
        Role.ADMINISTRADOR,
        Role.CSM,
        Role.PARTICIPANTE
      ].includes(rol)
    ) {
      return next(new ErrorResponse('Rol inválido para el programa', 400));
    }

    if (
      tipo === 'Programa Sociedades' &&
      ![Role.PARTICIPANTE, Role.PROFESOR, Role.ADMINISTRADOR].includes(rol)
    ) {
      return next(new ErrorResponse('Rol inválido para el programa', 400));
    }

    if (
      tipo === 'Programa Residentes' &&
      !hospital &&
      (rol === Role.RESIDENTE || rol === Role.TUTOR)
    ) {
      return next(new ErrorResponse('Hospital requerido', 400));
    }

    if (tipo === 'Programa Sociedades') {
      if (!sociedad) {
        return next(new ErrorResponse('Sociedad requerida', 400));
      }

      const sociedadActiva = await Sociedades.findOne({ _id: sociedad, status: 'ACTIVO' });
      if (!sociedadActiva) {
        return next(new ErrorResponse('Sociedad no válida o inactiva', 400));
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('El usuario ya está registrado', 400));
    }

    const resolvedTutor =
      rol === Role.RESIDENTE ? await resolveTutor(tutor, hospital, especialidad) : null;

    let newUser;
    try {
      newUser = await User.create({
        nombre,
        apellidos,
        email,
        password,
        rol,
        tipo,
        hospital: tipo === 'Programa Residentes' ? hospital : undefined,
        sociedad: tipo === 'Programa Sociedades' ? sociedad : undefined,
        especialidad,
        tutor: resolvedTutor,
        zona,
        activo: true,
        consentimientoDatos: true,
        fechaRegistro: Date.now()
      });

      if (rol === Role.RESIDENTE || rol === Role.PARTICIPANTE) {
        await inicializarProgresoFormativo(newUser);
      }
    } catch (err) {
      if (newUser) {
        await ProgresoResidente.deleteMany({ residente: newUser._id });
        await User.deleteOne({ _id: newUser._id });
      }
      return next(
        new ErrorResponse(
          'No se pudo completar el registro. Ni el usuario ni el progreso fueron creados',
          500
        )
      );
    }

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
        hospital: newUser.hospital,
        sociedad: newUser.sociedad,
        tipo: newUser.tipo,
        tutor: newUser.tutor,
        zona: newUser.zona
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
        hospital: user.hospital,
        zona: user.zona
      }
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('hospital', 'nombre')
      .populate('tutor', 'nombre apellidos');
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
  resetPassword,
  checkAccessCode
};