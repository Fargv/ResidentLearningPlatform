const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getAccessCodes,
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
  .put(updateAccessCode)
  .delete(deleteAccessCode);

module.exports = router;
