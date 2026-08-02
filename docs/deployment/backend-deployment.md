# Backend Deployment Guide

> **Task:** TASK-DEPLOYMENT-004
> **Date:** July 31, 2026

---

## 1. Prerequisites

- Node.js LTS installed
- MySQL running and database initialized
- Directory structure created

---

## 2. Deployment Steps

### Copy Backend Files
```bash
# Copy backend source to production directory
xcopy /E /I backend C:\BarangayIMS\backend
```

### Install Dependencies
```bash
cd C:\BarangayIMS\backend
npm install
```

### Configure Environment
Create `C:\BarangayIMS\backend\.env`:
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ims_iot_document_kiosk
DB_USER=root
DB_PASSWORD=
JWT_SECRET=production-secret-key-change-this
UPLOAD_PATH=C:\BarangayIMS\uploads
LOG_PATH=C:\BarangayIMS\logs
KIOSK_RFID_ENABLED=false
```

### Create Upload Directories
```bash
mkdir C:\BarangayIMS\uploads\residents
mkdir C:\BarangayIMS\uploads\requests
mkdir C:\BarangayIMS\uploads\temporary
mkdir C:\BarangayIMS\logs
```

### Start Backend
```bash
cd C:\BarangayIMS\backend
npm start
```

Expected output:
```
Server running on port 3000
Database connected successfully
```

---

## 3. Health Check

```bash
curl http://localhost:3000/api/health
```

Expected:
```json
{
  "status": "OK",
  "database": "Connected",
  "server": "Running"
}
```

---

## 4. API Validation

Test key endpoints:
```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'

# Residents (with token)
curl http://localhost:3000/api/v1/residents -H "Authorization: Bearer <token>"

# Services
curl http://localhost:3000/api/v1/services -H "Authorization: Bearer <token>"

# Dashboard
curl http://localhost:3000/api/v1/dashboard/statistics -H "Authorization: Bearer <token>"
```

---

## 5. Validation Checklist

- [ ] Source files copied
- [ ] Dependencies installed
- [ ] `.env` configured
- [ ] Upload directories created
- [ ] Database connected
- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] APIs respond correctly

---

*Document created: July 31, 2026*
