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
router.use(authorize(Role.ADMINISTRADOR));

router.route('/')
  .get(getSurgeryTypes)
  .post(createSurgeryType);

router.route('/:id')
  .get(getSurgeryType)
  .put(updateSurgeryType)
  .delete(deleteSurgeryType);

module.exports = router;
