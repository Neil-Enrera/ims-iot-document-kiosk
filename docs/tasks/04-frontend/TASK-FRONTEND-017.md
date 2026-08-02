# TASK-FRONTEND-017 — Responsive Layout & Accessibility

> **Phase:** Frontend
> **Task ID:** TASK-FRONTEND-017
> **Priority:** P1 (High)
> **Status:** Done

---

# Objective

Implement responsive layouts and accessibility improvements across the entire Information Management System to ensure usability on desktop computers, tablets, and the self-service kiosk.

The application must provide an optimal experience for both staff and residents while following accessibility best practices.

---

# Background

This task applies to all frontend modules.

No dedicated backend APIs are required.

The goal is to improve presentation, usability, and accessibility.

---

# Scope

Included

- Responsive Layout
- Adaptive Navigation
- Touch-Friendly Components
- Accessibility (WCAG-inspired)
- Keyboard Navigation
- Focus Management
- Color Contrast
- Screen Reader Support

Not Included

- Native Mobile Application
- Multi-language Accessibility
- Voice Control

---

# Supported Devices

## Desktop

Target Resolution

```
1920×1080

1600×900

1366×768
```

Optimized For

- Staff
- Administrator
- Secretary
- Treasurer

---

## Tablet

Target

```
10–12 inch Touchscreen
```

Optimized For

- Staff
- Kiosk Maintenance

---

## Kiosk

Target

```
21–24 inch Touchscreen

Landscape

Full Screen
```

Optimized For

- Residents

---

## Mobile (Future)

View-only support.

Administrative actions should not be encouraged.

---

# Layout Variants

## Admin Desktop

```
Sidebar

Top Navigation

Dashboard Cards

Large Tables

Dialogs
```

---

## Admin Tablet

```
Collapsed Sidebar

Touch-Friendly Buttons

Responsive Tables
```

---

## Kiosk Full Screen

```
No Sidebar

Large Buttons

Simple Navigation

Large Fonts

High Contrast
```

---

# Responsive Breakpoints

Desktop

```
≥1200px
```

Laptop

```
992–1199px
```

Tablet

```
768–991px
```

Mobile

```
<768px
```

---

# Navigation

Desktop

```
Persistent Sidebar
```

Tablet

```
Collapsible Sidebar
```

Kiosk

```
Wizard-style Navigation

Step Indicators

Back Button

Home Button
```

---

# Tables

Desktop

```
Standard Data Table
```

Tablet

```
Horizontal Scroll
```

Mobile

```
Card View (Future)
```

---

# Forms

Requirements

- Responsive Grid
- Large Input Fields
- Clear Validation Messages
- Consistent Button Placement

---

# Touch Targets

Minimum Size

```
48 x 48 px
```

Used For

- Buttons
- Menu Items
- Cards
- Kiosk Controls

---

# Typography

Minimum Font Sizes

Body

```
16px
```

Kiosk Buttons

```
20–24px
```

Titles

```
28–36px
```

---

# Color & Contrast

Requirements

- High Contrast
- Color is never the only status indicator
- Consistent status colors

Examples

Success

```
Green + Check Icon
```

Warning

```
Orange + Warning Icon
```

Error

```
Red + Error Icon
```

Information

```
Blue + Info Icon
```

---

# Keyboard Accessibility

Support

- Tab Navigation
- Shift + Tab
- Enter
- Escape
- Arrow Keys (where applicable)

Visible focus indicators are required.

---

# Screen Reader Support

Provide

- Labels
- ARIA roles
- ARIA descriptions
- Accessible button text

Avoid icon-only controls without labels.

---

# Images

All informative images

Require

```
Alt Text
```

Decorative images

```
aria-hidden="true"
```

---

# Loading Indicators

Replace blank screens with

- Skeleton Loaders
- Progress Indicators
- Accessible loading announcements

---

# Error Pages

Create

```
403

404

500
```

Each page should include:

- Friendly message
- Return to Dashboard button
- Error illustration (optional)

---

# Components

```
responsive-layout.component

responsive-table.component

accessibility-helper.directive

focus-trap.directive

error-page.component
```

---

# Folder Structure

```
shared/

layout/

responsive/

accessibility/

directives/

focus-trap/

screen-reader/

components/

error-pages/
```

---

# Testing Checklist

Desktop

- [ ] Navigation
- [ ] Tables
- [ ] Forms

Tablet

- [ ] Sidebar
- [ ] Buttons
- [ ] Forms

Kiosk

- [ ] Full-screen layout
- [ ] Touch interaction
- [ ] Large controls
- [ ] Step navigation

Accessibility

- [ ] Keyboard navigation
- [ ] Screen reader labels
- [ ] Focus management
- [ ] Contrast verification

---

# Shared Components Updated

Update

- Navigation
- Data Tables
- Forms
- Cards
- Dialogs
- Snackbar
- Dashboard Widgets

to support responsive layouts.

---

# Acceptance Criteria

- All modules display correctly on supported screen sizes.
- Kiosk interface is fully touch-friendly.
- Navigation adapts to device type.
- Accessibility requirements are implemented.
- Responsive behavior is consistent throughout the application.

---

# Definition of Done

- Responsive layout implemented.
- Accessibility improvements completed.
- All frontend modules verified.
- Ready for Frontend Testing.

---

# Estimated Effort

12–16 hours

---

# Next Task

**TASK-FRONTEND-018 — Frontend Testing & Quality Assurance**

---

# Notes for OpenCode

Before implementing:

1. Use Angular CDK and CSS media queries to manage responsive behavior instead of duplicating pages.
2. Create a dedicated kiosk layout component instead of hiding desktop elements with CSS.
3. Ensure every interactive element is usable with both touch and keyboard navigation.
4. Validate accessibility using automated tools (such as Lighthouse) and manual keyboard testing.
5. Build responsive components once in the shared library so feature modules inherit consistent behavior.

---

# Progress Log

| Date | Author | Update |
|------|--------|--------|
| YYYY-MM-DD | | Task Created |