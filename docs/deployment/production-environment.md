# Production Environment Setup Guide

> **Task:** TASK-DEPLOYMENT-002
> **Date:** July 31, 2026

---

## 1. Operating System Requirements

| Component | Specification |
|-----------|---------------|
| OS | Windows 11 Pro (64-bit) |
| CPU | Intel Core i5 / Ryzen 5 |
| RAM | 8 GB minimum |
| Storage | 256 GB SSD, 50 GB free |

---

## 2. Required Software

### Node.js
```bash
# Download LTS from https://nodejs.org
node -v    # Verify
npm -v     # Verify
```

### MySQL
```bash
# Install MySQL 8.x
# Verify
mysql --version
```

### Google Chrome
```bash
# Download from https://www.google.com/chrome/
```

### Git
```bash
# Download from https://git-scm.com
git --version
```

---

## 3. Directory Structure

```
C:\BarangayIMS\
├── backend\
├── frontend\
├── uploads\
│   ├── residents\
│   ├── requests\
│   └── temporary\
├── logs\
├── backups\
└── scripts\
```

---

## 4. Environment Variables

Create `C:\BarangayIMS\backend\.env`:

```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ims_iot_document_kiosk
DB_USER=root
DB_PASSWORD=
JWT_SECRET=your-production-secret-key
UPLOAD_PATH=C:\BarangayIMS\uploads
KIOSK_RFID_ENABLED=false
```

---

## 5. Network Configuration

- Server: Static IP recommended (e.g., `192.168.1.10`)
- Staff workstations: DHCP or static IP
- Kiosk: DHCP or static IP
- Verify all devices can reach the server on port 3000

---

## 6. Firewall Configuration

Allow:
- Port 3000 (Backend API)
- Port 3306 (MySQL, if remote access needed)
- Port 4200 (Frontend dev, optional)

---

## 7. Validation Checklist

- [ ] Windows installed and updated
- [ ] Node.js installed (`node -v` works)
- [ ] MySQL installed and running
- [ ] Chrome installed
- [ ] Directory structure created
- [ ] Environment variables configured
- [ ] Network connectivity verified
- [ ] Firewall configured

---

*Document created: July 31, 2026*
