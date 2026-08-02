# Hardware Test Cases — RFID Integration

> **Module:** RFID Integration
> **Type:** Hardware Testing

---

| Test ID | Hardware | Scenario | Preconditions | Steps | Expected Result | Status |
|---------|----------|----------|---------------|-------|-----------------|--------|
| INT-RFID-001 | RFID Reader | Valid card scan | Arduino connected, TEST001 registered | Tap TEST001 card | UID transmitted, resident identified | |
| INT-RFID-002 | RFID Reader | Invalid card scan | Arduino connected | Tap unknown card | "Card not registered" message | |
| INT-RFID-003 | RFID Reader | Multiple consecutive scans | Arduino connected | Tap card 5 times rapidly | Each scan processed correctly | |
| INT-RFID-004 | Arduino | Serial connection | Arduino connected via USB | Check COM port | COM port detected, serial active | |
| INT-RFID-005 | Arduino | Auto-reconnect | Arduino connected | Unplug and replug USB | Connection re-established | |
| INT-RFID-006 | Arduino | Baud rate | Arduino running | Serial monitor at 115200 | Data transmitted correctly | |

---

*Module: RFID Integration | Total: 6 test cases*
