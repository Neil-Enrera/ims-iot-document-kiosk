# Hardware Test Cases — Printer Integration

> **Module:** Printer Integration
> **Type:** Hardware Testing

---

| Test ID | Hardware | Scenario | Preconditions | Steps | Expected Result | Status |
|---------|----------|----------|---------------|-------|-----------------|--------|
| INT-PRINT-001 | Printer | Test print | Printer connected | Send test print | Queue slip printed | |
| INT-PRINT-002 | Printer | Queue slip format | Printer connected | Submit request | Queue slip with correct info printed | |
| INT-PRINT-003 | Printer | Printer offline | Printer disconnected | Submit request | "Printer offline" message | |
| INT-PRINT-004 | Printer | Paper empty | Printer connected, no paper | Submit request | "Paper empty" message | |

---

*Module: Printer Integration | Total: 4 test cases*
