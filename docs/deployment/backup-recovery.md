# Backup & Disaster Recovery Plan

> **Task:** TASK-DEPLOYMENT-008
> **Date:** July 31, 2026

---

## 1. Backup Components

| Component | Location | Priority |
|-----------|----------|----------|
| MySQL Database | `ims_iot_document_kiosk` | Critical |
| Uploaded Files | `C:\BarangayIMS\uploads\` | High |
| Configuration | `C:\BarangayIMS\backend\.env` | High |
| Application Code | `C:\BarangayIMS\backend\` | Medium |

---

## 2. Backup Schedule

| Frequency | What | Method |
|-----------|------|--------|
| Daily | Database | `mysqldump` |
| Daily | Uploads | File copy |
| Weekly | Full application | Archive |
| Monthly | Full system | Complete backup |

---

## 3. Database Backup

```bash
# Daily backup
mysqldump -u root ims_iot_document_kiosk > C:\BarangayIMS\backups\barangay_ims_%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%.sql

# Example: barangay_ims_20260731.sql
```

---

## 4. Upload Backup

```bash
# Copy uploads directory
xcopy /E /I C:\BarangayIMS\uploads C:\BarangayIMS\backups\uploads_%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%
```

---

## 5. Configuration Backup

```bash
# Backup configuration
copy C:\BarangayIMS\backend\.env C:\BarangayIMS\backups\configuration\
```

---

## 6. Backup Storage

- **Primary:** `C:\BarangayIMS\backups\`
- **Secondary:** External USB drive (recommended)
- **Retention:** Keep at least 30 days of daily backups

---

## 7. Disaster Recovery Procedures

### Scenario 1: Database Corruption
```bash
# 1. Stop backend
# 2. Restore database
mysql -u root ims_iot_document_kiosk < C:\BarangayIMS\backups\barangay_ims_YYYYMMDD.sql
# 3. Start backend
# 4. Verify data
```

### Scenario 2: Accidental File Deletion
```bash
# 1. Copy files from backup
xcopy /E /I C:\BarangayIMS\backups\uploads_YYYYMMDD C:\BarangayIMS\uploads
# 2. Verify files
```

### Scenario 3: Server Failure
1. Prepare replacement computer
2. Install Node.js, MySQL, Chrome
3. Restore database from backup
4. Copy backend and frontend files
5. Configure environment
6. Verify system

---

## 8. Recovery Validation

After recovery, verify:
- [ ] Database accessible
- [ ] Backend operational
- [ ] Frontend accessible
- [ ] Resident records intact
- [ ] Requests available
- [ ] Photos restored
- [ ] Audit logs available

---

## 9. Backup Log

| Date | Type | File | Verified | Operator |
|------|------|------|----------|----------|
| | | | | |

---

*Document created: July 31, 2026*
