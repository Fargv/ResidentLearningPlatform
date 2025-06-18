const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllActiveProgress,
  updateActivityStatus,
  updatePhaseStatusAdmin
} = require('../controllers/adminController');

router.use(protect);
router.use(authorize('administrador'));

router.get('/progresos', getAllActiveProgress);
router.post('/cambiar-estado-actividad', updateActivityStatus);
router.post('/cambiar-estado-fase', updatePhaseStatusAdmin);

module.exports = router;
