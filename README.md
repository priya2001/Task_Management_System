# Task Management System

[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![Frontend](https://img.shields.io/badge/frontend-React%2018%20%2B%20Vite-blue)]()
[![Backend](https://img.shields.io/badge/backend-Express%20%2B%20MongoDB-green)]()
[![Tests](https://img.shields.io/badge/tests-66%2B%20passing-brightgreen)]()

A complete full-stack web application for managing tasks with user authentication, featuring a **React frontend** with TailwindCSS and a **Node.js/Express backend** with MongoDB.

---

## Quick Start (3 Steps)

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm run dev
```

### Open Browser
```
http://localhost:3000
```

**That's it!** Register → Login → Create Tasks 

---

## What You Get

### Backend (Port 5000)
- RESTful API with Express
- User authentication (Register/Login)
- Task CRUD operations
- JWT token-based security
- MongoDB integration
- 66+ tests with 82% coverage
- Production-ready code

### Frontend (Port 3000)
- React app with Vite build tool
- Beautiful UI with TailwindCSS
- 3 ready-made pages:
  - **Login** - Secure authentication
  - **Register** - User account creation
  - **Dashboard** - Task management
- React Router with protected routes
- Responsive design (mobile/tablet/desktop)
- Real-time API integration

### Full-Stack Features
- User registration & login
- Create tasks
- View all tasks
- Delete tasks
- Task statistics
- Beautiful responsive UI
- Complete documentation

## Technology Stack

### Frontend
- **React 18.2** - UI Framework
- **Vite 5.0** - Build tool (Lightning fast!)
- **React Router 6.20** - Client-side routing
- **TailwindCSS 3.4** - CSS framework
- **Axios 1.6** - HTTP client
- **ESLint 8.55** - Code quality

### Backend
- **Express 4.18** - Web framework
- **MongoDB 6.0+** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Jest 29** - Testing
- **Node.js 18+** - Runtime

---

## Project Statistics

| Metric | Value |
|--------|-------|
| **Total Files** | 40+ |
| **React Components** | 4 |
| **Page Components** | 3 |
| **API Endpoints** | 5+ |
| **Tests** | 66+ (82% coverage) |
| **Lines of Code** | 3400+ |
| **npm Dependencies** | 390+ |
| **Documentation** | 3000+ lines |

---

## Getting Started

### Prerequisites
```bash
Node.js 18+ (npm 9+)
MongoDB 6.0+ (Local or Atlas)
Git
```

### Installation

#### Backend
```bash
cd backend
npm install

# Create .env if needed
touch .env

# Start server (runs on port 5000)
npm run dev
```

#### Frontend
```bash
cd frontend
npm install

# Start dev server (runs on port 3000)
npm run dev
```

### Access Application
```
Frontend:  http://localhost:3000
Backend:   http://localhost:5000
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| **DOCUMENTATION_INDEX.md** | Navigation guide for all docs |
| **PROJECT_OVERVIEW.md** | Full architecture & setup |
| **frontend/README.md** | Complete frontend docs |
| **frontend/FRONTEND_SETUP_GUIDE.md** | Step-by-step setup |
| **frontend/FRONTEND_PROJECT_STRUCTURE.md** | Detailed structure reference |
| **backend/README.md** | Complete backend docs |
---

## Usage

### 1. Register Account
```
Go to: http://localhost:3000
Click: "Create Account"
Enter: Name, Email, Password, Confirm Password
Click: "Register"
```

### 2. Login
```
Email: [your registered email]
Password: [your password]
Click: "Sign In"
```

### 3. Create Tasks
```
In Dashboard:
- Enter task title
- Add description
- Set priority
- Click: "Create Task"
```

### 4. Manage Tasks
```
- View all tasks in grid
- See priority badges
- See status badges
- Delete tasks
- View statistics
```

### 5. Logout
```
Click: Logout button (top right)
Redirected to login page
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/register    # Create account
POST   /api/auth/login       # Login user
```

### Tasks
```
GET    /api/tasks            # Get all tasks (Protected)
POST   /api/tasks            # Create task (Protected)
DELETE /api/tasks/:id        # Delete task (Protected)
```
---



## Testing

### Backend Tests
```bash
cd backend
npm test
```

**Results**: 66+ tests, 82% coverage 

### Frontend Linting
```bash
cd frontend
npm run lint
```

---

## Production Build

### Frontend
```bash
cd frontend
npm run build

# Creates optimized dist/ folder
# Ready to deploy anywhere
```

### Backend
Ready for deployment to:
- Heroku, Railway, Render, etc.

---
### API Connection Fails
```
- Backend running on port 5000?
- Frontend proxy configured? (Check vite.config.js)
- Database connection working?
```

### Styles Not Loading
```bash
# Clear cache and rebuild
rm -rf dist/
npm run dev
```



---
## What's Included

### Backend
```
- Authentication system
- Task CRUD API
- MongoDB integration
- Error handling
- CORS configuration
- Input validation
- 66+ comprehensive tests
- Production-ready code
- Full documentation
```

### Frontend
```
- React app with Vite
- 3 fully-functional pages
- TailwindCSS styling
- React Router setup
- Protected routes
- API integration
- JWT authentication
- Form validation
- Responsive design
- Beautiful UI
- Complete documentation
```

---

## Security Features

- Password hashing (bcryptjs)
-  JWT token authentication
- Protected API routes
- CORS configuration
- Input validation
- Error handling
- Secure token storage

---

## Performance

- **Vite**: Ultra-fast build tool
- **HMR**: Hot module replacement
- **Code splitting**: Automatic
- **CSS optimization**: TailwindCSS
- **API proxy**: Seamless development
- **Production optimized**: Build ready

---
## Status

### PRODUCTION READY

| Component | Status |
|-----------|--------|
| Backend | Complete |
| Frontend |  Complete |
| Testing |  66+ tests passing |
| Documentation |  Complete |
| Ready to Deploy |  YES |
| Ready to Use |  YES |

---


