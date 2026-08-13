# Maintenance & Operations Guide

> **Task:** TASK-DEPLOYMENT-009
> **Date:** July 31, 2026

---

## 1. Daily Operations

### Start of Day
- [ ] Server running
- [ ] Backend service running
- [ ] MySQL service running
- [ ] Staff Portal accessible
- [ ] Kiosk operational
- [ ] Printer paper available

### During Operations
- Monitor resident requests
- Check hardware status
- Verify API availability

### End of Day
- [ ] Pending requests processed
- [ ] Backup completed
- [ ] No critical errors

---

## 2. Weekly Maintenance

- [ ] Review application logs
- [ ] Review error logs
- [ ] Verify backup completion
- [ ] Clean temporary files
- [ ] Test printer
- [ ] Test RFID reader
- [ ] Test webcam
- [ ] Check storage capacity

---

## 3. Monthly Maintenance

- [ ] Database optimization
- [ ] Archive old logs
- [ ] Review user accounts
- [ ] Remove inactive accounts
- [ ] Test disaster recovery
- [ ] Inspect kiosk hardware

---

## 4. Hardware Maintenance

### Touchscreen
- Clean screen weekly
- Check touch responsiveness

### RFID Reader
- Verify read accuracy
- Check cable connections

### Webcam
- Clean lens
- Verify capture quality

### Printer
- Check paper supply
- Verify print quality
- Clean print head (if needed)

### ESP8266 (RFID controller)
- Check USB cable condition
- Verify serial communication

---

## 5. Incident Management

### Hardware Failure
1. Identify device
2. Check connections
3. Restart device
4. Retest
5. Replace if needed
6. Document incident

### Backend Failure
1. Review logs
2. Restart backend
3. Verify database
4. Test APIs
5. Resume operations

### Database Failure
1. Review MySQL logs
2. Restore backup if needed
3. Verify tables
4. Restart backend

---

## 6. Preventive Maintenance Schedule

| Activity | Frequency | Responsible |
|----------|-----------|-------------|
| Verify server status | Daily | Administrator |
| Check backups | Daily | Administrator |
| Clean kiosk hardware | Weekly | Staff |
| Review logs | Weekly | Administrator |
| Database optimization | Monthly | Administrator |
| Recovery test | Quarterly | Administrator |
| Full hardware inspection | Quarterly | Administrator |

---

## 7. User Management

### Create New User
1. Login as Administrator
2. Navigate to User Management
3. Click Add User
4. Fill required fields
5. Assign role
6. Save

### Disable User
1. Login as Administrator
2. Navigate to User Management
3. Find user
4. Click deactivate
5. Confirm

---

## 8. Troubleshooting

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Backend won't start | Port in use | Change port or stop conflicting process |
| Database connection failed | MySQL not running | Start MySQL service |
| RFID not reading | Loose connection | Check USB and SPI cables |
| Printer not printing | Paper empty | Load paper roll |
| Camera not detected | USB issue | Reconnect webcam |

---

*Document created: July 31, 2026*
