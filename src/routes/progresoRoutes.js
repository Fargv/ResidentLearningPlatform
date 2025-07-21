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
  validarProgreso,
  getCountProgresosByActividad,
  getCountProgresosByFase
} = require('../controllers/progresoController');

// ✅ Middleware de autenticación para todas las rutas
router.use(protect);

// ✅ Validaciones pendientes del formador
router.get('/formador/validaciones/pendientes', authorize('formador', 'instructor'), getValidacionesPendientes);
router.get('/admin/validaciones/pendientes', authorize('administrador'), getValidacionesPendientesAdmin);

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

router.post('/:id/actividad/:index/validar', authorize('formador', 'instructor', 'administrador'), validarActividad);
router.post('/:id/actividad/:index/rechazar', authorize('formador', 'instructor', 'administrador'), rechazarActividad);


// ✅ Validar o rechazar progreso
router.route('/:id/validar')
  .post(authorize('formador', 'instructor', 'administrador'), validarProgreso);

router.route('/:id/rechazar')
  .post(authorize('formador', 'instructor', 'administrador'), rechazarProgreso);

// ✅ Inicializar progreso formativo de un residente
router.post('/init/:id', authorize('administrador'), inicializarProgresoFormativo);

router.post('/crear/:id', authorize('administrador'), crearProgresoParaUsuario);

router.get('/actividad/:id/count', getCountProgresosByActividad);
router.get('/fase/:id/count', getCountProgresosByFase);

module.exports = router;
