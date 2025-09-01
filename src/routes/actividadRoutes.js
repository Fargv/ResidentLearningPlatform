const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Role } = require('../utils/roles');

const {
  getActividades,
  getActividad,
  createActividad,
  updateActividad,
  deleteActividad,
  reorderActividades
} = require('../controllers/actividadController');

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
    getActividades
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
    getActividad
  );
// Rutas solo para administradores
router.route('/')
  .post(authorize(Role.ADMINISTRADOR), createActividad);

router.route('/:id')
  .put(authorize(Role.ADMINISTRADOR), updateActividad)
  .delete(authorize(Role.ADMINISTRADOR), deleteActividad);

router.route('/reorder')
  .put(authorize(Role.ADMINISTRADOR), reorderActividades);

module.exports = router;
