// src/routes/informesRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  exportarUsuarios,
  exportarHospitales,
  exportarActividadesResidentes,
  exportarActividadesSociedades,
  exportarProgresoUsuarios,
} = require('../controllers/informesController');
const { Role } = require('../utils/roles');

// Protege todas las rutas de este router
router.use(protect);

// /api/informes/usuarios?format=csv|xlsx
router.get('/usuarios', authorize('administrador'), exportarUsuarios);

// /api/informes/hospitales?format=csv|xlsx
router.get('/hospitales', authorize('administrador'), exportarHospitales);

// /api/informes/actividades-residentes  (XLSX)
router.get(
  '/actividades-residentes',
  authorize('administrador'),
  exportarActividadesResidentes
);

// /api/informes/actividades-sociedades  (CSV o XLSX)
router.get(
  '/actividades-sociedades',
  authorize('administrador'),
  exportarActividadesSociedades
);

// /api/informes/progreso-usuarios  (CSV o XLSX)
router.get(
  '/progreso-usuarios',
  authorize(Role.ADMINISTRADOR),
  exportarProgresoUsuarios
);

module.exports = router;
