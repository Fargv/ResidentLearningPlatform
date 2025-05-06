const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const config = require('../config/config');

// Middleware para proteger rutas
const protect = async (req, res, next) => {
  let token;

  // Verificar si hay token en los headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Obtener token del header
    token = req.headers.authorization.split(' ')[1];
  }

  // Verificar si el token existe
  if (!token) {
    return next(new ErrorResponse('No autorizado para acceder a esta ruta', 401));
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Añadir usuario al request
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(new ErrorResponse('No autorizado para acceder a esta ruta', 401));
  }
};

// Middleware para autorizar roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('No autorizado para acceder a esta ruta', 401));
    }

    if (!roles.includes(req.user.rol)) {
      return next(
        new ErrorResponse(
          `El rol ${req.user.rol} no está autorizado para acceder a esta ruta`,
          403
        )
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
