# 14. Development Workflow

## 1. Purpose

The Development Workflow defines the methodology, tools, and processes used to develop the Information Management System with IoT-Assisted Document Request Services Kiosk. It provides a structured approach for planning, developing, testing, and maintaining the system while promoting collaboration among team members.

The workflow ensures that project requirements are implemented efficiently and that changes requested by the client or project advisers can be incorporated throughout the development process.

---

# 2. Development Methodology

The project follows the **Agile Development Methodology**, specifically an iterative approach. Development is divided into multiple iterations, where each cycle focuses on implementing, testing, and refining a set of features.

This methodology allows the development team to:

- Deliver functional features incrementally.
- Respond to client and adviser feedback.
- Identify and resolve issues early.
- Continuously improve the quality of the system.

### Agile Development Cycle

1. Requirements Analysis
2. System Design
3. Development
4. Testing
5. Client Feedback
6. Revision
7. Deployment

---

# 3. Development Environment

The following technologies and tools will be used throughout the project.

| Category | Technology |
|----------|------------|
| Frontend | Angular |
| Backend | Node.js with Express.js |
| Database | MySQL |
| Version Control | Git |
| Repository Hosting | GitHub |
| API Testing | Postman |
| Code Editor | Visual Studio Code |
| Local Development | XAMPP / MySQL Server |
| Package Manager | npm |

---

# 4. Version Control

Git will be used to manage the project's source code.

Version control provides:

- Change tracking
- Collaboration among team members
- Code history
- Rollback capability
- Branch management

The project repository will be hosted on GitHub.

---

# 5. Branching Strategy

To maintain a stable codebase, the project will follow a simple branching strategy.

| Branch | Purpose |
|---------|----------|
| main | Production-ready code |
| develop | Integration of completed features |
| feature/* | Development of individual features |
| bugfix/* | Fixes for identified issues |

Each completed feature should be reviewed and tested before being merged into the **develop** branch. After successful testing, the changes will be merged into the **main** branch.

---

# 6. Development Process

The development process consists of the following stages:

### Stage 1 – Planning

- Review project requirements.
- Finalize system design.
- Prepare database structure.
- Assign development tasks.

### Stage 2 – Frontend Development

Develop the Angular user interfaces, including:

- Resident kiosk interface
- Administrator dashboard
- Document request forms
- Reports

### Stage 3 – Backend Development

Develop the Node.js REST API, including:

- Authentication
- Resident management
- Request management
- Payment recording
- Document release
- Report generation

### Stage 4 – Database Development

Implement the MySQL database based on the approved Entity Relationship Diagram (ERD).

### Stage 5 – Hardware Integration

Integrate the RFID reader, webcam, and touchscreen with the kiosk application.

### Stage 6 – Testing

Perform:

- Functional Testing
- Integration Testing
- Hardware Testing
- User Acceptance Testing

### Stage 7 – Deployment

Deploy the completed system to the barangay environment and conduct final validation.

---

# 7. Coding Standards

To improve maintainability and readability, the development team will follow these coding standards:

- Use meaningful variable and function names.
- Apply consistent naming conventions.
- Write modular and reusable code.
- Include comments for complex logic.
- Follow Angular and Node.js best practices.
- Perform code reviews before merging changes.

---

# 8. Team Collaboration

The development team will collaborate through:

- Regular progress meetings.
- Shared GitHub repository.
- Task assignment and monitoring.
- Documentation updates.
- Continuous communication during development.

---

# 9. Risk Management

Potential development risks include:

| Risk | Mitigation Strategy |
|------|----------------------|
| Hardware compatibility issues | Perform early hardware testing. |
| Database errors | Conduct regular backups and validation. |
| Software bugs | Perform continuous testing and debugging. |
| Requirement changes | Use Agile iterations to accommodate revisions. |
| Integration failures | Test modules incrementally before deployment. |

---

# 10. Deliverables

The development workflow will produce the following outputs:

- Angular Frontend Application
- Node.js Backend API
- MySQL Database
- RFID Integration Module
- Webcam Integration Module
- System Documentation
- User Manual
- Final Capstone System

---

# 11. Summary

The Development Workflow provides a structured approach for designing, developing, testing, and deploying the Information Management System. By following an Agile methodology, utilizing version control, and applying coding standards, the development team can efficiently deliver a reliable, maintainable, and scalable solution for Barangay San Manuel.