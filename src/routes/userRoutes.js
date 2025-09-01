// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Role } = require('../utils/roles');

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
  getTutorResidentes,
  getResidenteTutores,
  getProfesorParticipantes,
  getUsersByHospital,
  deleteUser
} = require('../controllers/userController');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas solo para administradores, tutores y CSM
router.get('/hospital/:hospitalId', authorize(Role.ADMINISTRADOR, Role.TUTOR, Role.CSM), getUsersByHospital);

// Rutas para administradores, tutores, CSM y profesores
router.route('/')
  .get(authorize(Role.ADMINISTRADOR, Role.TUTOR, Role.CSM, Role.PROFESOR), getUsers)
  .post(authorize(Role.ADMINISTRADOR), createUser);

router.route('/invite')
  .post(authorize(Role.ADMINISTRADOR, Role.PROFESOR), inviteUser);

router.route('/invitations')
  .get(authorize(Role.ADMINISTRADOR), getInvitations);

router.route('/invitations/:id')
  .delete(authorize(Role.ADMINISTRADOR), cancelInvitation);

// Rutas para administradores, tutores y CSM
router.route('/tutor/:id/residentes')
  .get(authorize(Role.ADMINISTRADOR, Role.TUTOR, Role.CSM), getTutorResidentes);

// Rutas para administradores y profesores
router.route('/profesor/:id/participantes')
  .get(authorize(Role.ADMINISTRADOR, Role.PROFESOR), getProfesorParticipantes);

// Rutas para todos los roles
router.route('/residente/:id/tutores')
  .get(getResidenteTutores);

router.route('/:id')
  .get(authorize(Role.ADMINISTRADOR), getUser)
  .put(authorize(Role.ADMINISTRADOR, Role.PROFESOR), updateUser)
  .delete(authorize(Role.ADMINISTRADOR, Role.PROFESOR), deleteUser);

router.route('/:id/password')
  .put(authorize(Role.ADMINISTRADOR), updateUserPassword);

router.route('/:id/status')
  .put(authorize(Role.ADMINISTRADOR), updateUserStatus);

module.exports = router;
