const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { descargarInformeCirugias } = require('../controllers/informeCirugiasController');

router.use(protect);

router.get(
  '/:id',
  authorize('residente', 'tutor', 'csm', 'profesor', 'administrador'),
  descargarInformeCirugias,
);

module.exports = router;
