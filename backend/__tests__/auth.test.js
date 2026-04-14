/**
 * Authentication API Tests
 * Tests for: register, login, getCurrentUser, updateProfile, logout
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Authentication APIs', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'testPassword123',
    role: 'user',
  };

  const adminUser = {
    email: 'admin@example.com',
    password: 'adminPassword123',
    role: 'admin',
  };

  let testUserToken = null;
  let adminUserToken = null;
  let createdUserId = null;

  beforeAll(async () => {
    // Connect to test database
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    // Cleanup: Delete all test users
    await User.deleteMany({ email: { $in: ['test@example.com', 'admin@example.com', 'update@example.com', 'newuser@example.com'] } });
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  afterEach(async () => {
    // No cleanup needed per test as we're using unique emails
  });

  // ============================================================
  // REGISTER TESTS
  // ============================================================

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123',
          role: 'user',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.email).toBe('newuser@example.com');
      expect(response.body.data.role).toBe('user');
      expect(response.body.data.id).toBeDefined();

      testUserToken = response.body.token;
      createdUserId = response.body.data.id;
    });

    test('should register admin user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'AdminPass123',
          role: 'admin',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('admin');
      expect(response.body.token).toBeDefined();

      adminUserToken = response.body.token;
    });

    test('should fail if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'testPassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    test('should fail if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });

    test('should fail if email is already registered', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'testPassword123',
        });

      // Try to register again with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'differentPassword456',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email already registered');
    });

    test('should set default role to user if not provided', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'defaultrole@example.com',
          password: 'testPassword123',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.role).toBe('user');
    });
  });

  // ============================================================
  // LOGIN TESTS
  // ============================================================

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'LoginPass123',
        });
    });

    test('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'LoginPass123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.email).toBe('login@example.com');
      expect(response.body.data.id).toBeDefined();

      testUserToken = response.body.token;
    });

    test('should fail if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'LoginPass123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    test('should fail if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });

    test('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anyPassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should fail if user account is inactive', async () => {
      // Create and deactivate a user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'inactive@example.com',
          password: 'InactivePass123',
        });

      const userId = registerRes.body.data.id;
      const adminToken = adminUserToken || (await registerAdmin());

      // Deactivate the user (using admin endpoint)
      await request(app)
        .put(`/api/users/${userId}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Try to login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'InactivePass123',
        });

      expect(loginRes.status).toBe(401);
      expect(loginRes.body.message).toContain('inactive');
    });
  });

  // ============================================================
  // GET CURRENT USER TESTS
  // ============================================================

  describe('GET /api/auth/me', () => {
    let validToken = null;

    beforeAll(async () => {
      // Register and get token
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'currentuser@example.com',
          password: 'CurrentPass123',
        });

      validToken = res.body.token;
    });

    test('should get current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('currentuser@example.com');
      expect(response.body.data.role).toBe('user');
      expect(response.body.data.id).toBeDefined();
    });

    test('should fail without authorization token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('authorize');
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat validtoken');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // UPDATE PROFILE TESTS
  // ============================================================

  describe('PUT /api/auth/profile', () => {
    let updateToken = null;
    let updateUserId = null;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'update@example.com',
          password: 'UpdatePass123',
        });

      updateToken = res.body.token;
      updateUserId = res.body.data.id;
    });

    test('should update user profile successfully', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${updateToken}`)
        .send({
          newPassword: 'NewPassword456',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated');
    });

    test('should fail without authorization token', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({
          newPassword: 'NewPassword456',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .send({
          newPassword: 'NewPassword456',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should allow login with new password after update', async () => {
      // First update password
      await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${updateToken}`)
        .send({
          newPassword: 'UpdatedPass789',
        });

      // Try to login with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'update@example.com',
          password: 'UpdatedPass789',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.token).toBeDefined();
    });
  });

  // ============================================================
  // LOGOUT TESTS
  // ============================================================

  describe('POST /api/auth/logout', () => {
    let logoutToken = null;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'logout@example.com',
          password: 'LogoutPass123',
        });

      logoutToken = res.body.token;
    });

    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${logoutToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('logged out');
    });

    test('should fail without authorization token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // HEALTH CHECK TEST
  // ============================================================

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('running');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});

// Helper function to register admin
async function registerAdmin() {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email: `admin_${Date.now()}@example.com`,
      password: 'AdminPass123',
      role: 'admin',
    });

  return res.body.token;
}
