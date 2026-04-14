import { useState } from 'react'
import DocumentViewer from './DocumentViewer'

/**
 * TaskCard Component
 * Individual task card with actions
 */
export const TaskCard = ({ task, onEdit, onDelete, onStatusChange, loading = false }) => {
  const [showActions, setShowActions] = useState(false)

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border border-green-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'in-progress':
        return 'bg-blue-50 border-blue-200'
      case 'pending':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-white'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓'
      case 'in-progress':
        return '⟳'
      case 'pending':
        return '○'
      default:
        return ''
    }
  }

  const getPriorityLevel = (priority) => {
    const levels = {
      low: 1,
      medium: 2,
      high: 3,
    }
    return levels[priority] || 0
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return 'Invalid date'
    }
  }

  const isOverdue = () => {
    if (!task.dueDate) return false
    return new Date(task.dueDate) < new Date() && task.status !== 'completed'
  }

  return (
    <div
      className={`card border-l-4 hover:shadow-lg transition-shadow ${getStatusColor(
        task.status
      )} ${
        task.status === 'completed'
          ? 'border-l-green-500'
          : task.status === 'in_progress'
          ? 'border-l-blue-500'
          : 'border-l-gray-300'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl text-gray-400">{getStatusIcon(task.status)}</span>
            <h3
              className={`font-semibold ${
                task.status === 'completed'
                  ? 'line-through text-gray-400'
                  : 'text-gray-900'
              }`}
            >
              {task.title}
            </h3>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className={`flex gap-2 transition-opacity ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
            title="Edit task"
            disabled={loading}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
            title="Delete task"
            disabled={loading}
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Documents Section */}
      <div className="mb-3 pb-3 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-2">Documents</p>
        <DocumentViewer taskId={task._id} isOwner={true} />
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-2 items-center mb-3">
        {/* Priority Badge */}
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
        </span>

        {/* Due Date */}
        <span
          className={`text-xs px-2.5 py-1 rounded-full ${
            isOverdue()
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isOverdue() ? '⚠ ' : '📅 '}
          {formatDate(task.dueDate)}
        </span>
      </div>

      {/* Status Selector */}
      {!showActions && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-xs text-gray-500 font-medium">Mark as:</span>
          <div className="flex gap-1">
            {['pending', 'in-progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange(task._id, status)}
                disabled={loading}
                className={`text-xs px-2 py-1 rounded font-semibold transition-colors ${
                  task.status === status
                    ? status === 'completed'
                      ? 'bg-green-500 text-white'
                      : status === 'in-progress'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'pending' ? 'Todo' : status === 'in-progress' ? 'In Progress' : 'Done'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskCard
