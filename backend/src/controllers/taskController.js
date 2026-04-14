const Task = require('../models/Task');
const User = require('../models/User');
const mongoose = require('mongoose');

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Check if user can access task
const canAccessTask = (task, userId, userRole) => {
  if (userRole === 'admin') return true;
  return task.assignedTo._id.toString() === userId || task.createdBy._id.toString() === userId;
};

// Get all tasks (filtered by user or all for admin)
const getAllTasks = async (req, res, next) => {
  try {
    const { status, priority, assignedTo, search, sortBy, page = 1, limit = 10 } = req.query;
    const filter = {};

    // Non-admins can only see their own tasks
    if (req.user.role !== 'admin') {
      filter.$or = [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ];
    } else if (assignedTo) {
      // Admins can filter by assignedTo
      if (isValidObjectId(assignedTo)) {
        filter.assignedTo = assignedTo;
      }
    }

    // Filter by status
    if (status) {
      const validStatuses = ['pending', 'in-progress', 'completed'];
      if (validStatuses.includes(status)) {
        filter.status = status;
      }
    }

    // Filter by priority
    if (priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (validPriorities.includes(priority)) {
        filter.priority = priority;
      }
    }

    // Search by title or description
    if (search) {
      filter.$or = [...(filter.$or || []), 
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Determine sort order
    let sortOrder = { createdAt: -1 }; // Default: newest first
    if (sortBy) {
      switch (sortBy) {
        case 'dueDate-asc':
          sortOrder = { dueDate: 1, createdAt: -1 };
          break;
        case 'dueDate-desc':
          sortOrder = { dueDate: -1, createdAt: -1 };
          break;
        case 'priority-asc':
          const priorityOrder = { low: 1, medium: 2, high: 3 };
          // Note: Direct priority sort requires DB collation or application-level sorting
          sortOrder = { priority: 1, createdAt: -1 };
          break;
        case 'priority-desc':
          sortOrder = { priority: -1, createdAt: -1 };
          break;
        case 'status-asc':
          sortOrder = { status: 1, createdAt: -1 };
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
    const [totalCount, tasks] = await Promise.all([
      Task.countDocuments(filter),
      Task.find(filter)
        .sort(sortOrder)
        .skip(skip)
        .limit(limitNum)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      count: tasks.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single task by ID
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check authorization
    if (!canAccessTask(task, req.user._id.toString(), req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this task',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new task
const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, status, dueDate, category, assignedTo } = req.body;

    // Validate required fields
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'assignedTo (user ID) is required',
      });
    }

    // Validate assignedTo ID format
    if (!isValidObjectId(assignedTo)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignedTo user ID format',
      });
    }

    // Check if assigned user exists
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: 'Assigned user not found',
      });
    }

    // Non-admins can only assign to themselves
    if (req.user.role !== 'admin' && assignedTo !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Users can only create tasks for themselves',
      });
    }

    const task = new Task({
      title,
      description,
      priority,
      status,
      dueDate,
      category,
      assignedTo,
      createdBy: req.user._id,
    });

    const savedTask = await task.save();
    // Populate references
    await savedTask.populate([
      { path: 'assignedTo', select: 'email role' },
      { path: 'createdBy', select: 'email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: savedTask,
    });
  } catch (error) {
    next(error);
  }
};

// Update a task
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    // Find task first
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check authorization
    if (!canAccessTask(task, req.user._id.toString(), req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task',
      });
    }

    // Prevent updating timestamps and sensitive fields
    const allowedUpdates = ['title', 'description', 'status', 'priority', 'dueDate', 'category', 'completed'];
    
    // Admins can also reassign tasks
    const updateKeys = Object.keys(updates);
    if (req.user.role === 'admin' && updates.assignedTo) {
      allowedUpdates.push('assignedTo');
    }

    const isValidUpdate = updateKeys.every(key => allowedUpdates.includes(key));

    if (!isValidUpdate) {
      return res.status(400).json({
        success: false,
        message: `Invalid update fields. Allowed: ${allowedUpdates.join(', ')}`,
      });
    }

    // Validate assignedTo if provided
    if (updates.assignedTo && isValidObjectId(updates.assignedTo)) {
      const assignedUser = await User.findById(updates.assignedTo);
      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: 'Assigned user not found',
        });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a task
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check authorization
    if (!canAccessTask(task, req.user._id.toString(), req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task',
      });
    }

    await Task.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: {
        id: task._id,
        title: task.title,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get tasks by status
const getTasksByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    const { sortBy, page = 1, limit = 10 } = req.query;
    const validStatuses = ['pending', 'in-progress', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, in-progress, or completed',
      });
    }

    const filter = { status };

    // Non-admins can only see their own tasks
    if (req.user.role !== 'admin') {
      filter.$or = [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ];
    }

    // Determine sort order
    let sortOrder = { createdAt: -1 };
    if (sortBy === 'dueDate-asc') {
      sortOrder = { dueDate: 1, createdAt: -1 };
    } else if (sortBy === 'dueDate-desc') {
      sortOrder = { dueDate: -1, createdAt: -1 };
    } else if (sortBy === 'priority-desc') {
      sortOrder = { priority: -1, createdAt: -1 };
    } else if (sortBy === 'updated') {
      sortOrder = { updatedAt: -1 };
    }

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute count and find queries in parallel
    const [totalCount, tasks] = await Promise.all([
      Task.countDocuments(filter),
      Task.find(filter).sort(sortOrder).skip(skip).limit(limitNum)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      count: tasks.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      status,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

// Get tasks by assignee
const getTasksByAssignee = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, priority, sortBy, page = 1, limit = 10 } = req.query;

    // Validate user ID format
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Non-admins can only view their own tasks
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these tasks',
      });
    }

    // Build filter
    const filter = { assignedTo: userId };

    if (status) {
      const validStatuses = ['pending', 'in-progress', 'completed'];
      if (validStatuses.includes(status)) {
        filter.status = status;
      }
    }

    if (priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (validPriorities.includes(priority)) {
        filter.priority = priority;
      }
    }

    // Determine sort order
    let sortOrder = { createdAt: -1 };
    if (sortBy === 'dueDate-asc') {
      sortOrder = { dueDate: 1, createdAt: -1 };
    } else if (sortBy === 'dueDate-desc') {
      sortOrder = { dueDate: -1, createdAt: -1 };
    } else if (sortBy === 'priority-desc') {
      sortOrder = { priority: -1, createdAt: -1 };
    } else if (sortBy === 'updated') {
      sortOrder = { updatedAt: -1 };
    }

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute count and find queries in parallel
    const [totalCount, tasks] = await Promise.all([
      Task.countDocuments(filter),
      Task.find(filter).sort(sortOrder).skip(skip).limit(limitNum)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      count: tasks.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      assignedTo: user.email,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

// Get task statistics
const getTaskStatistics = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role !== 'admin') {
      filter.$or = [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ];
    }

    const totalTasks = await Task.countDocuments(filter);
    const pendingTasks = await Task.countDocuments({ ...filter, status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ ...filter, status: 'in-progress' });
    const completedTasks = await Task.countDocuments({ ...filter, status: 'completed' });

    const highPriority = await Task.countDocuments({ ...filter, priority: 'high' });
    const mediumPriority = await Task.countDocuments({ ...filter, priority: 'medium' });
    const lowPriority = await Task.countDocuments({ ...filter, priority: 'low' });

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        byStatus: {
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
        },
        byPriority: {
          high: highPriority,
          medium: mediumPriority,
          low: lowPriority,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByStatus,
  getTasksByAssignee,
  getTaskStatistics,
};
