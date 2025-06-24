const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sociedadesController');
const { proteger, esAdmin } = require('../middleware/auth');

router.post('/', proteger, esAdmin, ctrl.crearSociedad);
router.get('/', proteger, ctrl.obtenerSociedades);
router.get('/:id', proteger, ctrl.obtenerSociedad);
router.put('/:id', proteger, esAdmin, ctrl.actualizarSociedad);
router.delete('/:id', proteger, esAdmin, ctrl.eliminarSociedad);

module.exports = router;
