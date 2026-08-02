# Frontend UI Test Cases — Authentication

> **Module:** Authentication
> **Type:** UI Testing

---

| Test ID | Module | Feature | Preconditions | Steps | Expected Result | Status |
|---------|--------|---------|---------------|-------|-----------------|--------|
| UI-AUTH-001 | Login | Valid login | On login page | Enter `admin` / `admin123`, click Login | Redirects to dashboard | |
| UI-AUTH-002 | Login | Invalid credentials | On login page | Enter `admin` / `wrong`, click Login | Error message displayed | |
| UI-AUTH-003 | Login | Empty form submission | On login page | Click Login without entering data | Validation errors shown | |
| UI-AUTH-004 | Login | Form validation | On login page | Submit with empty username | Username required message | |
| UI-AUTH-005 | Logout | Session end | Logged in | Click Logout | Redirects to login page | |
| UI-AUTH-006 | Session | Token storage | Successful login | Check localStorage | JWT token stored | |

---

*Module: Authentication UI | Total: 6 test cases*
