# TASK-FOUNDATION-007 — Environment Variables

> **Phase:** Foundation  
> **Task ID:** TASK-FOUNDATION-007  
> **Priority:** P1 (High)  
> **Status:** Done

---

# Objective

Configure environment variables for both the backend and frontend applications to ensure that sensitive information and environment-specific settings are managed securely and consistently.

---

# Background

The system requires different configurations depending on the environment (Development, Testing, Production). Sensitive data such as database credentials and API secrets must never be hardcoded into the source code.

This task establishes a centralized configuration approach using environment variables.

---

# Scope

## Included

- Configure backend `.env`
- Create backend `.env.example`
- Configure Angular environment files
- Define required environment variables
- Exclude sensitive files from Git
- Verify environment variables are loaded correctly

## Not Included

- Authentication secrets
- Production deployment configuration
- Cloud environment configuration

---

# Dependencies

- TASK-FOUNDATION-001 — Project Repository Setup
- TASK-FOUNDATION-004 — Backend Project Initialization
- TASK-FOUNDATION-005 — MySQL Database Configuration

---

# Business Rules

- Never commit `.env` files.
- Commit only `.env.example`.
- All sensitive values must be loaded from environment variables.
- No passwords, API keys, or tokens may appear in the source code.

---

# Backend Environment Variables

Create:

```text
backend/.env
```

Example:

```env
# Application
APP_NAME=IMS Document Request Services
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ims_document_request
DB_USER=root
DB_PASSWORD=your_password

# Frontend
FRONTEND_URL=http://localhost:4200

# Security
JWT_SECRET=replace_with_secure_secret
JWT_EXPIRES_IN=1d

# Logging
LOG_LEVEL=debug
```

---

# Backend `.env.example`

Create:

```text
backend/.env.example
```

Example:

```env
APP_NAME=
NODE_ENV=
PORT=

DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

FRONTEND_URL=

JWT_SECRET=
JWT_EXPIRES_IN=

LOG_LEVEL=
```

---

# Angular Environment Files

Create or verify:

```text
frontend/src/environments/
├── environment.ts
└── environment.development.ts
```

Example:

```typescript
export const environment = {
    production: false,
    apiUrl: 'http://localhost:3000/api'
};
```

---

# Files to Create

```text
backend/.env

backend/.env.example

frontend/src/environments/environment.ts

frontend/src/environments/environment.development.ts
```

---

# Files to Modify

```text
.gitignore
```

Verify the following entries exist:

```gitignore
.env
*.env
!.env.example
```

---

# Implementation Checklist

- [ ] Create backend `.env`
- [ ] Create backend `.env.example`
- [ ] Configure Angular environment files
- [ ] Verify `.gitignore`
- [ ] Load environment variables in backend
- [ ] Verify Angular reads API URL correctly
- [ ] Test application startup

---

# Verification

Backend

```bash
npm run dev
```

Expected Result

- Server starts successfully.
- Database connection uses environment variables.
- No hardcoded credentials.

Frontend

```bash
ng serve
```

Expected Result

- Angular application compiles successfully.
- API URL is loaded from the environment configuration.

---

# Acceptance Criteria

- Environment variables configured.
- Sensitive values excluded from Git.
- Backend loads `.env` successfully.
- Frontend environment configuration operational.
- `.env.example` available for new developers.

---

# Definition of Done

- Backend configuration completed.
- Frontend configuration completed.
- `.env.example` created.
- `.gitignore` verified.
- Acceptance criteria satisfied.

---

# Estimated Effort

20–30 minutes

---

# Next Task

**TASK-FOUNDATION-008 — Code Standards**

---

# Notes for OpenCode

Before implementing:

1. Never commit the actual `.env` file.
2. Store only non-sensitive placeholders in `.env.example`.
3. Use environment variables for all configurable values.
4. Verify both frontend and backend start successfully after configuration.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |