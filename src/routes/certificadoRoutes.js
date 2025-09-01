const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { descargarCertificado } = require('../controllers/certificadoController');

router.use(protect);

router.get('/:id', authorize('residente', 'participante', 'tutor', 'csm', 'profesor', 'administrador'), descargarCertificado);

module.exports = router;
