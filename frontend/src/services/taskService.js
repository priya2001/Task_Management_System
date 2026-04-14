import api from './authService'

/**
 * Task Service
 * All task-related API calls
 */
export const taskService = {
  /**
   * Get all tasks
   * @returns {Promise} - Response with tasks array
   */
  getAllTasks: async () => {
    try {
      const response = await api.get('/api/tasks')
      return response.data
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to fetch tasks',
      }
    }
  },

  /**
   * Get single task by ID
   * @param {string} taskId - Task ID
   * @returns {Promise} - Response with task data
   */
  getTaskById: async (taskId) => {
    try {
      const response = await api.get(`/api/tasks/${taskId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to fetch task',
      }
    }
  },

  /**
   * Create new task
   * @param {Object} taskData - Task object with title, description, priority, status, dueDate, assignedTo
   * @returns {Promise} - Response with created task
   */
  createTask: async (taskData) => {
    try {
      const response = await api.post('/api/tasks', {
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        status: taskData.status || 'pending',
        assignedTo: taskData.assignedTo,
        dueDate: taskData.dueDate || null,
      })
      return response.data
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to create task',
      }
    }
  },

  /**
   * Update task
   * @param {string} taskId - Task ID
   * @param {Object} taskData - Updated task data
   * @returns {Promise} - Response with updated task
   */
  updateTask: async (taskId, taskData) => {
    try {
      const response = await api.put(`/api/tasks/${taskId}`, {
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        status: taskData.status || 'pending',
        dueDate: taskData.dueDate || null,
      })
      return response.data
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to update task',
      }
    }
  },

  /**
   * Update task status only
   * @param {string} taskId - Task ID
   * @param {string} status - New status (pending, in-progress, completed)
   * @returns {Promise} - Response with updated task
   */
  updateTaskStatus: async (taskId, status) => {
    try {
      const response = await api.put(`/api/tasks/${taskId}`, { status })
      return response.data
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to update task status',
      }
    }
  },

  /**
   * Delete task
   * @param {string} taskId - Task ID
   * @returns {Promise} - Response with success message
   */
  deleteTask: async (taskId) => {
    try {
      const response = await api.delete(`/api/tasks/${taskId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to delete task',
      }
    }
  },

  /**
   * Get tasks by status
   * @param {string} status - Status filter (todo, in_progress, completed)
   * @returns {Promise} - Response with filtered tasks
   */
  getTasksByStatus: async (status) => {
    try {
      const response = await api.get('/api/tasks', {
        params: { status },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to fetch tasks',
      }
    }
  },

  /**
   * Get tasks by priority
   * @param {string} priority - Priority filter (low, medium, high)
   * @returns {Promise} - Response with filtered tasks
   */
  getTasksByPriority: async (priority) => {
    try {
      const response = await api.get('/api/tasks', {
        params: { priority },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to fetch tasks',
      }
    }
  },

  /**
   * Search tasks
   * @param {string} query - Search query
   * @returns {Promise} - Response with matching tasks
   */
  searchTasks: async (query) => {
    try {
      const response = await api.get('/api/tasks', {
        params: { search: query },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to search tasks',
      }
    }
  },

  /**
   * Get task statistics
   * @returns {Promise} - Response with task statistics
   */
  getTaskStats: async () => {
    try {
      const response = await api.get('/api/tasks/stats')
      return response.data
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to fetch statistics',
      }
    }
  },
}

export default taskService
