const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Role } = require('../utils/roles');

const {
  getAccessCodes,
  getAccessCode,
  createAccessCode,
  updateAccessCode,
  deleteAccessCode
} = require('../controllers/accessCodeController');

router.use(protect);
router.use(authorize(Role.ADMINISTRADOR));

router.route('/')
  .get(getAccessCodes)
  .post(createAccessCode);

router.route('/:id')
  .get(getAccessCode)
  .put(updateAccessCode)
  .delete(deleteAccessCode);

module.exports = router;
