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

// 🟢 Ruta pública para que el formulario de registro cargue hospitales
router.get('/', getHospitals);

// 🔒 Todas las demás rutas requieren login
router.use(protect);

router.route('/:id')
  .get(getHospital);

router.route('/')
  .post(authorize('administrador'), createHospital);

router.route('/:id')
  .put(authorize('administrador'), updateHospital)
  .delete(authorize('administrador'), deleteHospital);

router.route('/:id/residentes')
  .get(authorize('administrador', 'tutor', 'csm'), getHospitalResidentes);

router.route('/:id/formadores')
  .get(authorize('administrador'), getHospitalFormadores);

router.route('/:id/stats')
  .get(authorize('administrador', 'tutor', 'csm'), getHospitalStats);

module.exports = router;
