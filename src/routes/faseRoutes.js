const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Role } = require('../utils/roles');

const {
  getFases,
  getFase,
  createFase,
  updateFase,
  deleteFase,
  getFaseActividades,
  reorderFases
} = require('../controllers/faseController');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para todos los roles
router.route('/')
  .get(
    authorize(
      Role.ADMINISTRADOR,
      Role.TUTOR,
      Role.CSM,
      Role.RESIDENTE,
      Role.PARTICIPANTE
    ),
    getFases
  );

router.route('/:id')
  .get(
    authorize(
      Role.ADMINISTRADOR,
      Role.TUTOR,
      Role.CSM,
      Role.RESIDENTE,
      Role.PARTICIPANTE
    ),
    getFase
  );

router.route('/:id/actividades')
  .get(
    authorize(
      Role.ADMINISTRADOR,
      Role.TUTOR,
      Role.CSM,
      Role.RESIDENTE,
      Role.PARTICIPANTE
    ),
    getFaseActividades
  );
  
// Rutas solo para administradores
router.route('/')
  .post(authorize(Role.ADMINISTRADOR), createFase);

router.route('/:id')
  .put(authorize(Role.ADMINISTRADOR), updateFase)
  .delete(authorize(Role.ADMINISTRADOR), deleteFase);

router.route('/reorder')
  .put(authorize(Role.ADMINISTRADOR), reorderFases);

module.exports = router;
