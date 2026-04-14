# Task Management System Backend

A complete Node.js backend using Express.js and MongoDB with a clean MVC architecture.

## Features

- ✅ Express.js server setup
- ✅ MongoDB integration with Mongoose
- ✅ MVC pattern folder structure
- ✅ JWT Authentication with bcrypt password hashing
- ✅ User registration and login
- ✅ Protected routes with auth middleware
- ✅ Role-based authorization (admin/user)
- ✅ Admin user management (CRUD operations)
- ✅ User activity tracking (last login, active status)
- ✅ User statistics and filtering
- ✅ Error handling middleware
- ✅ CORS support
- ✅ Environment variables with dotenv
- ✅ Complete Task API endpoints

## Folder Structure

```
Task_Management_System/
├── src/
│   ├── config/
│   │   └── database.js              # MongoDB connection configuration
│   ├── controllers/
│   │   ├── authController.js        # Auth business logic
│   │   ├── userController.js        # User CRUD business logic
│   │   └── taskController.js        # Task business logic
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT authentication & authorization
│   │   ├── corsMiddleware.js        # CORS configuration
│   │   └── errorHandler.js          # Global error handling
│   ├── models/
│   │   ├── User.js                  # User data model
│   │   └── Task.js                  # Task data model
│   ├── routes/
│   │   ├── authRoutes.js            # Auth API routes
│   │   ├── userRoutes.js            # User management routes
│   │   └── taskRoutes.js            # Task API routes
│   └── app.js                       # Express app configuration
├── server.js                        # Server entry point
├── package.json                     # Dependencies
├── .env.example                     # Environment variables template
├── .env                             # Environment variables (local, not in git)
├── AUTHENTICATION.md                # Auth API documentation
├── USER_MANAGEMENT.md               # User management documentation
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
```

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/task_management_system
   CORS_ORIGIN=http://localhost:3000
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   ```

3. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

4. **Run the server**
   
   Development (with auto-reload):
   ```bash
   npm run dev
   ```
   
   Production:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication (Public)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `POST /api/auth/logout` - Logout user (protected)

### User Management (Protected - Admin Only)
- `GET /api/users` - Get all users with filtering
- `GET /api/users/:id` - Get user by ID (user can view own)
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/role` - Change user role
- `POST /api/users/:id/toggle-status` - Activate/deactivate user
- `GET /api/users/stats` - Get user statistics

### Tasks (Protected - Requires JWT Token)
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get a single task
- `GET /api/tasks/status/:status` - Get tasks by status
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Health Check
- `GET /api/health` - Server health status

## Authentication Usage

### Quick Start Example

1. **Register a new user:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "password123"
     }'
   ```

2. **Login to get JWT token:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "password123"
     }'
   ```

3. **Use token to access protected routes:**
   ```bash
   curl -X GET http://localhost:5000/api/tasks \
     -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
   ```

**Full documentation:** See [AUTHENTICATION.md](AUTHENTICATION.md) for detailed API examples and implementation guides.

## User Management Features

### 🔐 Admin User Management

Administrators have full control over user management:

- **View all users** with filtering by role, status, and email search
- **Create new users** with specific roles (admin/user)
- **Update user information** (email, role, status)
- **Delete users** from the system
- **Change user roles** dynamically
- **Activate/Deactivate accounts** to control access
- **View user statistics** (total, admins, active, inactive)

### 📊 User Management Example (Admin Only)

