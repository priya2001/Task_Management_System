/**
 * TaskFilters Component
 * Filter and sort controls for task list
 */
export const TaskFilters = ({ filters, onFilterChange, taskCount = 0 }) => {
  const handlePriorityChange = (priority) => {
    if (filters.priority.includes(priority)) {
      onFilterChange({
        ...filters,
        priority: filters.priority.filter((p) => p !== priority),
      })
    } else {
      onFilterChange({
        ...filters,
        priority: [...filters.priority, priority],
      })
    }
  }

  const handleStatusChange = (status) => {
    if (filters.status.includes(status)) {
      onFilterChange({
        ...filters,
        status: filters.status.filter((s) => s !== status),
      })
    } else {
      onFilterChange({
        ...filters,
        status: [...filters.status, status],
      })
    }
  }

  const handleSortChange = (field) => {
    if (filters.sortBy === field) {
      // Toggle sort order
      onFilterChange({
        ...filters,
        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
      })
    } else {
      // Change sort field, default to ascending
      onFilterChange({
        ...filters,
        sortBy: field,
        sortOrder: 'asc',
      })
    }
  }

  const handleSearchChange = (e) => {
    onFilterChange({
      ...filters,
      search: e.target.value,
    })
  }

  const handleClearFilters = () => {
    onFilterChange({
      priority: [],
      status: [],
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
  }

  const hasActiveFilters =
    filters.priority.length > 0 ||
    filters.status.length > 0 ||
    filters.search !== ''

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filters & Sort</h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Search Box */}
      <div className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <div className="space-y-2">
            {['high', 'medium', 'low'].map((priority) => (
              <label key={priority} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.priority.includes(priority)}
                  onChange={() => handlePriorityChange(priority)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {priority} Priority
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="space-y-2">
            {[
              { value: 'pending', label: 'To Do' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.status.includes(value)}
                  onChange={() => handleStatusChange(value)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <div className="space-y-2">
            {[
              { value: 'createdAt', label: 'Date Created' },
              { value: 'dueDate', label: 'Due Date' },
              { value: 'priority', label: 'Priority' },
              { value: 'title', label: 'Title' },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value={value}
                  checked={filters.sortBy === value}
                  onChange={() => handleSortChange(value)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="ml-2 text-sm text-gray-700">{label}</span>
                {filters.sortBy === value && (
                  <span className="ml-auto text-xs text-gray-500">
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Task Count */}
        <div className="flex items-end">
          <div className="w-full">
            <div className="bg-primary-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary-600">{taskCount}</p>
              <p className="text-xs text-gray-600 mt-1">
                {taskCount === 1 ? 'task' : 'tasks'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskFilters
