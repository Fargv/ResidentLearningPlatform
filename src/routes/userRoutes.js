// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getUsers,
  getUser,
  updateUser,
  updateUserStatus,
  inviteUser,
  getInvitations,
  cancelInvitation,
  getFormadorResidentes,
  getResidenteFormadores,
  getUsersByHospital
} = require('../controllers/userController');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas solo para administradores y formadores
router.get('/hospital/:hospitalId', authorize('administrador', 'formador'), getUsersByHospital);

// Rutas solo para administradores
router.route('/')
  .get(authorize('administrador', 'formador'), getUsers);

router.route('/invite')
  .post(authorize('administrador'), inviteUser);

router.route('/invitations')
  .get(authorize('administrador'), getInvitations);

router.route('/invitations/:id')
  .delete(authorize('administrador'), cancelInvitation);

// Rutas para administradores y formadores
router.route('/formador/:id/residentes')
  .get(authorize('administrador', 'formador'), getFormadorResidentes);

// Rutas para todos los roles
router.route('/residente/:id/formadores')
  .get(getResidenteFormadores);

router.route('/:id')
  .get(authorize('administrador'), getUser)
  .put(authorize('administrador'), updateUser)
  .delete(authorize('administrador'), deleteUser);

router.route('/:id/status')
  .put(authorize('administrador'), updateUserStatus);

module.exports = router;