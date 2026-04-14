import { useState, useMemo } from 'react'
import TaskCard from './TaskCard'
import TaskFilters from './TaskFilters'
import TaskForm from './TaskForm'

/**
 * TaskList Component
 * Complete task management interface with filtering, sorting, and actions
 */
export const TaskList = ({
  tasks = [],
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onStatusChange,
  loading = false,
  error = '',
  onErrorClear = () => {},
}) => {
  const [filters, setFilters] = useState({
    priority: [],
    status: [],
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower)
      )
    }

    // Apply priority filter
    if (filters.priority.length > 0) {
      result = result.filter((task) => filters.priority.includes(task.priority))
    }

    // Apply status filter
    if (filters.status.length > 0) {
      result = result.filter((task) => filters.status.includes(task.status))
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue

      switch (filters.sortBy) {
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.priority] || 0
          bValue = priorityOrder[b.priority] || 0
          break
        }
        case 'dueDate': {
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          break
        }
        case 'title': {
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        }
        case 'createdAt':
        default: {
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0
          break
        }
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [tasks, filters])

  // Handlers
  const handleCreateTask = async (formData, files = []) => {
    setFormLoading(true)
    try {
      await onCreateTask(formData, files)
      setShowForm(false)
      onErrorClear()
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateTask = async (formData) => {
    setFormLoading(true)
    try {
      await onUpdateTask(editingTask._id, formData)
      setEditingTask(null)
      onErrorClear()
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return
    }
    try {
      await onDeleteTask(taskId)
      onErrorClear()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setShowForm(false) // Close create form if open
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingTask(null)
  }

  const handleFormSubmit = (formData) => {
    if (editingTask) {
      handleUpdateTask(formData)
    } else {
      handleCreateTask(formData)
    }
  }

  return (
    <div>
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">
            {filteredTasks.length} of {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null)
            setShowForm(!showForm)
          }}
          className="btn-primary"
          disabled={loading || formLoading}
        >
          {showForm && !editingTask ? '✕ Cancel' : '+ New Task'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
          <div>
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={onErrorClear}
            className="text-red-600 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Create/Edit Form */}
      {(showForm || editingTask) && (
        <TaskForm
          initialTask={editingTask}
          onSubmit={handleFormSubmit}
          onCancel={handleFormClose}
          loading={formLoading}
        />
      )}

      {/* Filters */}
      <TaskFilters
        filters={filters}
        onFilterChange={setFilters}
        taskCount={filteredTasks.length}
      />

      {/* Tasks Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-600 mt-4 font-medium">
            {tasks.length === 0
              ? 'No tasks yet. Create one to get started!'
              : 'No tasks match your filters.'}
          </p>
          {tasks.length === 0 && (
            <button
              onClick={() => {
                setEditingTask(null)
                setShowForm(true)
              }}
              className="btn-primary mt-4"
            >
              Create Your First Task
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onStatusChange={onStatusChange}
              loading={loading}
            />
          ))}
        </div>
      )}

      {/* No matching results hint */}
      {!loading && tasks.length > 0 && filteredTasks.length === 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-blue-700 text-sm">
            <strong>Tip:</strong> Try adjusting your filters or search query
          </p>
        </div>
      )}
    </div>
  )
}

export default TaskList
