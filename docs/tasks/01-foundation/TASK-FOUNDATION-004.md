# TASK-FOUNDATION-004 — Backend Project Initialization

> **Phase:** Foundation  
> **Task ID:** TASK-FOUNDATION-004  
> **Priority:** P0 (Critical)  
> **Status:** Done

---

# Objective

Initialize the backend application using **Node.js** and **Express.js** to provide RESTful APIs for the Information Management System with IoT-Assisted Document Request Services Kiosk.

The backend must be scalable, modular, and ready for future integrations with the Angular frontend, MySQL database, RFID hardware, and webcam services.

---

# Background

The backend serves as the core of the system by handling business logic, authentication, database communication, hardware integration, and API services.

This task establishes the project structure and development environment without implementing business features.

---

# Scope

## Included

- Initialize Node.js project
- Install Express.js
- Configure development server
- Install essential dependencies
- Create modular folder structure
- Configure middleware
- Configure API routing
- Create health check endpoint
- Verify backend server starts successfully

## Not Included

- Authentication
- Database integration
- CRUD APIs
- RFID communication
- Webcam integration
- Business logic

---

# Technology Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime Environment |
| Express.js | Web Framework |
| Nodemon | Development Server |
| dotenv | Environment Variables |
| CORS | Cross-Origin Requests |
| Helmet | Security Headers |
| Morgan | HTTP Request Logging |
| Express Validator | Request Validation |

---

# Dependencies

### Production

```text
express
cors
dotenv
helmet
morgan
express-validator
```

### Development

```text
nodemon
```

---

# Project Structure

```text
backend/

src/

config/

controllers/

routes/

middleware/

models/

services/

repositories/

utils/

validations/

uploads/

logs/

app.js

server.js

package.json

.env.example
```

---

# Dependencies

- TASK-FOUNDATION-001 — Project Repository Setup
- TASK-FOUNDATION-002 — Development Environment
- TASK-FOUNDATION-003 — Angular Project Initialization

---

# Business Rules

- Follow RESTful API architecture.
- Use modular folder organization.
- Separate routes, controllers, services, and repositories.
- Environment variables must not be hardcoded.
- Do not implement business modules during this task.

---

# Files to Create

```text
package.json

src/server.js

src/app.js

src/routes/

src/controllers/

src/services/

src/models/

src/config/

src/middleware/

src/utils/

.env.example
```

---

# Files to Modify

None.

---

# Installation Commands

Initialize project

```bash
cd backend

npm init -y
```

Install production dependencies

```bash
npm install express cors dotenv helmet morgan express-validator
```

Install development dependency

```bash
npm install --save-dev nodemon
```

---

# Package.json Scripts

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

---

# Initial API Endpoint

Create a health check endpoint.

```http
GET /api/health
```

Example Response

```json
{
  "success": true,
  "message": "IMS Backend API is running."
}
```

---

# Middleware Configuration

Configure the following middleware:

- JSON Parser
- URL Encoded Parser
- CORS
- Helmet
- Morgan
- Global Error Handler (placeholder)

---

# Implementation Checklist

- [ ] Initialize Node.js project
- [ ] Install dependencies
- [ ] Install development dependencies
- [ ] Create folder structure
- [ ] Configure Express application
- [ ] Configure middleware
- [ ] Configure API routing
- [ ] Create health check endpoint
- [ ] Configure package.json scripts
- [ ] Verify backend starts successfully

---

# Verification

Run

```bash
npm install

npm run dev
```

Open

```text
http://localhost:3000/api/health
```

Expected Response

```json
{
  "success": true,
  "message": "IMS Backend API is running."
}
```

No console errors should occur.

---

# Acceptance Criteria

- Backend project initialized.
- Express server starts successfully.
- Folder structure created.
- Middleware configured.
- Health endpoint responds correctly.
- Development server runs using Nodemon.

---

# Definition of Done

- Backend initialized.
- Project structure completed.
- Dependencies installed.
- Health endpoint verified.
- Acceptance criteria satisfied.

---

# Estimated Effort

45–60 minutes

---

# Next Task

**TASK-FOUNDATION-005 — MySQL Database Configuration**

---

# Notes for OpenCode

Before implementing:

1. Create the backend inside the `backend` directory.
2. Use Express.js with a modular architecture.
3. Do not implement business features.
4. Configure only the foundational middleware.
5. Ensure the server starts successfully and responds to the health check endpoint.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |