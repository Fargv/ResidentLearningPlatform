const jwt = require('jsonwebtoken');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const crypto = require('crypto');
const User = require('../models/User');
const Fase = require('../models/Fase');
const ProgresoResidente = require('../models/ProgresoResidente');
const Sociedades = require('../models/Sociedades');
const AccessCode = require('../models/AccessCode');
const Hospital = require('../models/Hospital');
const Notificacion = require('../models/Notificacion');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const config = require('../config/config');
const { inicializarProgresoFormativo } = require('../utils/initProgreso');
const { Role } = require('../utils/roles');
const { resolveTutor } = require('../utils/resolveTutor');
const sendEmail = require('../utils/sendEmail');

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

const requestPasswordReset = async (req, res, next) => {
  try {
    const { email, mode } = req.body;
    const user = await User.findOne({ email }).populate('hospital');

    if (!user) {
      return next(new ErrorResponse('No existe un usuario con ese email', 404));
    }

    if (mode === 'automatic') {
      const resetToken = user.getResetPasswordToken(24 * 60 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      let frontendUrl = process.env.FRONTEND_URL || '';
      frontendUrl = frontendUrl ? frontendUrl.replace(/\/$/, '') : 'https://residentlearningplatform.netlify.app';
      const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

      const message = `Hola ${user.nombre || ''},\n\n` +
        'Has solicitado restablecer tu contraseña en la plataforma Resident Learning Platform.\n' +
        `Haz clic en el siguiente enlace para continuar con el proceso:\n\n${resetUrl}\n\n` +
        'Si no solicitaste este cambio, puedes ignorar este mensaje.';

      try {
        await sendEmail({
          email: user.email,
          subject: 'Restablecimiento de contraseña',
          message
        });
      } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new ErrorResponse('No se pudo enviar el email de restablecimiento', 500));
      }

      return res.status(200).json({ success: true });
    }

    const destinatarios = new Set();

    if (user.tutor) {
      destinatarios.add(user.tutor.toString());
    }

    let zona;
    if (user.hospital) {
      const hospital = user.hospital.zona ? user.hospital : await Hospital.findById(user.hospital);
      zona = hospital?.zona;
    }

    if (zona) {
      const csms = await User.find({ rol: Role.CSM, zona }).select('_id');
      csms.forEach((u) => destinatarios.add(u._id.toString()));
    }

    const admins = await User.find({ rol: Role.ADMINISTRADOR }).select('_id');
    admins.forEach((u) => destinatarios.add(u._id.toString()));

    if (user.hospital) {
      const tutoresAll = await User.find({
        rol: { $in: [Role.TUTOR, Role.PROFESOR] },
        hospital: user.hospital._id || user.hospital,
        especialidad: 'ALL'
      }).select('_id');
      tutoresAll.forEach((u) => destinatarios.add(u._id.toString()));
    }

    const notificaciones = Array.from(destinatarios).map((id) => ({
      usuario: id,
      tipo: 'passwordReset',
      mensaje: `${user.nombre} (${user.email}) ha solicitado un reseteo de contraseña.`,
      entidadRelacionada: { tipo: 'usuario', id: user._id }
    }));

    await Notificacion.insertMany(notificaciones);

    res.status(200).json({ success: true });
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

    // Generar token y establecer expiración (por ejemplo, 1 día)
    const resetToken = user.getResetPasswordToken(24 * 60 * 60 * 1000);

    await user.save({ validateBeforeSave: false });

    const baseFrontendUrl =
      config.frontendUrl || 'https://residentlearningplatform.netlify.app';
    const normalizedBaseUrl = baseFrontendUrl.endsWith('/')
      ? baseFrontendUrl.slice(0, -1)
      : baseFrontendUrl;
    const resetUrl = `${normalizedBaseUrl}/reset-password/${resetToken}`;

    const fullName = [user.nombre, user.apellidos]
      .filter(Boolean)
      .join(' ')
      .trim();
    const recipientName = fullName || user.email;

    const subject = 'Restablece tu contraseña en Resident Learning Platform';
    const textMessage = `Hola ${recipientName},

Hemos recibido una solicitud para restablecer tu contraseña en Resident Learning Platform.

Puedes completar el proceso utilizando el siguiente enlace: ${resetUrl}

Si no solicitaste este cambio, puedes ignorar este mensaje.`;
    const htmlMessage = `<p>Hola ${recipientName},</p>
<p>Hemos recibido una solicitud para restablecer tu contraseña en <strong>Resident Learning Platform</strong>.</p>
<p>Puedes completar el proceso utilizando el siguiente enlace:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>`;

    try {
      await sendEmail({
        to: [{ email: user.email, name: recipientName }],
        subject,
        message: textMessage,
        html: htmlMessage
      });
    } catch (emailError) {
      console.error('[forgotPassword] Error enviando email de restablecimiento', {
        userId: user._id?.toString(),
        email: user.email,
        error: emailError?.message || emailError
      });

      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new ErrorResponse(
          'No se pudo enviar el email de restablecimiento de contraseña',
          500
        )
      );
    }

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
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

const getResetPasswordUser = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ErrorResponse('Token inválido o expirado', 400));
    }

    res.status(200).json({ success: true, email: user.email });
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
  requestPasswordReset,
  forgotPassword,
  resetPassword,
  getResetPasswordUser,
  checkAccessCode
};
