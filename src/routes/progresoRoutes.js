const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  inicializarProgresoFormativo,
  getAllProgreso,
  getProgresoResidente,
  getProgresoResidentePorFase,
  registrarProgreso,
  actualizarProgreso,
  validarProgreso,
  rechazarProgreso,
  getEstadisticasResidente,
  marcarActividadCompletada,
  getProgreso,
  getProgresosPendientesDelHospital,
} = require('../controllers/progresoController');

// ✅ Middleware de autenticación
router.use(protect);

// ✅ Ruta específica para formador primero (¡esto evita el conflicto!)
router.get('/formador/pendientes', authorize('formador'), getProgresosPendientesDelHospital);

// ✅ Rutas para administrador
router.route('/')
  .get(authorize('administrador'), getAllProgreso);

// ✅ Rutas generales por ID de residente
router.route('/residente/:id')
  .get(getProgresoResidente);

router.route('/residente/:id/fase/:faseId')
  .get(getProgresoResidentePorFase);

router.route('/stats/residente/:id')
  .get(getEstadisticasResidente);

// ✅ Registro y actualización
router.route('/')
  .post(registrarProgreso);

router.route('/:id')
  .put(actualizarProgreso);

// ✅ Validación
router.route('/:id/validar')
  .post(authorize('formador', 'administrador'), validarProgreso);

router.route('/:id/rechazar')
  .post(authorize('formador', 'administrador'), rechazarProgreso);

router.post('/init/:id', authorize('administrador'), inicializarProgresoFormativo);

router.put('/:id/actividad/:index', protect, marcarActividadCompletada);

// ✅ ESTA VA AL FINAL para evitar conflicto con /formador/pendientes
router.get('/:id', authorize('formador'), getProgreso);

module.exports = router;
