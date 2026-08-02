# Hardware Test Cases — Camera Integration

> **Module:** Camera Integration
> **Type:** Hardware Testing

---

| Test ID | Hardware | Scenario | Preconditions | Steps | Expected Result | Status |
|---------|----------|----------|---------------|-------|-----------------|--------|
| INT-CAM-001 | Webcam | Camera detection | USB webcam connected | Open kiosk camera | Camera detected, preview shown | |
| INT-CAM-002 | Webcam | Photo capture | Camera detected | Click capture button | Photo captured successfully | |
| INT-CAM-003 | Webcam | Image upload | Photo captured | Submit request | Image uploaded to backend | |
| INT-CAM-004 | Webcam | Camera not available | No webcam connected | Open kiosk camera | Graceful error message | |

---

*Module: Camera Integration | Total: 4 test cases*
