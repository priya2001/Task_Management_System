/**
 * Test Setup File
 * Runs before all tests to configure environment and database
 */

require('dotenv').config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/task_management_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-12345';
process.env.JWT_EXPIRE = '7d';

// Increase Jest timeout for async operations
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error logs for debugging
  error: console.error,
};

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
