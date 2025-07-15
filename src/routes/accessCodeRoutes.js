const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getAccessCodes,
  getAccessCode,
  createAccessCode,
  updateAccessCode,
  deleteAccessCode
} = require('../controllers/accessCodeController');

router.use(protect);
router.use(authorize('administrador'));

router.route('/')
  .get(getAccessCodes)
  .post(createAccessCode);

router.route('/:id')
  .get(getAccessCode)
  .put(updateAccessCode)
  .delete(deleteAccessCode);

module.exports = router;
