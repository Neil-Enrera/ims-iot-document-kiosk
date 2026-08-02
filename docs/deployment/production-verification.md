# Production Verification & Go-Live Checklist

> **Task:** TASK-DEPLOYMENT-007
> **Date:** July 31, 2026

---

## 1. Server Verification

- [ ] Windows running normally
- [ ] Node.js service running
- [ ] MySQL service running
- [ ] Sufficient storage available
- [ ] CPU and memory within normal limits

---

## 2. Database Verification

- [ ] Database online
- [ ] All tables accessible
- [ ] Seed data available
- [ ] Administrator account works
- [ ] Connection pool stable

---

## 3. Backend Verification

- [ ] Backend starts without errors
- [ ] Health endpoint returns OK
- [ ] Authentication API works
- [ ] Resident API works
- [ ] Request API works
- [ ] Dashboard API works
- [ ] Log files generated

---

## 4. Frontend Verification

### Staff Portal
- [ ] Login works
- [ ] Dashboard loads with statistics
- [ ] Resident Management CRUD works
- [ ] User Management works
- [ ] Service Management works
- [ ] Request Management works
- [ ] Reports work
- [ ] Settings work
- [ ] Notifications work

### Kiosk Interface
- [ ] Idle screen displays
- [ ] Resident search works
- [ ] Service selection works
- [ ] Photo capture works
- [ ] Request submission works
- [ ] Return to idle works

---

## 5. Hardware Verification

- [ ] Arduino connected and communicating
- [ ] RFID reader reads registered cards
- [ ] RFID reader rejects invalid cards
- [ ] Webcam captures photos
- [ ] Printer prints queue slips

---

## 6. Network Verification

- [ ] Server reachable from staff workstation
- [ ] Server reachable from kiosk
- [ ] Backend API accessible
- [ ] Database accessible

---

## 7. Business Workflow Verification

Execute complete workflow:
1. [ ] Resident searches at kiosk
2. [ ] Resident selects service
3. [ ] Photo captured
4. [ ] Request submitted
5. [ ] Request appears in staff portal
6. [ ] Staff approves request
7. [ ] Staff releases document

---

## 8. User Account Verification

- [ ] Administrator login works
- [ ] Secretary login works
- [ ] Treasurer login works
- [ ] Role permissions correct

---

## 9. Go-Live Approval

| Component | Status |
|-----------|--------|
| Server | [ ] Ready |
| Database | [ ] Ready |
| Backend | [ ] Ready |
| Frontend | [ ] Ready |
| Kiosk | [ ] Ready |
| Hardware | [ ] Ready |

**Approved by:** _________________
**Date:** _________________

---

*Document created: July 31, 2026*
