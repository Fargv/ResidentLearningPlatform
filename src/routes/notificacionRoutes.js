const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getNotificacionesUsuario,
  getNotificacionesNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion
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

// Ruta para eliminar notificación
router.route('/:id')
  .delete(eliminarNotificacion);

module.exports = router;
