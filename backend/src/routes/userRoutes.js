const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  toggleUserStatus,
  getUserStatistics,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin only routes
router.get('/', authorize('admin'), getAllUsers);
router.get('/stats', authorize('admin'), getUserStatistics);
router.post('/', authorize('admin'), createUser);
router.post('/:id/role', authorize('admin'), changeUserRole);
router.post('/:id/toggle-status', authorize('admin'), toggleUserStatus);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

// User can view their own profile
router.get('/:id', getUserById);

module.exports = router;
