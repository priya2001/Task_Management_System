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
    const { status, priority, assignedTo, search } = req.query;
    const filter = {};

    // Non-admins can only see their own tasks
    if (req.user.role !== 'admin') {
      filter.$or = [
        { assignedTo: req.user.id },
        { createdBy: req.user.id }
      ];
    } else if (assignedTo) {
      // Admins can filter by assignedTo
      if (isValidObjectId(assignedTo)) {
        filter.assignedTo = assignedTo;
      }
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by priority
    if (priority) {
      filter.priority = priority;
    }

    // Search by title or description
    if (search) {
      filter.$or = [...(filter.$or || []), 
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
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
    if (!canAccessTask(task, req.user.id, req.user.role)) {
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
    const { title, description, priority, dueDate, category, assignedTo } = req.body;

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
    if (req.user.role !== 'admin' && assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Users can only create tasks for themselves',
      });
    }

    const task = new Task({
      title,
      description,
      priority,
      dueDate,
      category,
      assignedTo,
      createdBy: req.user.id,
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
    if (!canAccessTask(task, req.user.id, req.user.role)) {
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
    if (!canAccessTask(task, req.user.id, req.user.role)) {
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
        { assignedTo: req.user.id },
        { createdBy: req.user.id }
      ];
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
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
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these tasks',
      });
    }

    const tasks = await Task.find({ assignedTo: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
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
        { assignedTo: req.user.id },
        { createdBy: req.user.id }
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
