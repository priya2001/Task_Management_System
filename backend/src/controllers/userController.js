const User = require('../models/User');
const mongoose = require('mongoose');

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Get all users (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, search, sortBy, page = 1, limit = 10 } = req.query;
    const filter = {};

    // Filter by role
    if (role) {
      const validRoles = ['admin', 'user'];
      if (validRoles.includes(role)) {
        filter.role = role;
      }
    }

    // Filter by active status
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Search by email
    if (search) {
      filter.email = { $regex: search, $options: 'i' };
    }

    // Determine sort order
    let sortOrder = { createdAt: -1 }; // Default: newest first
    if (sortBy) {
      switch (sortBy) {
        case 'email-asc':
          sortOrder = { email: 1 };
          break;
        case 'email-desc':
          sortOrder = { email: -1 };
          break;
        case 'lastLogin':
          sortOrder = { lastLogin: -1, createdAt: -1 };
          break;
        case 'updated':
          sortOrder = { updatedAt: -1 };
          break;
        default:
          sortOrder = { createdAt: -1 };
      }
    }

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Execute count and find queries in parallel
    const [totalCount, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-password')
        .sort(sortOrder)
        .skip(skip)
        .limit(limitNum)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID (Admin only or own profile)
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Check if user is requesting their own profile or is admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user',
      });
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Create user (Admin only)
const createUser = async (req, res, next) => {
  try {
    const { email, password, role, isActive } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create user
    user = new User({
      email,
      password,
      role: role || 'user',
      isActive: isActive !== undefined ? isActive : true,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user (Admin only)
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role, isActive } = req.body;

    // Validate ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Check if user is trying to modify another admin
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent non-admins from changing admin status
    if (targetUser.role === 'admin' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify admin roles',
      });
    }

    // Build update object (only allowed fields)
    const updates = {};
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Change user role (Admin only)
const changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "user" or "admin"',
      });
    }

    // Validate ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Prevent self-demotion
    if (req.user.id === id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot demote your own admin role',
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `User role changed to ${role}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Activate/Deactivate user (Admin only)
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Prevent self-deactivation
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account',
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User status changed to ${user.isActive ? 'active' : 'inactive'}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Get user statistics (Admin only)
const getUserStatistics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        adminUsers,
        regularUsers,
        activeUsers,
        inactiveUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  toggleUserStatus,
  getUserStatistics,
};
