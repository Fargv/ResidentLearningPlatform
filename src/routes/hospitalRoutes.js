const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Role } = require('../utils/roles');

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
  .post(authorize(Role.ADMINISTRADOR), createHospital);

router.route('/:id')
  .put(authorize(Role.ADMINISTRADOR), updateHospital)
  .delete(authorize(Role.ADMINISTRADOR), deleteHospital);

router.route('/:id/residentes')
  .get(authorize(Role.ADMINISTRADOR, Role.TUTOR, Role.CSM), getHospitalResidentes);

router.route('/:id/formadores')
  .get(authorize(Role.ADMINISTRADOR), getHospitalFormadores);

router.route('/:id/stats')
  .get(authorize(Role.ADMINISTRADOR, Role.TUTOR, Role.CSM), getHospitalStats);

module.exports = router;