```bash
# Get admin token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"adminpass"}' | jq -r '.token')

# Create a new user
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "role": "user"
  }'

# Get all users with filtering
curl -X GET "http://localhost:5000/api/users?role=admin&isActive=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Change user role to admin
curl -X POST http://localhost:5000/api/users/507f1f77bcf86cd799439011/role \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'

# Get user statistics
curl -X GET http://localhost:5000/api/users/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Full documentation:** See [USER_MANAGEMENT.md](USER_MANAGEMENT.md) for complete user management API documentation.

## User Model

```json
{
  "_id": "ObjectId",
  "email": "string (unique, required)",
  "password": "string (hashed, required, min 6 chars)",
  "role": "string (enum: 'user', 'admin', default: 'user')",
  "isActive": "boolean (default: true)",
  "lastLogin": "date",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## Task Model

```json
{
  "title": "string (required)",
  "description": "string",
  "status": "pending | in-progress | completed",
  "priority": "low | medium | high",
  "dueDate": "date",
  "category": "string",
  "completed": "boolean"
}
```

## MongoDB Fixes Applied

### ✅ Issues Fixed

1. **Database Connection**
   - Fixed: Async/await flow in `server.js` - Database now connects before server starts
   - Added: Timeout settings for MongoDB connection (10 seconds)
   - Added: Validation for `MONGODB_URI` environment variable

2. **Error Handling**
   - Fixed: Duplicate code in error handler middleware
   - Added: Mongoose-specific error handling (ValidationError, CastError, duplicate key errors)
   - Added: Environment-aware error responses (detailed in dev, generic in production)

3. **Model Optimization**
   - Added: Database indexes on `status` and `category` fields for faster queries
   - Added: Composite indexes for common query patterns
   - Added: Virtual property `daysUntilDue` for task deadline calculations
   - Added: JSON serialization of virtuals

4. **Controller Validation**
   - Added: MongoDB ObjectId validation before database queries
   - Added: Input validation for required fields
   - Added: Protected fields - prevents updating `timestamps` or sensitive data
   - Added: Better error messages with field-level validation

5. **Mongoose Best Practices**
   - Using `useNewUrlParser` and `useUnifiedTopology` options
   - Proper schema validation with custom error messages
   - Field indexing for performance
   - Virtual properties for computed values
   - Enum validation for constrained fields

### 📋 Environment Setup

Create `.env` file:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/task_management_system

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_SECRET=change_this_to_a_strong_random_string_in_production
JWT_EXPIRE=7d
```

## Authentication Features Added

### ✅ New Security Features

1. **User Authentication**
   - User registration with email and password
   - Password hashing with bcryptjs (10 salt rounds)
   - Login with JWT token generation
   - Email validation and uniqueness

2. **JWT Protection**
   - JWT token-based authentication
   - Configurable token expiration (default: 7 days)
   - Automatic token verification on protected routes
   - Token refresh capability

3. **User Model**
   - Email field (unique, required, validated)
   - Hashed password (minimum 6 characters)
   - Role-based access control (user/admin)
   - Active status tracking
   - Last login timestamp
   - Timestamps (createdAt, updatedAt)

4. **Auth Middleware**
   - `protect` middleware - Verifies JWT token validity
   - `authorize` middleware - Checks user role permissions
   - Automatic user attachment to request object
   - Proper error handling for expired/invalid tokens

5. **Protected Routes**
   - All task endpoints now require JWT authentication
   - Role-based route protection available
   - User profile management endpoints

### 🧪 Test the API

**Register a new user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Login and get JWT token:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Create a task (protected - requires token):**
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project",
    "description": "Finish the task management system",
    "priority": "high",
    "status": "in-progress"
  }'
```

**Get all tasks (protected - requires token):**
```bash
curl http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get current user:**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["field-specific errors"]
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Server Error

## Dependencies

- `express` ^4.18.2 - Web framework
- `mongoose` ^7.8.9 - MongoDB ODM
- `cors` ^2.8.5 - CORS middleware
- `dotenv` ^16.6.1 - Environment variables
- `mongodb` ^7.1.1 - MongoDB driver
- `nodemon` ^2.0.20 - Development auto-reload
```

## Middleware

### CORS Middleware
- Configured in `src/middleware/corsMiddleware.js`
- Allows requests from `CORS_ORIGIN` environment variable
- Supports credentials and preflight requests

### Error Handler
- Centralized error handling in `src/middleware/errorHandler.js`
- Handles validation errors, duplicate keys, invalid IDs, JWT errors, etc.
- Development mode includes error stack traces

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/task_management_system
CORS_ORIGIN=http://localhost:3000
```

## Database Connection

MongoDB connection is handled in `src/config/database.js`. The connection automatically:
- Validates the MongoDB URI
- Uses new URL parser and unified topology
- Provides connection status logging
- Exits the process on connection failure

## Error Handling

The application includes comprehensive error handling:
- **Validation Errors** - Returns 400 status with field-level errors
- **Duplicate Keys** - Returns 400 status for unique constraint violations
- **Cast Errors** - Returns 400 status for invalid ObjectID formats
- **JWT Errors** - Returns 401 status for authentication issues
- **Server Errors** - Returns 500 status with error message

## Development

To run in development mode with auto-reload using Nodemon:

```bash
npm run dev
```

## Testing

You can test the API using tools like:
- Postman
- cURL
- Thunder Client
- REST Client extension

Example POST request to create a task:
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project",
    "description": "Finish the backend setup",
    "priority": "high",
    "category": "Development"
  }'
```

## Next Steps

1. Add authentication (JWT, etc.)
2. Add input validation middleware
3. Add logging and monitoring
4. Add unit and integration tests
5. Add database pagination and filtering
6. Add API documentation with Swagger
7. Add rate limiting
8. Add database backup strategy

## License

ISC
