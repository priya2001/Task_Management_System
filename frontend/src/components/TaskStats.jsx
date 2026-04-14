/**
 * TaskStats Component
 * Display task statistics and metrics
 */
export const TaskStats = ({ tasks = [] }) => {
  const completed = tasks.filter((t) => t.status === 'completed').length
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length
  const pending = tasks.filter((t) => t.status === 'pending').length

  const highPriority = tasks.filter((t) => t.priority === 'high').length
  const mediumPriority = tasks.filter((t) => t.priority === 'medium').length
  const lowPriority = tasks.filter((t) => t.priority === 'low').length

  const overdue = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'completed') return false
    return new Date(t.dueDate) < new Date()
  }).length

  const completionRate =
    tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* Total Tasks */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Tasks</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{tasks.length}</p>
          </div>
          <svg
            className="w-12 h-12 text-primary-100"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path
              fillRule="evenodd"
              d="M4 5a2 2 0 012-2 1 1 0 000-2H6a4 4 0 00-4 4v10a4 4 0 004 4h8a4 4 0 004-4V5a1 1 0 000 2h2a2 2 0 012 2v3a1 1 0 11-2 0V5a2 2 0 00-2-2H4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Completion Rate</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {completionRate}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {completed} of {tasks.length}
            </p>
          </div>
          <svg
            className="w-12 h-12 text-green-100"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Active Tasks */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Active Tasks</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {inProgress}
            </p>
            <p className="text-xs text-gray-500 mt-1">In progress</p>
          </div>
          <svg
            className="w-12 h-12 text-blue-100"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Overdue Tasks */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Overdue Tasks</p>
            <p className={`text-3xl font-bold mt-2 ${overdue > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {overdue}
            </p>
            <p className="text-xs text-gray-500 mt-1">Need attention</p>
          </div>
          <svg
            className={`w-12 h-12 ${overdue > 0 ? 'text-red-100' : 'text-gray-100'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2v-2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

/**
 * TaskStatsByStatus Component
 * Breakdown of tasks by status
 */
export const TaskStatsByStatus = ({ tasks = [] }) => {
  const pending = tasks.filter((t) => t.status === 'pending').length
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length
  const completed = tasks.filter((t) => t.status === 'completed').length

  const stats = [
    { label: 'To Do', count: pending, color: 'bg-gray-50', textColor: 'text-gray-600', borderColor: 'border-gray-200' },
    { label: 'In Progress', count: inProgress, color: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' },
    { label: 'Completed', count: completed, color: 'bg-green-50', textColor: 'text-green-600', borderColor: 'border-green-200' },
  ]

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, count, color, textColor, borderColor }) => (
          <div key={label} className={`${color} border ${borderColor} rounded-lg p-4 text-center`}>
            <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
            <p className="text-sm text-gray-600 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * TaskStatsByPriority Component
 * Breakdown of tasks by priority
 */
export const TaskStatsByPriority = ({ tasks = [] }) => {
  const high = tasks.filter((t) => t.priority === 'high').length
  const medium = tasks.filter((t) => t.priority === 'medium').length
  const low = tasks.filter((t) => t.priority === 'low').length

  const stats = [
    { label: 'High', count: high, color: 'bg-red-50', textColor: 'text-red-600', borderColor: 'border-red-200' },
    { label: 'Medium', count: medium, color: 'bg-yellow-50', textColor: 'text-yellow-600', borderColor: 'border-yellow-200' },
    { label: 'Low', count: low, color: 'bg-green-50', textColor: 'text-green-600', borderColor: 'border-green-200' },
  ]

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Breakdown</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, count, color, textColor, borderColor }) => (
          <div key={label} className={`${color} border ${borderColor} rounded-lg p-4 text-center`}>
            <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
            <p className="text-sm text-gray-600 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TaskStats
