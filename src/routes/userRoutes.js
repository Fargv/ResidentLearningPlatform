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
  getResidenteFormadores
} = require('../controllers/userController');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas solo para administradores
router.route('/')
  .get(authorize('administrador'), getUsers);

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
  .put(authorize('administrador'), updateUser);

router.route('/:id/status')
  .put(authorize('administrador'), updateUserStatus);

module.exports = router;
