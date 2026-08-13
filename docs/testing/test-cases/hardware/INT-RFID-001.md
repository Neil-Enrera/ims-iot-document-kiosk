# Hardware Test Cases — RFID Integration

> **Module:** RFID Integration
> **Type:** Hardware Testing

---

| Test ID | Hardware | Scenario | Preconditions | Steps | Expected Result | Status |
|---------|----------|----------|---------------|-------|-----------------|--------|
| INT-RFID-001 | RFID Reader | Valid card scan | ESP8266 connected, TEST001 registered | Tap TEST001 card | UID transmitted, resident identified | |
| INT-RFID-002 | RFID Reader | Invalid card scan | ESP8266 connected | Tap unknown card | "Card not registered" message | |
| INT-RFID-003 | RFID Reader | Multiple consecutive scans | ESP8266 connected | Tap card 5 times rapidly | Each scan processed correctly | |
| INT-RFID-004 | ESP8266 | Serial connection | ESP8266 connected via USB | Check COM port | COM port detected, serial active | |
| INT-RFID-005 | ESP8266 | Auto-reconnect | ESP8266 connected | Unplug and replug USB | Connection re-established | |
| INT-RFID-006 | ESP8266 | Baud rate | ESP8266 running | Serial monitor at 9600 | Data transmitted correctly | |

---

*Module: RFID Integration | Total: 6 test cases*
