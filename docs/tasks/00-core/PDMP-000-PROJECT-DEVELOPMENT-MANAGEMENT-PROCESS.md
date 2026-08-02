# PDMP-000 — Project Development Management Process (PDMP)

> **Project:** Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel

**Version:** 2.0.0  
**Status:** Active  
**Last Updated:** YYYY-MM-DD

---

# Purpose

The Project Development Management Process (PDMP) defines the engineering workflow for developing the **Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel**.

This document serves as the primary development guide for both the development team and AI coding assistants (such as OpenCode). It establishes a consistent framework for planning, implementing, testing, reviewing, and documenting the project.

The objective is to build software systematically—not through assumptions.

---

# Core Philosophy

> **Build with clarity before complexity. Design before implementation. Verify before completion. Document throughout the process.**

The goal is not simply to build software quickly.

The goal is to build software that is:

- Reliable
- Maintainable
- Scalable
- Testable
- Easy for humans to understand
- Easy for AI assistants to extend

---

# Development Workflow

```text
Requirement
      │
      ▼
Clarify Scope
      │
      ▼
Architecture & Design
      │
      ▼
Task Breakdown
      │
      ▼
Implementation
      │
      ▼
Testing
      │
      ▼
Review
      │
      ▼
Documentation Update
      │
      ▼
Merge / Complete
```

Every feature must follow this workflow.

Skipping steps introduces unnecessary technical debt and increases the likelihood of defects.

---

# 1. Clarify Before Building

Every feature begins with clarification.

Requirements, expected behavior, scope, and edge cases must be clearly understood before implementation begins.

Early clarification prevents:

- Miscommunication
- Scope creep
- Incorrect assumptions
- Avoidable rework

Time spent understanding the problem is more valuable than rushing into implementation.

---

## Definition of Ready

A task is ready for implementation only when:

- Requirements are clearly defined.
- Scope boundaries are established.
- Business rules are identified.
- Acceptance criteria are written.
- Dependencies are known.
- Required diagrams are prepared or updated.
- Risks and assumptions are documented.

If any of these are missing, the task should remain in the planning stage.

---

# 2. Break Work Into Small, Focused Tasks

Large features should never be implemented as one large task.

Instead, break them into small, independent units.

Each task must include:

- Clear objective
- Defined scope
- Acceptance criteria
- Definition of Done

Smaller tasks are easier to:

- Review
- Test
- Debug
- Maintain
- Roll back

Every completed task should be independently verifiable before moving to the next one.

---

# 3. Architecture Before Code

Architecture is designed before implementation.

Diagrams provide a clearer understanding of the system than source code alone.

Architecture documentation may include:

- System Architecture
- ER Diagram
- Flowchart
- Sequence Diagram
- State Diagram
- Module Dependency Diagram
- Deployment Diagram

Architecture diagrams help identify:

- Missing validations
- Weak system boundaries
- Hidden dependencies
- Unnecessary complexity
- Data flow issues
- Potential scalability problems

Good architecture reduces implementation errors.

---

# 4. UI/UX Is Planned, Not Improvised

The user interface is designed intentionally—not generated through vague prompts such as "make it modern."

Before implementation, define:

- Page structure
- Information architecture
- Visual hierarchy
- Component layout
- Navigation
- Spacing
- Responsive behavior
- User interactions
- Accessibility considerations

Good UI is organized, intuitive, and functional—not merely decorative.

---

# 5. Quality First

Quality is never an afterthought.

Depending on the feature, either:

- Write new tests before implementation (when appropriate), or
- Update existing tests alongside implementation.

Every meaningful change must be verified before completion.

Testing includes:

- Unit Testing
- Integration Testing (when applicable)
- End-to-End Testing
- Build Verification
- Manual Validation

No feature should be considered complete simply because it compiles successfully.

---

## Definition of Done

A task is complete only when:

- All acceptance criteria are satisfied.
- Required tests pass.
- Build verification succeeds.
- Code follows project standards.
- Documentation is updated.
- Related diagrams are updated when necessary.
- No known critical issues remain.

Only then may the task be marked as complete.

---

# 6. Continuous Documentation

Documentation evolves together with the system.

Every significant implementation should update the appropriate documentation.

Documentation may include:

- Requirements
- Design decisions
- Architecture diagrams
- API documentation
- Database changes
- Hardware integration
- Known limitations
- Future improvements

Documentation should always reflect the current state of the project.

---

# 7. Incremental Progress

Development is iterative.

Each iteration follows the same process:

1. Define the requirement.
2. Clarify the scope.
3. Design the architecture.
4. Break work into manageable tasks.
5. Implement the feature.
6. Test thoroughly.
7. Review the implementation.
8. Update documentation.
9. Proceed to the next verified task.

Incremental development minimizes technical debt while maintaining predictable progress.

---

# 8. Single Source of Truth

Each category of information should have one authoritative location.

| Information | Primary Source |
|-------------|----------------|
| Requirements | Task Specification |
| Architecture | PROJECT-ARCHITECTURE.md |
| Roadmap | PROJECT-ROADMAP.md |
| Database Schema | Database Documentation |
| API Contracts | Backend Tasks |
| UI Behavior | Frontend Tasks |
| Hardware Integration | Hardware Tasks |
| Development Standards | PROJECT-DEVELOPMENT-GUIDE.md |

Avoid duplicating information across multiple documents.

When information changes, update the authoritative source.

---

# 9. AI Collaboration

AI coding assistants are development partners—not decision makers.

Before implementing a feature, AI should:

- Read the current task.
- Review related architecture diagrams.
- Understand dependencies.
- Follow project coding standards.
- Respect project scope.

AI should **not**:

- Expand project scope.
- Redesign unrelated modules.
- Modify completed features without justification.
- Introduce new technologies without approval.
- Ignore documented business rules.

The PDMP exists to provide AI with consistent engineering context throughout development.

---

# Version Control

Major project milestones should update:

- CHANGELOG.md
- Related task documents
- Architecture diagrams
- API documentation (if applicable)

Every significant engineering decision should be traceable.

---

# PDMP Success Criteria

The PDMP is successful when:

- Developers can understand the project quickly.
- AI assistants can implement features with minimal prompting.
- New contributors can navigate the project efficiently.
- Every feature is traceable from requirement to implementation.
- Documentation accurately reflects the current system.

---

# Guiding Principle

> **Clarity before complexity. Architecture before implementation. Quality before completion. Documentation throughout the process.**

The PDMP is not created to produce documentation.

It is created to produce better software.