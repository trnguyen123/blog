const express = require('express');
const router = express.Router();

const tagController = require('../controllers/tag.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// Public
router.get('/tags', tagController.getAllTags);
router.get('/tags/:id', tagController.getTagById);

// Admin
router.post('/tags', verifyToken, requireRole('admin', 'author'), tagController.createTag);
router.patch('/tags/:id', verifyToken, requireRole('admin', 'author'), tagController.updateTag);
router.delete('/tags/:id', verifyToken, requireRole('admin', 'author'), tagController.deleteTag);

module.exports = router;