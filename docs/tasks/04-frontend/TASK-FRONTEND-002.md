# TASK-FRONTEND-002 — Design System & Shared UI Components

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-002
> **Priority:** P0 (Critical)
> **Status:** Done

---

# Objective

Design and implement a reusable Design System that provides consistent UI components, layouts, typography, colors, spacing, icons, and interactions across the Information Management System.

This Design System will serve both:

- Staff Information Management System
- Future IoT-Assisted Kiosk Interface

---

# Background

Instead of every module creating its own buttons, tables, forms, and dialogs, all UI elements should come from one centralized library.

Benefits include:

- Consistent UI
- Easier maintenance
- Faster development
- Better accessibility
- Easier theme customization

---

# Design Principles

The interface should be:

- Clean
- Professional
- Government-friendly
- Accessible
- Responsive
- Minimal

---

# Design Language

Style

```text
Modern Admin Dashboard
```

Influences

- Angular Material
- Google Material Design 3
- Government Service Portal

---

# Technology

UI Library

```text
Angular Material
```

Styling

```text
Tailwind CSS
```

Icons

```text
Material Symbols
```

Animations

```text
Angular Animations
```

---

# Theme

Primary

```text
Blue
```

Secondary

```text
White
```

Accent

```text
Green
```

Error

```text
Red
```

Warning

```text
Orange
```

Information

```text
Light Blue
```

Background

```text
Light Gray
```

---

# Typography

Headings

```text
Bold
```

Body

```text
Regular
```

Use one font family throughout the application (for example, Roboto, which aligns well with Angular Material).

---

# Spacing

Use an 8-point spacing system.

Examples

```text
8px

16px

24px

32px

40px
```

---

# Shared Components

## Buttons

```text
Primary Button

Secondary Button

Success Button

Danger Button

Icon Button

Text Button
```

---

## Cards

```text
Information Card

Dashboard Card

Statistics Card

Resident Card
```

---

## Tables

Reusable Data Table

Supports

- Sorting
- Pagination
- Search
- Filters
- Empty State
- Loading State

---

## Forms

Reusable Controls

```text
Text Box

Text Area

Dropdown

Date Picker

Checkbox

Radio Button

Switch

Password Field

File Upload

Image Upload
```

---

## Dialogs

Reusable

```text
Confirmation Dialog

Delete Dialog

Success Dialog

Error Dialog

Information Dialog
```

---

## Navigation

```text
Sidebar

Top Navigation

Breadcrumb

User Menu
```

---

## Indicators

```text
Loading Spinner

Skeleton Loader

Progress Bar

Status Badge

Notification Badge
```

---

## Feedback Components

```text
Snackbar

Toast

Alert

Empty State

No Internet Banner
```

---

## Search Components

```text
Search Bar

Filter Panel

Advanced Search

Date Filter
```

---

## Dashboard Widgets

```text
Statistics Card

Activity Card

Chart Card

Summary Card
```

---

# Folder Structure

```text
shared/

components/

button/

card/

table/

dialog/

form/

navbar/

sidebar/

pagination/

search/

spinner/

status-badge/

empty-state/

toast/

loading/

chart-card/
```

---

# Layout Components

```text
Main Layout

Authentication Layout

Blank Layout

Kiosk Layout (future)
```

---

# Component Standards

Every reusable component should support:

- Inputs
- Outputs
- Accessibility
- Dark mode compatibility (future)
- Responsive layout

---

# Accessibility

Support

- Keyboard navigation
- Screen readers
- Proper labels
- Focus indicators
- Color contrast

---

# Responsive Breakpoints

Desktop

```text
≥1200px
```

Laptop

```text
992–1199px
```

Tablet

```text
768–991px
```

Mobile

```text
<768px
```

---

# File Structure

```text
shared/

components/

button/

button.component.ts

button.component.html

button.component.scss

table/

table.component.ts

table.component.html

table.component.scss

dialog/

search/

spinner/

...
```

---

# Storybook (Optional)

Consider integrating Storybook later to document and test reusable UI components independently.

---

# Implementation Checklist

- [ ] Configure Angular Material theme
- [ ] Configure Tailwind CSS
- [ ] Create button components
- [ ] Create card components
- [ ] Create reusable table
- [ ] Create dialog components
- [ ] Create form controls
- [ ] Create loading components
- [ ] Create navigation components
- [ ] Create dashboard widgets
- [ ] Verify responsiveness
- [ ] Verify accessibility

---

# Verification

The application should display:

- Reusable buttons
- Reusable cards
- Responsive data table
- Dialog examples
- Form examples
- Loading indicators

without code duplication.

---

# Acceptance Criteria

- Shared UI components implemented.
- Components are reusable.
- Theme is consistent.
- Responsive behavior verified.
- Accessibility guidelines followed.

---

# Definition of Done

- Design System completed.
- Shared component library established.
- Ready for API integration and feature development.

---

# Estimated Effort

8–10 hours

---

# Next Task

**TASK-FRONTEND-003 — API Service Layer**

---

# Notes for OpenCode

Before implementing:

1. Build reusable components before feature-specific pages.
2. Wrap Angular Material components to enforce a consistent design language.
3. Keep feature modules free from duplicated UI code.
4. Document component inputs and outputs for reuse.
5. Design components with future kiosk support in mind (larger touch targets, scalable layouts).

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |