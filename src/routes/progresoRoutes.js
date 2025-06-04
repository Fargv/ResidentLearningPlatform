const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  actualizarProgreso,
  crearProgresoParaUsuario,
  getAllProgreso,
  getEstadisticasResidente,
  getProgresoResidente,
  getProgresoResidentePorFase,
  getValidacionesPendientes,
  inicializarProgresoFormativo,
  marcarActividadCompletada,
  rechazarActividad,
  rechazarProgreso,
  registrarProgreso,
  validarActividad,
  validarProgreso
} = require('../controllers/progresoController');

// ✅ Middleware de autenticación para todas las rutas
router.use(protect);

// ✅ Validaciones pendientes del formador
router.get('/formador/validaciones/pendientes', authorize('formador'), getValidacionesPendientes);

// ✅ Listado general y creación de progreso
router.route('/')
  .get(authorize('administrador'), getAllProgreso)
  .post(registrarProgreso);

// ✅ Obtener progreso de un residente
router.route('/residente/:id')
  .get(getProgresoResidente);

// ✅ Obtener progreso por fase
router.route('/residente/:id/fase/:faseId')
  .get(getProgresoResidentePorFase);

// ✅ Estadísticas por residente
router.route('/stats/residente/:id')
  .get(getEstadisticasResidente);

// ✅ Actualizar progreso
router.route('/:id')
  .put(actualizarProgreso);

// ✅ Marcar actividad completada
router.put('/:id/actividad/:index', marcarActividadCompletada);

router.post('/:id/actividad/:index/validar', authorize('formador', 'administrador'), validarActividad);
router.post('/:id/actividad/:index/rechazar', authorize('formador', 'administrador'), rechazarActividad);

// ✅ Validar o rechazar progreso
router.route('/:id/validar')
  .post(authorize('formador', 'administrador'), validarProgreso);

router.route('/:id/rechazar')
  .post(authorize('formador', 'administrador'), rechazarProgreso);

// ✅ Inicializar progreso formativo de un residente
router.post('/init/:id', authorize('administrador'), inicializarProgresoFormativo);

router.post('/crear/:id', authorize('administrador'), crearProgresoParaUsuario);

module.exports = router;
