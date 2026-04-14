import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function Navigation() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">TM</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Task Manager</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/dashboard"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Dashboard
            </Link>
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{user.email?.split('@')[0]}</span>
                <button
                  onClick={handleLogout}
                  className="btn-primary"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <Link
              to="/dashboard"
              className="block text-gray-700 hover:text-primary-600 transition-colors py-2"
            >
              Dashboard
            </Link>
            {user && (
              <>
                <p className="text-sm text-gray-600 py-2">{user.email}</p>
                <button
                  onClick={handleLogout}
                  className="w-full btn-primary mt-2"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation
