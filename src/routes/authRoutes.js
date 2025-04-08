import express from 'express';
import {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Rutas protegidas
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

export default router;
