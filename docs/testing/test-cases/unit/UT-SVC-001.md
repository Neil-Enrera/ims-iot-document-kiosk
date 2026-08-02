# Unit Test Cases — Service Management

> **Module:** Service Management
> **Type:** Unit Testing

---

| Test ID | Function | Preconditions | Input | Expected Output | Status |
|---------|----------|---------------|-------|-----------------|--------|
| UT-SVC-001 | Create service with valid data | None | Valid service object | Service created, status 201 | |
| UT-SVC-002 | Get all services | Services exist | `GET /services` | Array of services, status 200 | |
| UT-SVC-003 | Get active services only | Some services inactive | `GET /services` | Only active services returned | |
| UT-SVC-004 | Get service by ID | Service ID 1 exists | `GET /services/1` | Service object, status 200 | |
| UT-SVC-005 | Update service | Service ID 1 exists | Valid update data | Service updated, status 200 | |
| UT-SVC-006 | Delete service | Service ID 5 exists, no requests | `DELETE /services/5` | Service deleted, status 200 | |
| UT-SVC-007 | Toggle service status | Service ID 1 exists | `PUT /services/1/status` | Status toggled, status 200 | |
| UT-SVC-008 | Create service with duplicate name | Name exists | Same name | Conflict error, status 409 | |

---

*Module: Service Management | Total: 8 test cases*
