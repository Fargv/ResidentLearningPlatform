const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log para desarrollo
  console.log(err);

  // Error de Mongoose - ID no válido
  if (err.name === 'CastError') {
    const message = `Recurso no encontrado`;
    error = new ErrorResponse(message, 404);
  }

  // Error de Mongoose - Campos duplicados
  if (err.code === 11000) {
    const message = 'Valor duplicado ingresado';
    error = new ErrorResponse(message, 400);
  }

  // Error de Mongoose - Validación
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Error del servidor'
  });
};

module.exports = errorHandler;
