const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Role } = require('../utils/roles');

const {
  getSurgeryTypes,
  getSurgeryType,
  createSurgeryType,
  updateSurgeryType,
  deleteSurgeryType
} = require('../controllers/surgeryTypeController');

router.use(protect);

router
  .route('/')
  .get(getSurgeryTypes)
  .post(authorize(Role.ADMINISTRADOR), createSurgeryType);

router
  .route('/:id')
  .get(getSurgeryType)
  .put(authorize(Role.ADMINISTRADOR), updateSurgeryType)
  .delete(authorize(Role.ADMINISTRADOR), deleteSurgeryType);

module.exports = router;
