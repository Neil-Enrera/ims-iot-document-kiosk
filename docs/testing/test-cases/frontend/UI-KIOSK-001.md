# Frontend UI Test Cases — Kiosk

> **Module:** Kiosk Interface
> **Type:** UI Testing

---

| Test ID | Module | Feature | Preconditions | Steps | Expected Result | Status |
|---------|--------|---------|---------------|-------|-----------------|--------|
| UI-KIOSK-001 | Kiosk | Idle screen | Kiosk loaded | Wait for load | Welcome/search screen displayed | |
| UI-KIOSK-002 | Kiosk | Resident search | On kiosk | Type resident name | Filtered results displayed | |
| UI-KIOSK-003 | Kiosk | Select resident | Search results shown | Click on resident | Welcome screen with resident info | |
| UI-KIOSK-004 | Kiosk | Service selection | Resident selected | View services | Service cards displayed | |
| UI-KIOSK-005 | Kiosk | Select service | Services shown | Click on service | Requirements displayed | |
| UI-KIOSK-006 | Kiosk | Photo capture | Service selected | Click capture button | Camera preview shown | |
| UI-KIOSK-007 | Kiosk | Review request | Photo captured | Click next | Review screen with all details | |
| UI-KIOSK-008 | Kiosk | Submit request | Review shown | Click submit | Request created, success screen | |
| UI-KIOSK-009 | Kiosk | Return to idle | Success shown | Wait or click return | Back to idle/search screen | |
| UI-KIOSK-010 | Kiosk | Simulation panel | Kiosk loaded | Click simulation button | Hardware simulation controls shown | |

---

*Module: Kiosk UI | Total: 10 test cases*
