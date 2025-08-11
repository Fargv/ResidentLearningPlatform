const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { descargarCertificado } = require('../controllers/certificadoController');
const { Role } = require('../utils/roles');

router.use(protect);

router.get(
  '/:id',
  authorize(
    Role.RESIDENTE,
    Role.PARTICIPANTE,
    Role.TUTOR,
    Role.CSM,
    Role.PROFESOR,
    Role.ADMINISTRADOR
  ),
  descargarCertificado
);

module.exports = router;
