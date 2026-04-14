import { useState, useRef } from 'react'
import fileService from '../services/fileService'

/**
 * TaskForm Component
 * Modal form for creating and editing tasks with file upload
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
  const [selectedFiles, setSelectedFiles] = useState([])
  const [fileErrors, setFileErrors] = useState([])
  const fileInputRef = useRef(null)

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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    handleFilesSelected(files)
  }

  const handleFilesSelected = (files) => {
    const newErrors = []
    const validFiles = []

    files.forEach((file) => {
      const validation = fileService.validateFile(file)
      if (!validation.valid) {
        newErrors.push(`${file.name}: ${validation.error}`)
      } else {
        validFiles.push(file)
      }
    })

    // Check total file count
    if (selectedFiles.length + validFiles.length > 3) {
      newErrors.push(`Maximum 3 files allowed (current: ${selectedFiles.length})`)
    } else {
      setSelectedFiles((prev) => [...prev, ...validFiles])
    }

    setFileErrors(newErrors)
  }

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50')
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
    const files = Array.from(e.dataTransfer.files || [])
    handleFilesSelected(files)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    // Pass form data and files to parent component
    onSubmit(formData, selectedFiles)
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

          {/* File Upload Section */}
          {!initialTask && (
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <label className="form-label">📄 Attach Documents (Optional)</label>
              <p className="text-xs text-gray-500">
                PDF files only • Max 3 files • 10MB each
              </p>

              {/* Drag and Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition"
              >
                <p className="text-gray-600 text-sm">
                  📤 Drag & drop PDFs here or click to browse
                </p>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* File Errors */}
              {fileErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  {fileErrors.map((error, idx) => (
                    <p key={idx} className="text-red-600 text-xs">
                      ⚠️ {error}
                    </p>
                  ))}
                </div>
              )}

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 space-y-1">
                  <p className="text-sm font-medium text-blue-900">
                    ✓ {selectedFiles.length} file(s) selected
                  </p>
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs text-gray-700 bg-white rounded p-1 px-2"
                    >
                      <span>📄 {file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
