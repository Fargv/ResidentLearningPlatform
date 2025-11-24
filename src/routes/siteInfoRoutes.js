const express = require('express');
const router = express.Router();
const { getSiteInfo, updateSiteInfo } = require('../controllers/siteInfoController');
const { protect, authorize } = require('../middleware/auth');
const { Role } = require('../utils/roles');

router.get('/', getSiteInfo);
router.put('/', protect, authorize(Role.ADMINISTRADOR), updateSiteInfo);

module.exports = router;
