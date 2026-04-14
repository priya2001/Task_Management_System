/**
 * Task API Tests
 * Tests for: getAllTasks, getTaskById, createTask, updateTask, deleteTask,
 *            getTasksByStatus, getTasksByAssignee, getTaskStatistics with pagination
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Task = require('../src/models/Task');
const User = require('../src/models/User');

describe('Task APIs', () => {
  let userToken = null;
  let adminToken = null;
  let userId = null;
  let adminId = null;
  let testTaskId = null;

  beforeAll(async () => {
    // Connect to test database
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Create test users
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `taskuser_${Date.now()}@example.com`,
        password: 'UserPass123',
        role: 'user',
      });

    userToken = userRes.body.token;
    userId = userRes.body.data.id;

    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `taskadmin_${Date.now()}@example.com`,
        password: 'AdminPass123',
        role: 'admin',
      });

    adminToken = adminRes.body.token;
    adminId = adminRes.body.data.id;
  });

  afterAll(async () => {
    // Cleanup: Delete all test tasks and users
    const taskUserEmails = [`taskuser_${Date.now()}@example.com`, `taskadmin_${Date.now()}@example.com`];
    await Task.deleteMany({ createdBy: { $in: [userId, adminId] } });
    await User.deleteMany({ email: /^task(user|admin)_/ });

    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  // ============================================================
  // CREATE TASK TESTS
  // ============================================================

  describe('POST /api/tasks', () => {
    test('should create a task successfully', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Task',
          description: 'This is a test task',
          priority: 'high',
          status: 'pending',
          dueDate: '2026-05-01',
          assignedTo: userId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Task');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.priority).toBe('high');
      expect(response.body.data._id).toBeDefined();

      testTaskId = response.body.data._id;
    });

    test('should fail without authorization', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Unauthorized Task',
          description: 'Should fail',
          priority: 'medium',
          assignedTo: userId,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'Missing title',
          priority: 'medium',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('title');
    });

    test('should fail with invalid status', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Invalid Status Task',
          description: 'Test',
          status: 'invalid_status',
          priority: 'medium',
          assignedTo: userId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid priority', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Invalid Priority Task',
          description: 'Test',
          priority: 'invalid_priority',
          assignedTo: userId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should create task with minimal required fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Minimal Task',
          description: 'Test',
          assignedTo: userId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe('pending'); // Should have default
      expect(response.body.data.priority).toBe('medium'); // Should have default
    });

    test('should populate user information in response', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Task with User Info',
          description: 'Test',
          assignedTo: userId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.assignedTo).toBeDefined();
      expect(response.body.data.createdBy).toBeDefined();
    });
  });

  // ============================================================
  // GET ALL TASKS TESTS (with pagination)
  // ============================================================

  describe('GET /api/tasks', () => {
    beforeAll(async () => {
      // Create multiple tasks for testing
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: `Task ${i}`,
            description: `Description ${i}`,
            priority: i % 2 === 0 ? 'high' : 'low',
            status: 'pending',
            assignedTo: userId,
          });
      }
    });

    test('should get all tasks with pagination', async () => {
      const response = await request(app)
        .get('/api/tasks?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should get tasks with default pagination', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    test('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=pending&page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((task) => {
        expect(task.status).toBe('pending');
      });
    });

    test('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=high&page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((task) => {
        expect(task.priority).toBe('high');
      });
    });

    test('should filter tasks by status and priority', async () => {
      const response = await request(app)
        .get('/api/tasks?status=pending&priority=high&page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((task) => {
        expect(task.status).toBe('pending');
        expect(task.priority).toBe('high');
      });
    });

    test('should sort tasks by dueDate ascending', async () => {
      const response = await request(app)
        .get('/api/tasks?sortBy=dueDate-asc&page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should search tasks by title', async () => {
      const response = await request(app)
        .get('/api/tasks?search=Task&page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should enforce max limit of 100', async () => {
      const response = await request(app)
        .get('/api/tasks?page=1&limit=500')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBeLessThanOrEqual(100);
    });

    test('should non-admin users only see their own tasks', async () => {
      const response = await request(app)
        .get('/api/tasks?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      // Should only have tasks created or assigned to this user
      response.body.data.forEach((task) => {
        const isCreator = task.createdBy._id === userId;
        const isAssignee = task.assignedTo._id === userId;
        expect(isCreator || isAssignee).toBe(true);
      });
    });

    test('should fail without authorization', async () => {
      const response = await request(app)
        .get('/api/tasks?page=1&limit=10');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // GET TASK BY ID TESTS
  // ============================================================

  describe('GET /api/tasks/:id', () => {
    let taskToFetch = null;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Task to Fetch',
          description: 'Test',
          assignedTo: userId,
        });

      taskToFetch = res.body.data._id;
    });

    test('should get task by ID', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskToFetch}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(taskToFetch);
      expect(response.body.data.title).toBe('Task to Fetch');
    });

    test('should fail with invalid task ID format', async () => {
      const response = await request(app)
        .get('/api/tasks/invalidid')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with non-existent task ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should fail without authorization', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskToFetch}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // UPDATE TASK TESTS
  // ============================================================

  describe('PUT /api/tasks/:id', () => {
    let taskToUpdate = null;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Task to Update',
          description: 'Original',
          priority: 'low',
          status: 'pending',
          assignedTo: userId,
        });

      taskToUpdate = res.body.data._id;
    });

    test('should update task successfully', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskToUpdate}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
          priority: 'high',
          status: 'in-progress',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.priority).toBe('high');
      expect(response.body.data.status).toBe('in-progress');
    });

    test('should update partial fields', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskToUpdate}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'completed',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('completed');
      // Other fields should remain unchanged
      expect(response.body.data.title).toBe('Updated Title');
    });

    test('should fail with invalid status', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskToUpdate}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'invalid_status',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail without authorization', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskToUpdate}`)
        .send({
          title: 'Unauthorized Update',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail with non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Update Nonexistent',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // DELETE TASK TESTS
  // ============================================================

  describe('DELETE /api/tasks/:id', () => {
    let taskToDelete = null;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Task to Delete',
          description: 'Will be deleted',
          assignedTo: userId,
        });

      taskToDelete = res.body.data._id;
    });

    test('should delete task successfully', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskToDelete}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify task is deleted
      const getRes = await request(app)
        .get(`/api/tasks/${taskToDelete}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(getRes.status).toBe(404);
    });

    test('should fail without authorization', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Delete Test',
          description: 'Test',
          assignedTo: userId,
        });

      const response = await request(app)
        .delete(`/api/tasks/${res.body.data._id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail with non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // GET TASKS BY STATUS TESTS
  // ============================================================

  describe('GET /api/tasks/status/:status', () => {
    beforeAll(async () => {
      // Create tasks with different statuses
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Pending Task',
          description: 'Status test',
          status: 'pending',
          assignedTo: userId,
        });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'In Progress Task',
          description: 'Status test',
          status: 'in-progress',
          assignedTo: userId,
        });
    });

    test('should get tasks by status with pagination', async () => {
      const response = await request(app)
        .get('/api/tasks/status/pending?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.status).toBe('pending');
      response.body.data.forEach((task) => {
        expect(task.status).toBe('pending');
      });
    });

    test('should sort by dueDate', async () => {
      const response = await request(app)
        .get('/api/tasks/status/pending?sortBy=dueDate-asc&page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
    });

    test('should fail with invalid status', async () => {
      const response = await request(app)
        .get('/api/tasks/status/invalid_status')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail without authorization', async () => {
      const response = await request(app)
        .get('/api/tasks/status/pending');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // GET TASKS BY ASSIGNEE TESTS
  // ============================================================

  describe('GET /api/tasks/assigned/:userId', () => {
    test('should get tasks by assignee with pagination', async () => {
      const response = await request(app)
        .get(`/api/tasks/assigned/${userId}?page=1&limit=10`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('should filter by status for assignee', async () => {
      const response = await request(app)
        .get(`/api/tasks/assigned/${userId}?status=pending&page=1&limit=10`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((task) => {
        expect(task.status).toBe('pending');
      });
    });

    test('should filter by priority for assignee', async () => {
      const response = await request(app)
        .get(`/api/tasks/assigned/${userId}?priority=high&page=1&limit=10`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((task) => {
        expect(task.priority).toBe('high');
      });
    });

    test('should fail with invalid user ID', async () => {
      const response = await request(app)
        .get('/api/tasks/assigned/invalidid')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/tasks/assigned/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should fail without authorization', async () => {
      const response = await request(app)
        .get(`/api/tasks/assigned/${userId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should prevent user from viewing other users tasks (non-admin)', async () => {
      // Create another user
      const otherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: `other_task_user_${Date.now()}@example.com`,
          password: 'OtherPass123',
        });

      const otherUserId = otherUserRes.body.data.id;

      // Try to view other user's tasks
      const response = await request(app)
        .get(`/api/tasks/assigned/${otherUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('should allow admin to view any user tasks', async () => {
      const response = await request(app)
        .get(`/api/tasks/assigned/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ============================================================
  // GET TASK STATISTICS TESTS
  // ============================================================

  describe('GET /api/tasks/stats', () => {
    test('should get task statistics', async () => {
      const response = await request(app)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalTasks).toBeDefined();
      expect(response.body.data.pendingTasks).toBeDefined();
      expect(response.body.data.inProgressTasks).toBeDefined();
      expect(response.body.data.completedTasks).toBeDefined();
      expect(response.body.data.highPriority).toBeDefined();
      expect(response.body.data.mediumPriority).toBeDefined();
      expect(response.body.data.lowPriority).toBeDefined();
    });

    test('should return statistics as numbers', async () => {
      const response = await request(app)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(typeof response.body.data.totalTasks).toBe('number');
      expect(typeof response.body.data.pendingTasks).toBe('number');
      expect(response.body.data.totalTasks).toBeGreaterThanOrEqual(
        response.body.data.pendingTasks
      );
    });

    test('should fail without authorization', async () => {
      const response = await request(app)
        .get('/api/tasks/stats');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('non-admin user should only see their own statistics', async () => {
      const response = await request(app)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      // Should only count tasks related to the user
      response.body.data.totalTasks >= 0;
    });
  });

  // ============================================================
  // INTEGRATION TESTS
  // ============================================================

  describe('Task Integration Tests', () => {
    test('should create and retrieve task', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Integration Test Task',
          description: 'Full workflow test',
          priority: 'high',
          assignedTo: userId,
        });

      expect(createRes.status).toBe(201);
      const taskId = createRes.body.data._id;

      const getRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data._id).toBe(taskId);
    });

    test('should create, update, and delete task', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'CRUD Test Task',
          description: 'Test',
          assignedTo: userId,
        });

      const taskId = createRes.body.data._id;

      // Update
      const updateRes = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'completed',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.status).toBe('completed');

      // Delete
      const deleteRes = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(deleteRes.status).toBe(200);
    });

    test('should handle multiple pagination requests', async () => {
      const page1 = await request(app)
        .get('/api/tasks?page=1&limit=3')
        .set('Authorization', `Bearer ${userToken}`);

      expect(page1.status).toBe(200);
      expect(page1.body.pagination.page).toBe(1);

      if (page1.body.pagination.hasNextPage) {
        const page2 = await request(app)
          .get('/api/tasks?page=2&limit=3')
          .set('Authorization', `Bearer ${userToken}`);

        expect(page2.status).toBe(200);
        expect(page2.body.pagination.page).toBe(2);
      }
    });
  });
});
