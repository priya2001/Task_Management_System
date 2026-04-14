import axios from 'axios'

// Get the API base URL from environment or use relative path for Vite proxy
const API_BASE_URL = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || 'http://localhost:5000') : '/'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} role - User role (optional)
   * @returns {Promise} - Response with token and user data
   */
  register: async (email, password, role = 'user') => {
    try {
      const response = await api.post('/api/auth/register', {
        email,
        password,
        role,
      })
      return response.data
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Registration failed',
      }
    }
  },

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Response with token and user data
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      })
      return response.data
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Login failed',
      }
    }
  },

  /**
   * Get current user profile
   * @returns {Promise} - Current user data
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/auth/me')
      return response.data
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to fetch user profile',
      }
    }
  },

  /**
   * Update user profile
   * @param {Object} userData - User data to update
   * @returns {Promise} - Updated user data
   */
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/api/auth/profile', userData)
      return response.data
    } catch (error) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to update profile',
      }
    }
  },

  /**
   * Logout user
   * @returns {Promise}
   */
  logout: async () => {
    try {
      const response = await api.post('/api/auth/logout')
      return response.data
    } catch (error) {
      // Logout locally even if server call fails
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      throw error.response?.data || {
        success: false,
        message: 'Logout failed',
      }
    }
  },
}

export default api
