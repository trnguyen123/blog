const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profile.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validateUpdateMyProfile } = require('../validators/profile.validator');

router.get('/me', verifyToken, profileController.getMyProfile);
router.patch('/me', verifyToken, validateUpdateMyProfile, profileController.updateMyProfile);

module.exports = router;