# TASK-FOUNDATION-006 — Git Workflow

> **Phase:** Foundation  
> **Task ID:** TASK-FOUNDATION-006  
> **Priority:** P1 (High)  
> **Status:** Done

---

# Objective

Establish a standardized Git workflow for the **Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel**.

The workflow should define repository hosting, branching strategy, commit message conventions, and collaboration practices to ensure a clean and maintainable version history.

---

# Background

As development progresses, multiple contributors and AI-assisted coding sessions may introduce frequent changes. A consistent Git workflow minimizes conflicts, simplifies code reviews, and provides a clear history of project development.

---

# Scope

## Included

- Initialize local Git repository (if not already initialized)
- Create remote GitHub repository
- Connect local repository to GitHub
- Define branching strategy
- Define commit message convention
- Configure `.gitignore`
- Create initial project tag (optional)
- Push initial project structure

## Not Included

- GitHub Actions / CI/CD
- Automated deployments
- Release management

---

# Dependencies

- TASK-FOUNDATION-001 — Project Repository Setup

---

# Branching Strategy

Use the following branch structure:

```text
main
│
└── develop
    │
    ├── feature/frontend
    ├── feature/backend
    ├── feature/database
    ├── feature/kiosk
    ├── feature/hardware
    ├── feature/testing
    └── hotfix/*
```

### Branch Purpose

| Branch | Purpose |
|---------|---------|
| main | Stable production-ready code |
| develop | Main development branch |
| feature/* | Individual feature development |
| hotfix/* | Critical bug fixes |

---

# Commit Message Convention

Use the following format:

```text
<type>: <short description>
```

### Types

| Type | Description |
|------|-------------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation |
| style | Formatting changes |
| refactor | Code restructuring |
| test | Testing |
| chore | Maintenance |
| build | Build configuration |

### Examples

```text
feat: initialize Angular project

feat: add resident model

fix: correct database connection

docs: update backend README

refactor: simplify authentication middleware
```

---

# Repository Rules

- Never commit `.env`
- Never commit `node_modules`
- Never commit build artifacts
- Commit only working code
- Pull before pushing changes
- Keep commits focused on a single task

---

# Git Commands

Initialize repository

```bash
git init
```

Connect remote

```bash
git remote add origin <repository-url>
```

Create develop branch

```bash
git checkout -b develop
```

Push develop branch

```bash
git push -u origin develop
```

---

# Files to Create

None.

---

# Files to Modify

```text
.gitignore
README.md
```

(if needed)

---

# Implementation Checklist

- [ ] Initialize Git repository
- [ ] Create GitHub repository
- [ ] Connect remote origin
- [ ] Create `develop` branch
- [ ] Verify `.gitignore`
- [ ] Push initial commit
- [ ] Verify branch synchronization

---

# Verification

Run:

```bash
git status

git branch

git remote -v

git log --oneline
```

Expected Result:

- Repository initialized
- Remote configured
- Branch structure created
- Initial commit visible

---

# Acceptance Criteria

- Git repository configured
- Remote repository connected
- Branch strategy established
- Commit convention documented
- Initial project pushed to GitHub

---

# Definition of Done

- Git workflow established
- Branches created
- Repository synchronized
- Team workflow documented

---

# Estimated Effort

20–30 minutes

---

# Next Task

**TASK-FOUNDATION-007 — Environment Variables**

---

# Notes for OpenCode

Before implementing:

1. Configure Git only—do not modify application code.
2. Verify remote connectivity before pushing.
3. Follow the agreed commit message convention.
4. Ensure `.gitignore` excludes sensitive and generated files.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |