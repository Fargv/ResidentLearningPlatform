const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getAllProgreso,
  getProgresoResidente,
  getProgresoResidentePorFase,
  registrarProgreso,
  actualizarProgreso,
  validarProgreso,
  rechazarProgreso,
  getEstadisticasResidente
} = require('../controllers/progresoController');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para administradores
router.route('/')
  .get(authorize('administrador'), getAllProgreso);

// Rutas para todos los roles (con verificación de permisos en el controlador)
router.route('/residente/:id')
  .get(getProgresoResidente);

router.route('/residente/:id/fase/:faseId')
  .get(getProgresoResidentePorFase);

router.route('/stats/residente/:id')
  .get(getEstadisticasResidente);

// Rutas para registrar y actualizar progreso
router.route('/')
  .post(registrarProgreso);

router.route('/:id')
  .put(actualizarProgreso);

// Rutas para formadores y administradores
router.route('/:id/validar')
  .post(authorize('formador', 'administrador'), validarProgreso);

router.route('/:id/rechazar')
  .post(authorize('formador', 'administrador'), rechazarProgreso);

router.post('/init/:id', authorize('administrador'), inicializarProgresoFormativo);

module.exports = router;
