# TASK-FOUNDATION-002 — Development Environment

> **Phase:** Foundation  
> **Task ID:** TASK-FOUNDATION-002  
> **Priority:** P0 (Critical)  
> **Status:** Done

---

# Objective

Prepare and verify the complete development environment required to build the **Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel**.

All team members must be able to clone the repository, install dependencies, and run the frontend, backend, and database locally.

---

# Background

A consistent development environment prevents compatibility issues, installation errors, and inconsistent behavior between development machines.

This task establishes the required software, tools, and configurations before implementation begins.

---

# Scope

## Included

- Install Node.js (LTS)
- Install npm
- Install Angular CLI
- Install Visual Studio Code
- Install Git
- Install MySQL Server
- Install MySQL Workbench (Optional)
- Install Postman or Bruno for API testing
- Install recommended VS Code extensions
- Verify all required tools

## Not Included

- Creating Angular project
- Creating Express project
- Database schema
- API development

---

# Required Software

| Software | Purpose |
|----------|---------|
| Node.js (LTS) | JavaScript Runtime |
| npm | Package Manager |
| Angular CLI | Frontend Development |
| Git | Version Control |
| MySQL Server | Database |
| Visual Studio Code | Code Editor |
| Postman / Bruno | API Testing |

---

# Recommended VS Code Extensions

- Angular Language Service
- ESLint
- Prettier
- GitLens
- Error Lens
- Path Intellisense
- DotENV
- REST Client (Optional)

---

# Version Requirements

| Software | Minimum Version |
|----------|-----------------|
| Node.js | LTS |
| npm | Latest Compatible |
| Angular CLI | Latest Stable |
| Git | Latest Stable |
| MySQL | 8.x |

---

# Dependencies

- TASK-FOUNDATION-001 — Project Repository Setup

---

# Business Rules

- All developers should use compatible software versions.
- Development should be performed using the project's approved toolset.
- No project-specific code should be created during this task.

---

# Files to Create

None.

---

# Files to Modify

None.

---

# Implementation Checklist

- [ ] Install Node.js
- [ ] Verify `node -v`
- [ ] Verify `npm -v`
- [ ] Install Angular CLI
- [ ] Verify `ng version`
- [ ] Install Git
- [ ] Verify `git --version`
- [ ] Install MySQL Server
- [ ] Verify MySQL service is running
- [ ] Install Postman or Bruno
- [ ] Install VS Code extensions
- [ ] Clone repository successfully

---

# Verification

Run the following commands successfully:

```bash
node -v

npm -v

ng version

git --version

mysql --version
```

Expected Result:

- All commands execute without errors.
- Required software is installed and accessible from the command line.

---

# Acceptance Criteria

- Required software installed.
- Required versions verified.
- Development tools operational.
- Repository cloned successfully.
- Environment ready for project initialization.

---

# Definition of Done

- Development environment prepared.
- Software verified.
- Toolchain operational.
- Acceptance criteria satisfied.

---

# Estimated Effort

45–60 minutes

---

# Next Task

**TASK-FOUNDATION-003 — Angular Project Initialization**

---

# Notes for OpenCode

Before implementing:

1. Verify all required software is installed.
2. Do not initialize Angular or Express projects.
3. Ensure all tools are accessible via the command line.
4. Record any version differences if they exist.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |