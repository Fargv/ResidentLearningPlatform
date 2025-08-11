// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getUsers,
  createUser,
  getUser,
  updateUser,
  updateUserStatus,
  updateUserPassword,
  inviteUser,
  getInvitations,
  cancelInvitation,
  getFormadorResidentes,
  getResidenteFormadores,
  getInstructorAlumnos,
  getUsersByHospital,
  deleteUser
} = require('../controllers/userController');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas solo para administradores y formadores
router.get('/hospital/:hospitalId', authorize('administrador', 'tutor', 'csm'), getUsersByHospital);

// Rutas para administradores, formadores, coordinadores e instructores
router.route('/')
  .get(authorize('administrador', 'tutor', 'csm', 'profesor'), getUsers)
  .post(authorize('administrador'), createUser);

router.route('/invite')
  .post(authorize('administrador', 'profesor'), inviteUser);

router.route('/invitations')
  .get(authorize('administrador'), getInvitations);

router.route('/invitations/:id')
  .delete(authorize('administrador'), cancelInvitation);

// Rutas para administradores y formadores
router.route('/formador/:id/residentes')
  .get(authorize('administrador', 'tutor', 'csm'), getFormadorResidentes);

router.route('/instructor/:id/alumnos')
  .get(authorize('administrador', 'profesor'), getInstructorAlumnos);

// Rutas para todos los roles
router.route('/residente/:id/formadores')
  .get(getResidenteFormadores);

router.route('/:id')
  .get(authorize('administrador'), getUser)
  .put(authorize('administrador', 'profesor'), updateUser)
  .delete(authorize('administrador', 'profesor'), deleteUser);

router.route('/:id/password')
  .put(authorize('administrador'), updateUserPassword);

router.route('/:id/status')
  .put(authorize('administrador'), updateUserStatus);

module.exports = router;
