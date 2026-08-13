# Deployment Plan

> **Project:** IMS-IoT Document Request Kiosk
> **Client:** Barangay San Manuel
> **Version:** 1.0
> **Date:** July 31, 2026

---

## 1. Deployment Strategy

Deployment follows a phased approach:

```
Planning → Environment Setup → Database → Backend → Frontend → Kiosk → Verification → Go-Live
```

Each phase must complete successfully before proceeding.

---

## 2. Production Architecture

```
                    Barangay Hall

            Staff Workstation(s)
                   │
                   ▼
           Angular Staff Portal
                   │
                   ▼
            Express.js Backend (port 3000)
                   │
                   ▼
              MySQL Database
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ESP8266       RFID Reader  Webcam
                                │
                                ▼
                         Queue Slip Printer

                   ▲
                   │
          Self-Service Kiosk (port 4200)
```

---

## 3. Hardware Inventory

| Component | Purpose | Qty |
|-----------|---------|-----|
| Server Computer | Hosts backend + database | 1 |
| Staff Workstation | IMS access for staff | 1 |
| Touchscreen Monitor | Kiosk interface | 1 |
| ESP8266 (RFID controller) | Hardware controller | 1 |
| MFRC522 RFID Reader | Resident authentication | 1 |
| USB Webcam | Photo capture | 1 |
| USB Printer | Queue slip printing | 1 |

---

## 4. Software Inventory

| Software | Version | Purpose |
|----------|---------|---------|
| Windows 11 Pro | Latest | Operating system |
| Node.js | LTS | Backend runtime |
| MySQL | 8.x | Database |
| Angular | 22 | Frontend framework |
| Google Chrome | Latest | Web browser |

---

## 5. Deployment Sequence

### Step 1: Prepare Production Computer
- Install Windows 11 Pro
- Install Node.js LTS
- Install MySQL 8.x
- Install Google Chrome
- Create directory structure: `C:\BarangayIMS\`

### Step 2: Deploy Database
- Create database `ims_iot_document_kiosk`
- Import schema and seed data
- Verify tables and constraints
- Create application user

### Step 3: Deploy Backend
- Copy backend source to `C:\BarangayIMS\backend\`
- Run `npm install`
- Configure `.env` with production values
- Start backend: `npm start`
- Verify health endpoint

### Step 4: Deploy Frontend
- Run `ng build --configuration production`
- Copy `dist/` to `C:\BarangayIMS\frontend\`
- Configure API URL in environment
- Serve via static file server or nginx

### Step 5: Configure Kiosk
- Connect ESP8266 (RFID), RFID reader, webcam, printer
- Upload/Flash the ESP8266 RFID firmware
- Configure kiosk browser (Chrome kiosk mode)
- Set kiosk URL to backend

### Step 6: Verify System
- Test login
- Test kiosk workflow
- Test hardware integration
- Verify database records

---

## 6. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Hardware failure | High | Test all devices before deployment |
| Database import failure | High | Verify backup and test restoration |
| Incorrect configuration | Medium | Use deployment checklist |
| Network issues | Medium | Test LAN connectivity |

---

## 7. Rollback Plan

If deployment fails:
1. Stop deployment
2. Restore database backup
3. Restore backend configuration
4. Reconnect hardware
5. Verify system stability

---

*Document created: July 31, 2026*
