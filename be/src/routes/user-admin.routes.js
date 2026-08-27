const express = require('express');
const router = express.Router();

const userAdminController = require('../controllers/user-admin.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// Toàn bộ routes trong file này chỉ dành cho admin / super_admin
router.use(verifyToken, requireRole('admin', 'super_admin'));

router.get('/admin/users', userAdminController.getAllUsers);
router.get('/admin/users/:userId', userAdminController.getUserDetail);

router.patch('/admin/users/:userId/status', userAdminController.updateUserStatus);
router.delete('/admin/users/:userId', userAdminController.deleteUser);

router.post('/admin/users/:userId/roles', userAdminController.assignRole);
router.delete('/admin/users/:userId/roles/:role', userAdminController.removeRole);

module.exports = router;