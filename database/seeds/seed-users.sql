-- Default admin user
-- Username: admin
-- Password: admin123

INSERT INTO users (role_id, first_name, last_name, username, password_hash, email, status)
VALUES (
    1,
    'System',
    'Administrator',
    'admin',
    '$2b$10$yad/z./yzJlLOcgxI8Qc6urpo9OHjYBZs1WJRoA/xx.5ns1WuJnZG',
    'admin@barangay.gov',
    'ACTIVE'
);
