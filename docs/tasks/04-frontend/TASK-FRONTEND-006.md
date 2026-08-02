# TASK-FRONTEND-006 — User Management Module

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-006
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Develop the User Management Module to allow administrators to manage system users, assign roles, activate or deactivate accounts, and maintain user information.

This module consumes the User Management APIs developed in the backend.

---

# Background

The backend already provides:

```
POST   /api/v1/users
GET    /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
PATCH  /api/v1/users/:id/status
PATCH  /api/v1/users/:id/password
DELETE /api/v1/users/:id
```

Only administrators should have access to this module.

---

# Scope

Included

- User List
- Create User
- View User Details
- Edit User
- Change Password
- Activate / Deactivate User
- Search
- Filters
- Pagination

Not Included

- User Profile (Current User)
- Login
- Permission Matrix

---

# User Roles

Supported roles:

```
Administrator

Secretary

Treasurer

Staff
```

---

# Navigation

```
Sidebar

↓

Administration

↓

User Management
```

Route

```
/users
```

---

# Pages

## User List

Displays

- Full Name
- Username
- Email
- Role
- Status
- Last Login
- Created Date

Actions

- View
- Edit
- Change Password
- Activate / Deactivate
- Delete

---

## Create User

Fields

- First Name
- Middle Name (Optional)
- Last Name
- Username
- Email
- Password
- Confirm Password
- Role
- Status

Buttons

```
Save

Cancel
```

---

## User Details

Display

- Personal Information
- Role
- Status
- Account Created
- Last Login

---

## Edit User

Editable

- Name
- Username
- Email
- Role
- Status

Not Editable

- User ID

---

## Change Password

Fields

- New Password
- Confirm Password

---

# UI Layout

```
+-------------------------------------------------------------+

User Management

[ Add User ]

---------------------------------------------------------------

Search

Role Filter

Status Filter

---------------------------------------------------------------

| Name | Username | Role | Status | Actions |

---------------------------------------------------------------

Pagination

```

---

# Search & Filters

Search

- Name
- Username
- Email

Filters

- Role
- Status

Sorting

- Name
- Date Created
- Last Login

---

# Validation

Required

- Username
- Email
- Password
- Role

Email

- Valid format

Password

- Minimum length
- Complexity (according to backend validation)

---

# Components

```
user-list.component

user-form.component

user-detail.component

change-password-dialog.component

user-status-badge.component
```

---

# Folder Structure

```
features/

users/

pages/

list/

create/

edit/

detail/

components/

user-table/

user-form/

password-dialog/

services/

user.facade.ts
```

---

# User Service Methods

```
getUsers()

getUser()

createUser()

updateUser()

deleteUser()

changePassword()

updateStatus()
```

---

# Role-Based Access

Only

```
Administrator
```

may access:

- Create User
- Edit User
- Delete User
- Change Password
- Activate / Deactivate

Other roles should be redirected to an Unauthorized page.

---

# User Experience

Delete

Show confirmation dialog.

Deactivate

Warn if the user currently has an active session.

Create

Display success snackbar.

---

# Loading State

Display

- Skeleton Table
- Skeleton Form

---

# Error Handling

Duplicate Username

```
Username already exists.
```

Duplicate Email

```
Email already exists.
```

Server Error

```
Unable to save user.
```

---

# Shared Components Used

- Data Table
- Search Bar
- Pagination
- Status Badge
- Confirmation Dialog
- Snackbar
- Loading Skeleton

---

# Responsive Design

Desktop

- Full table layout

Tablet

- Compact table

Mobile (Optional)

- Card layout

---

# Implementation Checklist

- [ ] Build User List page
- [ ] Build Create User page
- [ ] Build Edit User page
- [ ] Build User Detail page
- [ ] Build Change Password dialog
- [ ] Connect User APIs
- [ ] Implement search
- [ ] Implement filters
- [ ] Implement pagination
- [ ] Handle loading and errors
- [ ] Enforce role-based access

---

# Verification

Administrator

Can

- View users
- Create users
- Update users
- Delete users

Secretary

Cannot access `/users`.

Duplicate username

Displays validation error.

All API operations complete successfully.

---

# Acceptance Criteria

- User CRUD operations function correctly.
- Search, filters, and pagination work.
- Role restrictions are enforced.
- UI follows the shared design system.
- API integration is complete.

---

# Definition of Done

- User Management module completed.
- Backend integration verified.
- Responsive layout tested.
- Ready for Resident Management.

---

# Estimated Effort

8–10 hours

---

# Next Task

**TASK-FRONTEND-007 — Resident Management Module**

---

# Notes for OpenCode

Before implementing:

1. Reuse the shared data table, form controls, dialogs, and status badges from the Design System.
2. Implement optimistic UI updates where appropriate (for example, updating a user's status after successful API confirmation).
3. Keep form validation synchronized with backend validation rules to avoid inconsistent behavior.
4. Protect the entire module using the Role Guard for `Administrator`.
5. Ensure destructive actions (delete, deactivate) always require confirmation.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |