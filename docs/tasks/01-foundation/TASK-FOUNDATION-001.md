# TASK-FOUNDATION-001 — Project Repository Setup

> **Phase:** Foundation  
> **Task ID:** TASK-FOUNDATION-001  
> **Priority:** P0 (Critical)  
> **Status:** Done

---

# Objective

Create the initial repository structure for the **Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel**.

The repository must provide a clean, scalable, and maintainable foundation for all future development.

---

# Background

Before any feature can be implemented, the project requires a standardized repository structure.

This task establishes the project's directory layout, documentation structure, Git configuration, and initial files that every developer and AI assistant will use throughout the project lifecycle.

---

# Scope

## Included

- Initialize Git repository.
- Create project root structure.
- Create documentation structure.
- Create development task structure.
- Create backend folder.
- Create frontend folder.
- Create database folder.
- Create hardware folder.
- Create tests folder.
- Create uploads folder.
- Create scripts folder.
- Configure `.gitignore`.
- Create initial `README.md`.

## Not Included

- Angular project creation.
- Express backend creation.
- Database creation.
- Hardware integration.
- Source code implementation.

---

# Deliverables

```
ims-iot-document-kiosk/

├── backend/
├── frontend/
├── database/
├── hardware/
├── uploads/
├── scripts/
├── tests/
│
├── docs/
│   └── tasks/
│       ├── 00-core/
│       ├── 01-foundation/
│       ├── 02-database/
│       ├── 03-backend/
│       ├── 04-frontend/
│       ├── 05-kiosk/
│       ├── 06-hardware/
│       ├── 07-testing/
│       ├── 08-deployment/
│       └── 09-documentation/
│
├── .gitignore
├── README.md
├── LICENSE (Optional)
└── package.json (created later)
```

---

# Dependencies

None.

This is the first implementation task.

---

# Business Rules

- The repository structure should remain organized and modular.
- Each top-level directory should have a single responsibility.
- Documentation must be separated from implementation.
- Development tasks should reside under `docs/tasks/`.

---

# Files to Create

```
README.md

.gitignore

backend/

frontend/

database/

hardware/

uploads/

scripts/

tests/

docs/tasks/
```

---

# Files to Modify

None.

---

# Implementation Checklist

- [ ] Create Git repository.
- [ ] Create root folder structure.
- [ ] Create `docs/tasks`.
- [ ] Add existing PDMP documents to `docs/tasks/00-core`.
- [ ] Create all phase folders.
- [ ] Create initial `README.md`.
- [ ] Create `.gitignore`.
- [ ] Verify folder structure.

---

# Recommended .gitignore

```gitignore
# Dependencies
node_modules/

# Environment
.env

# Logs
logs/
*.log

# Build
dist/
build/

# Angular
.angular/

# Uploads
uploads/*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Coverage
coverage/
```

---

# Verification

Confirm the following:

- Repository initializes successfully.
- Folder structure matches the specification.
- Git tracks the project correctly.
- No unnecessary files are committed.

---

# Acceptance Criteria

- Repository structure is complete.
- All required folders exist.
- Documentation folders exist.
- Git repository initializes successfully.
- `.gitignore` is configured.
- Project is ready for environment setup.

---

# Definition of Done

- Repository created.
- Folder structure completed.
- Initial documentation added.
- Git initialized.
- Acceptance criteria satisfied.

---

# Estimated Effort

30–45 minutes

---

# Next Task

**TASK-FOUNDATION-002 — Development Environment**

---

# Notes for OpenCode

Before implementing:

1. Do not create Angular or Express projects.
2. Only prepare the repository structure.
3. Preserve the folder hierarchy.
4. Follow the PDMP standards.
5. Do not introduce additional folders unless justified.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |