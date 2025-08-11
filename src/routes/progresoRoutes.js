const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Role } = require('../utils/roles');

const {
  actualizarProgreso,
  crearProgresoParaUsuario,
  getAllProgreso,
  getEstadisticasResidente,
  getProgresoResidente,
  getProgresoResidentePorFase,
  getValidacionesPendientes,
  getValidacionesPendientesAdmin, 
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
router.get('/formador/validaciones/pendientes', authorize(Role.TUTOR, Role.CSM, Role.PROFESOR), getValidacionesPendientes);
router.get('/admin/validaciones/pendientes', authorize(Role.ADMINISTRADOR), getValidacionesPendientesAdmin);

// ✅ Listado general y creación de progreso
router.route('/')
  .get(authorize(Role.ADMINISTRADOR), getAllProgreso)
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

router.post('/:id/actividad/:index/validar', authorize(Role.TUTOR, Role.CSM, Role.PROFESOR, Role.ADMINISTRADOR), validarActividad);
router.post('/:id/actividad/:index/rechazar', authorize(Role.TUTOR, Role.CSM, Role.PROFESOR, Role.ADMINISTRADOR), rechazarActividad);


// ✅ Validar o rechazar progreso
router.route('/:id/validar')
  .post(authorize(Role.TUTOR, Role.CSM, Role.PROFESOR, Role.ADMINISTRADOR), validarProgreso);

router.route('/:id/rechazar')
  .post(authorize(Role.TUTOR, Role.CSM, Role.PROFESOR, Role.ADMINISTRADOR), rechazarProgreso);

// ✅ Inicializar progreso formativo de un residente
router.post('/init/:id', authorize(Role.ADMINISTRADOR), inicializarProgresoFormativo);

router.post('/crear/:id', authorize(Role.ADMINISTRADOR), crearProgresoParaUsuario);

router.get('/actividad/:id/count', getCountProgresosByActividad);
router.get('/fase/:id/count', getCountProgresosByFase);

module.exports = router;