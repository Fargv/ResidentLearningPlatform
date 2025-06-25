const express = require('express');
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  checkAccessCode
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/codigos/:codigo', checkAccessCode);

// Rutas protegidas
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
