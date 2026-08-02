# TASK-DEPLOYMENT-002 — Production Environment Setup

> **Phase:** Deployment
> **Task ID:** TASK-DEPLOYMENT-002
> **Priority:** P0 (Critical)
> **Status:** DONE

---

# Objective

Prepare the production environment required to host the Information Management System with IoT-Assisted Document Request Services Kiosk.

This task ensures that the production computer has the necessary operating system, software, directory structure, network configuration, and security settings to support reliable system operation.

---

# Background

Before deploying the application, the production environment must be properly configured.

A standardized environment minimizes deployment errors, simplifies maintenance, and ensures consistent system behavior.

For this project, the production environment consists of:

- One Server Computer
- One or more Staff Workstations
- One Self-Service Kiosk

---

# Scope

## Included

- Operating System Configuration
- Software Installation
- Runtime Installation
- Directory Structure
- Environment Variables
- Firewall Configuration
- Network Configuration
- Browser Configuration
- Production Validation

---

## Not Included

- Database Deployment
- Backend Deployment
- Frontend Deployment
- Hardware Configuration

These are completed in later deployment tasks.

---

# Production Environment Architecture

```
Server Computer

│

├── Node.js Runtime

├── Express Backend

├── MySQL Database

└── File Storage

        ▲

        │ LAN

        ▼

Staff Workstations

Angular Web Application

        ▲

        │ LAN

        ▼

Self-Service Kiosk

Angular Kiosk Application
```

---

# Operating System Requirements

Recommended

| Component | Specification |
|-----------|---------------|
| Operating System | Windows 11 Pro (64-bit) |
| Processor | Intel Core i5 / Ryzen 5 |
| Memory | Minimum 8 GB RAM |
| Storage | Minimum 256 GB SSD |
| Available Storage | At least 50 GB Free |

---

# Required Software

## Runtime

Install

```
Node.js LTS
```

Verify

```
node -v

npm -v
```

---

## Database

Install

```
MySQL Server
```

Recommended Version

```
MySQL 8.x
```

---

## Database Administration

Install

```
MySQL Workbench
```

(Optional but recommended)

---

## Web Browser

Supported

```
Google Chrome

Microsoft Edge
```

---

## Source Control

Install

```
Git
```

---

## Code Editor

(Optional)

```
Visual Studio Code
```

Useful for future maintenance.

---

# Directory Structure

Recommended

```
C:\BarangayIMS

│

├── backend

├── frontend

├── database

├── uploads

│     ├── residents

│     ├── requests

│     └── temporary

├── logs

├── backups

└── scripts
```

Directory Purpose

backend

```
Express Application
```

frontend

```
Angular Production Build
```

uploads

```
Resident Photos

Uploaded Documents
```

logs

```
Application Logs
```

backups

```
Database Backups
```

scripts

```
Deployment Scripts
```

---

# Environment Variables

Backend

Example

```
PORT=3000

DB_HOST=localhost

DB_PORT=3306

DB_NAME=barangay_ims

DB_USER=ims_user

DB_PASSWORD=********

JWT_SECRET=********

UPLOAD_PATH=C:\BarangayIMS\uploads
```

Never hardcode sensitive information.

---

# Network Configuration

Recommended

```
Local Area Network (LAN)
```

Server

```
Static IP Address
```

Example

```
192.168.1.10
```

Staff Workstations

```
DHCP or Static IP
```

Kiosk

```
DHCP or Static IP
```

Verify

- Devices can communicate with the server.
- Backend API is reachable.
- Database server is accessible.

---

# Firewall Configuration

Allow

```
Node.js Application

MySQL

HTTP

HTTPS (optional)
```

Only expose required services.

---

# Browser Configuration

Staff

```
Chrome

Edge
```

Enable

- JavaScript
- Local Storage
- Cookies

---

# Kiosk Browser Configuration

Recommended

```
Google Chrome
```

Configure

- Full-screen mode
- Disable unnecessary extensions
- Disable sleep mode
- Launch kiosk application automatically (optional)

---

# Production Validation Checklist

Operating System

- [ ] Updated
- [ ] Stable

Runtime

- [ ] Node.js Installed
- [ ] npm Installed

Database

- [ ] MySQL Installed
- [ ] MySQL Running

Browser

- [ ] Chrome Installed
- [ ] Edge Installed

Directories

- [ ] Created
- [ ] Permissions Verified

Environment Variables

- [ ] Configured
- [ ] Verified

Network

- [ ] LAN Verified
- [ ] Server Reachable

Firewall

- [ ] Configured

---

# Production Setup Workflow

```
Install Windows

↓

Install Node.js

↓

Install MySQL

↓

Install Git

↓

Create Directory Structure

↓

Configure Environment Variables

↓

Configure Firewall

↓

Configure Browser

↓

Verify Environment

↓

Ready for Database Deployment
```

---

# Folder Permissions

Grant

Application

- Read
- Write

Uploads

- Read
- Write

Logs

- Read
- Write

Backups

- Read
- Write

Avoid granting unnecessary administrative privileges.

---

# Deliverables

- Production Server Prepared
- Required Software Installed
- Directory Structure Created
- Environment Variables Configured
- Network Verified
- Production Readiness Checklist Completed

---

# Acceptance Criteria

The production environment is considered ready when:

- Required software is installed.
- Runtime versions are verified.
- Directory structure exists.
- Environment variables are configured.
- Network connectivity is confirmed.
- Browser configuration is complete.
- Firewall rules are verified.

---

# Definition of Done

- Operating system configured.
- Runtime installed.
- Database software installed.
- Browser configured.
- Directory structure created.
- Environment validated.
- Ready for Database Deployment.

---

# Estimated Effort

**4–5 hours**

---

# Next Task

**TASK-DEPLOYMENT-003 — Database Deployment & Initialization**

---

# Notes for OpenCode

Before implementing:

1. Use the latest stable LTS version of Node.js that is compatible with your Angular and Express applications.
2. Store all production configuration values in a `.env` file and exclude it from version control using `.gitignore`.
3. Create the application directory structure before copying project files to keep deployment organized and maintainable.
4. Verify that Windows Firewall allows communication only on the required ports (for example, the backend API and MySQL if remote access is needed).
5. Document the installed software versions (Windows, Node.js, MySQL, Angular build version) so future maintenance and troubleshooting can reference the exact production environment.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| 2026-07-31 | OpenCode | Task Completed |