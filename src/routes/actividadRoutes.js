const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getActividades,
  getActividad,
  createActividad,
  updateActividad,
  deleteActividad,
  reorderActividades
} = require('../controllers/actividadController');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para todos los roles
router.route('/')
  .get(authorize('administrador', 'formador', 'coordinador', 'residente', 'alumno'), getActividades);

router.route('/:id')
  .get(authorize('administrador', 'formador', 'coordinador', 'residente', 'alumno'), getActividad);
// Rutas solo para administradores
router.route('/')
  .post(authorize('administrador'), createActividad);

router.route('/:id')
  .put(authorize('administrador'), updateActividad)
  .delete(authorize('administrador'), deleteActividad);

router.route('/reorder')
  .put(authorize('administrador'), reorderActividades);

module.exports = router;
