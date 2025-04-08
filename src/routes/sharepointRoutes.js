const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getSharePointListas,
  getSharePointListaItems,
  sincronizarSharePoint,
  verificarConexionSharePoint
} = require('../controllers/sharepointController');

// Todas las rutas requieren autenticación y rol de administrador
router.use(protect);
router.use(authorize('administrador'));

// Rutas para interactuar con SharePoint
router.route('/listas')
  .get(getSharePointListas);

router.route('/listas/:listaId/items')
  .get(getSharePointListaItems);

router.route('/sincronizar')
  .post(sincronizarSharePoint);

router.route('/verificar')
  .get(verificarConexionSharePoint);

module.exports = router;
