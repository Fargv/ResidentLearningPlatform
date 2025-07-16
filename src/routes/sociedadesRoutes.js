const express = require('express');
const router = express.Router();
const {
  crearSociedad,
  obtenerSociedades,
  obtenerSociedad,
  actualizarSociedad,
  eliminarSociedad,
  obtenerSociedadesPublic
} = require('../controllers/sociedadesController');
const { protect, authorize } = require('../middleware/auth');

router.get('/public', obtenerSociedadesPublic);

router.post('/', protect, authorize('administrador'), crearSociedad);
router.get('/', protect, obtenerSociedades);
router.get('/:id', protect, obtenerSociedad);
router.put('/:id', protect, authorize('administrador'), actualizarSociedad);
router.delete('/:id', protect, authorize('administrador'), eliminarSociedad);
module.exports = router;
