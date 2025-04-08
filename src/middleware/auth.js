import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';
import ErrorResponse from '../utils/errorResponse.js';
import config from '../config/config.js';



// Middleware para proteger rutas
export const protect = async (req, res, next) => {
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
    const decoded: any = jwt.verify(token, config.jwtSecret);

    // Añadir usuario al request
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(new ErrorResponse('No autorizado para acceder a esta ruta', 401));
  }
};

// Middleware para autorizar roles
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
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
