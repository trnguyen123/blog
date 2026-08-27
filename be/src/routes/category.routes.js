const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/category.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// Public
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);

// Admin
router.post(
  '/categories',
  verifyToken,
  requireRole('admin', 'author'),
  categoryController.createCategory
);

router.patch(
  '/categories/:id',
  verifyToken,
  requireRole('admin', 'author'),
  categoryController.updateCategory
);

router.delete(
  '/categories/:id',
  verifyToken,
  requireRole('admin', 'author'),
  categoryController.deleteCategory
);

module.exports = router;