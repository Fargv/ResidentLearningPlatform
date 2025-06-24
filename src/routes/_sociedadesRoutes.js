const express = require('express');
const router = express.Router();
const { crearSociedad, obtenerSociedades, obtenerSociedad, actualizarSociedad, eliminarSociedad } = require('../controllers/sociedadesController');
const { proteger, esAdmin } = require('../middleware/auth');

router.post('/', proteger, esAdmin, crearSociedad);
router.get('/', proteger, obtenerSociedades);
router.get('/:id', proteger, obtenerSociedad);
router.put('/:id', proteger, esAdmin, actualizarSociedad);
router.delete('/:id', proteger, esAdmin, eliminarSociedad);

module.exports = router;
