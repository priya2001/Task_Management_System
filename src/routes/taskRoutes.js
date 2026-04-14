const express = require('express');
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByStatus,
} = require('../controllers/taskController');

const router = express.Router();

// GET all tasks
router.get('/', getAllTasks);

// GET tasks by status
router.get('/status/:status', getTasksByStatus);

// GET a single task by ID
router.get('/:id', getTaskById);

// POST create a new task
router.post('/', createTask);

// PUT update a task
router.put('/:id', updateTask);

// DELETE a task
router.delete('/:id', deleteTask);

module.exports = router;
