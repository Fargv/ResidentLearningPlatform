const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Role } = require('../utils/roles');

const {
  getNotificacionesUsuario,
  getNotificacionesNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
  clearPasswordResetNotifications
} = require('../controllers/notificacionController');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para obtener notificaciones del usuario actual
router.route('/')
  .get(getNotificacionesUsuario);

router.route('/no-leidas')
  .get(getNotificacionesNoLeidas);

// Rutas para marcar notificaciones como leídas
router.route('/:id/leer')
  .put(marcarComoLeida);

router.route('/leer-todas')
  .put(marcarTodasComoLeidas);

router.delete(
  '/password-reset/:userId',
  authorize(Role.ADMINISTRADOR, Role.TUTOR, Role.CSM),
  clearPasswordResetNotifications
);

// Ruta para eliminar notificación
router.route('/:id')
  .delete(eliminarNotificacion);

module.exports = router;
