const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getHospitals,
  getHospital,
  createHospital,
  updateHospital,
  deleteHospital,
  getHospitalResidentes,
  getHospitalFormadores,
  getHospitalStats
} = require('../controllers/hospitalController');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para todos los roles
router.route('/')
  .get(getHospitals);

router.route('/:id')
  .get(getHospital);

// Rutas solo para administradores
router.route('/')
  .post(authorize('administrador'), createHospital);

router.route('/:id')
  .put(authorize('administrador'), updateHospital)
  .delete(authorize('administrador'), deleteHospital);

// Rutas para administradores y formadores
router.route('/:id/residentes')
  .get(authorize('administrador', 'formador'), getHospitalResidentes);

router.route('/:id/formadores')
  .get(authorize('administrador'), getHospitalFormadores);

router.route('/:id/stats')
  .get(authorize('administrador', 'formador'), getHospitalStats);

module.exports = router;
