const express = require('express');
const corsMiddleware = require('./middleware/corsMiddleware');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const fileRoutes = require('./routes/fileRoutes');
const { protect } = require('./middleware/authMiddleware');

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth Routes (public)
app.use('/api/auth', authRoutes);

// User Management Routes (protected, admin only)
app.use('/api/users', userRoutes);

// Protected Routes
app.use('/api/tasks', protect, taskRoutes);

// File Upload Routes (protected)
app.use('/api/files', protect, fileRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
