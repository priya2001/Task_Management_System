import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import TaskList from '../components/TaskList'
import taskService from '../services/taskService'
import fileService from '../services/fileService'

function Dashboard() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await taskService.getAllTasks()
      console.log('Fetch tasks response:', response) // Debug log
      const tasksList = response?.data || response || []
      setTasks(Array.isArray(tasksList) ? tasksList : [])
    } catch (err) {
      console.error('Fetch tasks error:', err) // Debug log
      const errorMsg = err.message || 'Failed to load tasks'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (taskData, files = []) => {
    try {
      setError('')
      console.log('Creating task with data:', taskData, 'User ID:', user?.id || user?._id) // Debug log
      const response = await taskService.createTask({
        ...taskData,
        assignedTo: user?.id || user?._id,
      })
      console.log('Create task response:', response) // Debug log
      if (response.success) {
        const newTask = response.data
        console.log('Adding task to state:', newTask) // Debug log
        setTasks([...tasks, newTask])

        // Upload files if provided
        if (files && files.length > 0) {
          try {
            console.log('Uploading files to task:', newTask._id)
            await fileService.uploadFiles(newTask._id, files)
            console.log('Files uploaded successfully')
          } catch (uploadError) {
            console.error('File upload error:', uploadError)
            setError('Task created but file upload failed. Please try uploading files again.')
          }
        }
      } else {
        setError(response.message || 'Failed to create task')
      }
    } catch (err) {
      console.error('Create task error details:', err) // Debug log
      const errorMsg = err.message || 'Failed to create task'
      setError(errorMsg)
    }
  }

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      setError('')
      const response = await taskService.updateTask(taskId, taskData)
      if (response.success) {
        setTasks(
          tasks.map((task) =>
            task._id === taskId ? response.data : task
          )
        )
      } else {
        setError(response.message || 'Failed to update task')
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to update task'
      setError(errorMsg)
      console.error('Update task error:', err)
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      setError('')
      const response = await taskService.deleteTask(taskId)
      if (response.success) {
        setTasks(tasks.filter((task) => task._id !== taskId))
      } else {
        setError(response.message || 'Failed to delete task')
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to delete task'
      setError(errorMsg)
      console.error('Delete task error:', err)
    }
  }

  const handleStatusChange = async (taskId, status) => {
    try {
      setError('')
      const response = await taskService.updateTaskStatus(taskId, status)
      if (response.success) {
        setTasks(
          tasks.map((task) =>
            task._id === taskId ? { ...task, status } : task
          )
        )
      } else {
        setError(response.message || 'Failed to update status')
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to update status'
      setError(errorMsg)
      console.error('Update status error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600 mt-2">
            Manage your tasks efficiently with our intuitive task management system.
          </p>
        </div>

        {/* User Info */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900">
            Logged in as <span className="font-semibold">{user?.email?.split('@')[0]}</span>
          </p>
        </div>

        {/* Task List Component */}
        <TaskList
          tasks={tasks}
          onCreateTask={handleCreateTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onStatusChange={handleStatusChange}
          loading={loading}
          error={error}
          onErrorClear={() => setError('')}
        />
      </div>
    </div>
  )
}

export default Dashboard
