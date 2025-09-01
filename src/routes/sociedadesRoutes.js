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
const { Role } = require('../utils/roles');

router.get('/public', obtenerSociedadesPublic);

router.post('/', protect, authorize(Role.ADMINISTRADOR), crearSociedad);
router.get('/', protect, obtenerSociedades);
router.get('/:id', protect, obtenerSociedad);
router.put('/:id', protect, authorize(Role.ADMINISTRADOR), actualizarSociedad);
router.delete('/:id', protect, authorize(Role.ADMINISTRADOR), eliminarSociedad);
module.exports = router;
