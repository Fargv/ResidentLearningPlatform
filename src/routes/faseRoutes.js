const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getFases,
  getFase,
  createFase,
  updateFase,
  deleteFase,
  getFaseActividades,
  reorderFases
} = require('../controllers/faseController');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para todos los roles
router.route('/')
  .get(authorize('administrador', 'formador', 'residente', 'alumno'), getFases);

router.route('/:id')
  .get(authorize('administrador', 'formador', 'residente', 'alumno'), getFase);

router.route('/:id/actividades')
  .get(authorize('administrador', 'formador', 'residente', 'alumno'), getFaseActividades);
  
// Rutas solo para administradores
router.route('/')
  .post(authorize('administrador'), createFase);

router.route('/:id')
  .put(authorize('administrador'), updateFase)
  .delete(authorize('administrador'), deleteFase);

router.route('/reorder')
  .put(authorize('administrador'), reorderFases);

module.exports = router;

