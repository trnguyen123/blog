const express = require('express');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.getMe);

module.exports = router;