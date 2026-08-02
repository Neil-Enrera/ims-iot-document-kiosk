# Security Test Cases

> **Module:** Security Testing
> **Type:** Security Testing

---

| Test ID | Security Area | Scenario | Preconditions | Steps | Expected Result | Status |
|---------|---------------|----------|---------------|-------|-----------------|--------|
| SEC-AUTH-001 | Authentication | Valid login | User exists | Login with correct credentials | JWT token issued | |
| SEC-AUTH-002 | Authentication | Invalid login | None | Login with wrong password | 401 Unauthorized | |
| SEC-AUTH-003 | Authorization | Admin access | Logged in as Admin | Access /users | Access granted | |
| SEC-AUTH-004 | Authorization | Secretary access | Logged in as Secretary | Access /users | 403 Forbidden | |
| SEC-AUTH-005 | Authorization | No token | Not logged in | Access /residents | 401 Unauthorized | |
| SEC-AUTH-006 | Session | Token expiration | Token is expired | Make API call | 401, token expired | |
| SEC-AUTH-007 | Session | Logout | Logged in | Call logout | Session invalidated | |
| SEC-AUTH-008 | Input | SQL injection | On login page | Enter `' OR '1'='1` in username | Rejected, no SQL error | |
| SEC-AUTH-009 | Input | XSS prevention | On any form | Enter `<script>alert('xss')</script>` | Script not executed | |
| SEC-AUTH-010 | File upload | Invalid file type | On upload form | Upload `.exe` file | Rejected | |
| SEC-AUTH-011 | File upload | Valid file type | On upload form | Upload `.jpg` file | Accepted | |
| SEC-AUTH-012 | Kiosk | Kiosk cannot access admin | On kiosk | Try to access `/dashboard` | Redirected to kiosk page | |
| SEC-AUTH-013 | RFID | Invalid card | On kiosk | Scan unregistered card | "Card not registered" message | |
| SEC-AUTH-014 | Audit | Login logged | Admin logs in | Check audit logs | Login event recorded | |

---

*Module: Security | Total: 14 test cases*
