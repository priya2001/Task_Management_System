import { useState } from 'react'

/**
 * TaskForm Component
 * Modal form for creating and editing tasks
 */
export const TaskForm = ({ initialTask = null, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState(
    initialTask || {
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      dueDate: '',
    }
  )
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required'
    }
    if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters'
    }
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }
    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {initialTask ? 'Edit Task' : 'Create New Task'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Task Title *
            </label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title..."
              maxLength="100"
              className={`input-field ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description..."
              maxLength="500"
              rows="3"
              className={`input-field ${errors.description ? 'border-red-500' : ''}`}
            ></textarea>
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500
            </p>
          </div>

          {/* Priority & Status Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="form-group">
              <label htmlFor="priority" className="form-label">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Status */}
            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
              >
                <option value="pending">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label htmlFor="dueDate" className="form-label">
              Due Date
            </label>
            <input
              id="dueDate"
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Saving...' : initialTask ? 'Update Task' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="btn-outline flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskForm
