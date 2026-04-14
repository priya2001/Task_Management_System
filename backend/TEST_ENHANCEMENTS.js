#!/usr/bin/env node

/**
 * Task Management System - API Testing Guide
 * 
 * This file contains practical examples for testing the enhanced Task and User APIs
 * with pagination, filtering, and sorting features.
 * 
 * Usage:
 *   node TEST_ENHANCEMENTS.js
 * 
 * Requirements:
 *   - Server running on http://localhost:5000
 *   - Valid JWT token (admin user recommended for testing all features)
 */

const BASE_URL = 'http://localhost:5000/api';

// Color console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

const log = {
  section: (title) => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}\n${title}\n${'='.repeat(60)}${colors.reset}\n`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  json: (obj) => console.log(JSON.stringify(obj, null, 2)),
};

/**
 * API Test Examples
 */

// Test 1: Get all tasks with pagination
async function testGetTasksWithPagination(token) {
  log.section('TEST 1: Get All Tasks with Pagination');
  
  try {
    const response = await fetch(`${BASE_URL}/tasks?page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (result.success) {
      log.success('Fetched tasks successfully');
      log.info(`Current Page: ${result.pagination.page}`);
      log.info(`Tasks per Page: ${result.pagination.limit}`);
      log.info(`Total Tasks: ${result.pagination.totalCount}`);
      log.info(`Total Pages: ${result.pagination.totalPages}`);
      log.info(`Has Next Page: ${result.pagination.hasNextPage}`);
      log.info(`Tasks Count: ${result.count}`);
      
      if (result.data.length > 0) {
        log.info('\nSample Task:');
        console.log(JSON.stringify(result.data[0], null, 2));
      }
    } else {
      log.error(result.message || 'Failed to fetch tasks');
    }
  } catch (error) {
    log.error(`Error: ${error.message}`);
  }
}

// Test 2: Filter tasks by status and priority
async function testFilterTasksWithPagination(token) {
  log.section('TEST 2: Filter Tasks by Status & Priority with Pagination');
  
  const testCases = [
    { params: 'status=pending&priority=high', description: 'High priority pending tasks' },
    { params: 'status=in-progress&sortBy=dueDate-asc&page=1&limit=5', description: 'In-progress tasks sorted by due date' },
    { params: 'priority=medium&page=1&limit=10', description: 'Medium priority tasks' },
  ];
  
  for (const testCase of testCases) {
    log.info(`\nTesting: ${testCase.description}`);
    console.log(`Query: ${testCase.params}`);
    
    try {
      const response = await fetch(`${BASE_URL}/tasks?${testCase.params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        log.success(`Found ${result.count} matching tasks`);
        if (result.pagination) {
          console.log(`  - Total matches: ${result.pagination.totalCount}`);
          console.log(`  - Page ${result.pagination.page} of ${result.pagination.totalPages}`);
        }
      } else {
        log.error(result.message);
      }
    } catch (error) {
      log.error(`Error: ${error.message}`);
    }
  }
}

// Test 3: Get tasks by status with sorting
async function testGetTasksByStatus(token) {
  log.section('TEST 3: Get Tasks by Status with Sorting');
  
  const testCases = [
    { status: 'pending', sortBy: 'dueDate-asc', description: 'Pending tasks by due date (earliest first)' },
    { status: 'in-progress', sortBy: 'dueDate-desc', description: 'In-progress tasks by due date (latest first)' },
    { status: 'completed', sortBy: 'updated', description: 'Completed tasks by last update' },
  ];
  
  for (const testCase of testCases) {
    log.info(`\nTesting: ${testCase.description}`);
    
    try {
      const params = new URLSearchParams({
        sortBy: testCase.sortBy,
        page: 1,
        limit: 5,
      });
      
      const response = await fetch(`${BASE_URL}/tasks/status/${testCase.status}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        log.success(`Found ${result.count} ${testCase.status} tasks`);
        console.log(`  - Total: ${result.pagination.totalCount}`);
        console.log(`  - Pages: ${result.pagination.totalPages}`);
        
        if (result.data.length > 0) {
          console.log(`  - First task: "${result.data[0].title}" (due: ${result.data[0].dueDate})`);
        }
      } else {
        log.error(result.message);
      }
    } catch (error) {
      log.error(`Error: ${error.message}`);
    }
  }
}

// Test 4: Get tasks by assignee with filters
async function testGetTasksByAssignee(token, userId) {
  log.section('TEST 4: Get Tasks by Assignee with Filters');
  
  if (!userId) {
    log.warn('UserId required. Skipping test.');
    log.info('To run this test, provide a valid userId parameter');
    return;
  }
  
  const testCases = [
    { params: 'page=1&limit=5', description: 'All tasks assigned to user' },
    { params: 'status=pending&page=1&limit=5', description: 'Pending tasks assigned to user' },
    { params: 'priority=high&sortBy=dueDate-asc&page=1&limit=10', description: 'High priority tasks sorted by due date' },
  ];
  
  for (const testCase of testCases) {
    log.info(`\nTesting: ${testCase.description}`);
    
    try {
      const response = await fetch(`${BASE_URL}/tasks/assignee/${userId}?${testCase.params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        log.success(`Found ${result.count} matching tasks`);
        console.log(`  - Assigned to: ${result.assignedTo}`);
        console.log(`  - Page ${result.pagination.page} of ${result.pagination.totalPages}`);
      } else {
        log.error(result.message);
      }
    } catch (error) {
      log.error(`Error: ${error.message}`);
    }
  }
}

// Test 5: Get all users with pagination
async function testGetUsersWithPagination(token) {
  log.section('TEST 5: Get All Users with Pagination');
  
  try {
    const response = await fetch(`${BASE_URL}/users?page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (result.success) {
      log.success('Fetched users successfully');
      log.info(`Current Page: ${result.pagination.page}`);
      log.info(`Users per Page: ${result.pagination.limit}`);
      log.info(`Total Users: ${result.pagination.totalCount}`);
      log.info(`Total Pages: ${result.pagination.totalPages}`);
      
      if (result.data.length > 0) {
        log.info('\nSample Users:');
        result.data.forEach((user, idx) => {
          console.log(`  ${idx + 1}. ${user.email} (${user.role}, active: ${user.isActive})`);
        });
      }
    } else {
      log.error(result.message);
    }
  } catch (error) {
    log.error(`Error: ${error.message}`);
  }
}

// Test 6: Filter users by role and active status
async function testFilterUsersWithPagination(token) {
  log.section('TEST 6: Filter Users by Role & Status with Pagination');
  
  const testCases = [
    { params: 'role=admin&page=1&limit=5', description: 'All admin users' },
    { params: 'role=user&isActive=true&page=1&limit=10', description: 'Active regular users' },
    { params: 'isActive=false&page=1&limit=5', description: 'Inactive users' },
    { params: 'sortBy=email-asc&page=1&limit=5', description: 'Users sorted by email' },
  ];
  
  for (const testCase of testCases) {
    log.info(`\nTesting: ${testCase.description}`);
    
    try {
      const response = await fetch(`${BASE_URL}/users?${testCase.params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        log.success(`Found ${result.count} matching users`);
        console.log(`  - Total: ${result.pagination.totalCount}`);
        console.log(`  - Pages: ${result.pagination.totalPages}`);
      } else {
        log.error(result.message);
      }
    } catch (error) {
      log.error(`Error: ${error.message}`);
    }
  }
}

// Test 7: Test pagination edge cases
async function testPaginationEdgeCases(token) {
  log.section('TEST 7: Pagination Edge Cases');
  
  const testCases = [
    { params: 'page=1&limit=1', description: 'Single item per page' },
    { params: 'page=100&limit=10', description: 'High page number' },
    { params: 'page=1&limit=50', description: 'Large page size' },
    { params: 'page=invalid&limit=10', description: 'Invalid page number (should default)' },
  ];
  
  for (const testCase of testCases) {
    log.info(`\nTesting: ${testCase.description}`);
    
    try {
      const response = await fetch(`${BASE_URL}/tasks?${testCase.params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        log.success('Request successful');
        console.log(`  - Page: ${result.pagination.page}, Limit: ${result.pagination.limit}`);
        console.log(`  - Returned: ${result.count} items`);
      } else {
        log.warn(result.message);
      }
    } catch (error) {
      log.error(`Error: ${error.message}`);
    }
  }
}

// Main test runner
async function runTests(token) {
  log.section('TASK MANAGEMENT SYSTEM - API ENHANCEMENTS TEST SUITE');
  log.info('Testing Pagination, Filtering, and Sorting Features');
  
  // Run all tests
  await testGetTasksWithPagination(token);
  await testFilterTasksWithPagination(token);
  await testGetTasksByStatus(token);
  await testGetTasksByAssignee(token, process.argv[3]); // Pass userId as third argument
  await testGetUsersWithPagination(token);
  await testFilterUsersWithPagination(token);
  await testPaginationEdgeCases(token);
  
  log.section('TEST SUITE COMPLETED');
}

// Parse command line arguments
const token = process.argv[2];

if (!token) {
  log.error('JWT token required');
  console.log('\nUsage: node TEST_ENHANCEMENTS.js <JWT_TOKEN> [USER_ID]');
  console.log('\nExample:');
  console.log('  node TEST_ENHANCEMENTS.js eyJhbGc... 507f1f77bcf86cd799439001');
  console.log('\nTo get a JWT token:');
  console.log('  1. Register: POST /api/auth/register');
  console.log('  2. Login: POST /api/auth/login');
  console.log('  Copy the token from the response and pass it as first argument.');
  process.exit(1);
}

// Run tests
runTests(token);

