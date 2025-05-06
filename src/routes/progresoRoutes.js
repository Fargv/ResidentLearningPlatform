const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const progresoController = require('../controllers/progresoController');

// ✅ Middleware de autenticación global
router.use(protect);

// ✅ Ruta específica para formador primero
router.get(
  '/formador/validaciones/pendientes',
  authorize('formador'),
  progresoController.getProgresosPendientesDelHospital
);

// ✅ Rutas para administrador y creación
router.route('/')
  .get(authorize('administrador'), progresoController.getAllProgreso)
  .post(progresoController.registrarProgreso);

// ✅ Rutas generales por ID de residente
router.route('/residente/:id')
  .get(progresoController.getProgresoResidente);

router.route('/residente/:id/fase/:faseId')
  .get(progresoController.getProgresoResidentePorFase);

router.route('/stats/residente/:id')
  .get(progresoController.getEstadisticasResidente);

// ✅ Actualización de progreso y actividades
router.route('/:id')
  .put(progresoController.actualizarProgreso);

router.put('/:id/actividad/:index', protect, progresoController.marcarActividadCompletada);

// ✅ Validación
router.route('/:id/validar')
  .post(authorize('formador', 'administrador'), progresoController.validarProgreso);

router.route('/:id/rechazar')
  .post(authorize('formador', 'administrador'), progresoController.rechazarProgreso);

// ✅ Inicialización de progreso
router.post('/init/:id', authorize('administrador'), progresoController.inicializarProgresoFormativo);

// ✅ Esta va al final para evitar conflictos con otras rutas
router.get('/:id', authorize('formador'), progresoController.getProgreso);

module.exports = router;
