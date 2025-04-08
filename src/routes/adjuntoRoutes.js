const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  subirAdjunto,
  getAdjuntosProgreso,
  eliminarAdjunto,
  descargarAdjunto
} = require('../controllers/adjuntoController');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para subir y obtener adjuntos (con verificación de permisos en el controlador)
router.route('/:progresoId')
  .post(subirAdjunto);

router.route('/progreso/:progresoId')
  .get(getAdjuntosProgreso);

// Rutas para eliminar y descargar adjuntos (con verificación de permisos en el controlador)
router.route('/:id')
  .delete(eliminarAdjunto);

router.route('/:id/download')
  .get(descargarAdjunto);

module.exports = router;
