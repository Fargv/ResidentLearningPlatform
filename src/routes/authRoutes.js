const express = require('express');
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  requestPasswordReset,
  forgotPassword,
  resetPassword,
  getResetPasswordUser,
  checkAccessCode
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.get('/resetpassword/:token', getResetPasswordUser);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/request-reset', requestPasswordReset);
router.get('/codigos/:codigo', checkAccessCode);

// Rutas protegidas
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
