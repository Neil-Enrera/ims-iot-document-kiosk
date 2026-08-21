const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const authService = require('../src/services/auth.service');
const pool = require('../src/config/database');

async function testWorkflow() {
  console.log('--- STARTING PASSWORD RESET WORKFLOW TESTS ---');

  // Test 1: Non-existent email (should still return generic success message)
  const nonExistentRes = await authService.forgotPassword('nonexistent@example.com');
  console.log('1. Non-existent email request:', nonExistentRes);
  if (!nonExistentRes.success) throw new Error('Test 1 failed');

  // Test 2: Valid email request (for admin@sanmanuel.gov.ph or admin)
  // Let's ensure admin user has email
  const [users] = await pool.query('SELECT * FROM users WHERE username = ?', ['admin']);
  if (users.length === 0) {
    console.log('Admin user not found, inserting test user...');
    await pool.query(
      'INSERT INTO users (role_id, first_name, last_name, username, password_hash, email, status) VALUES (1, "Admin", "User", "admin", "$2b$10$abcdef", "admin@sanmanuel.gov.ph", "ACTIVE")'
    );
  } else if (!users[0].email) {
    await pool.query('UPDATE users SET email = "admin@sanmanuel.gov.ph" WHERE username = "admin"');
  }

  const validForgotRes = await authService.forgotPassword('admin@sanmanuel.gov.ph');
  console.log('2. Valid email forgot password request:', validForgotRes);
  if (!validForgotRes.success) throw new Error('Test 2 failed');

  // Fetch generated code from database
  const [resets] = await pool.query(
    'SELECT * FROM password_resets WHERE email = "admin@sanmanuel.gov.ph" AND used_at IS NULL ORDER BY reset_id DESC LIMIT 1'
  );
  if (resets.length === 0) throw new Error('No reset record created in DB');
  const code = resets[0].verification_code;
  console.log('Fetched generated verification code from DB:', code);

  // Test 3: Invalid code verification
  const invalidCodeRes = await authService.verifyResetCode('admin@sanmanuel.gov.ph', '000000');
  console.log('3. Invalid code verification result:', invalidCodeRes);
  if (invalidCodeRes.success) throw new Error('Test 3 failed: accepted invalid code');

  // Test 4: Valid code verification
  const validCodeRes = await authService.verifyResetCode('admin@sanmanuel.gov.ph', code);
  console.log('4. Valid code verification result:', validCodeRes);
  if (!validCodeRes.success || !validCodeRes.data?.resetToken) throw new Error('Test 4 failed');
  const resetToken = validCodeRes.data.resetToken;

  // Test 5: Reset password with short password (< 6 chars)
  const shortPassRes = await authService.resetPassword('admin@sanmanuel.gov.ph', resetToken, '123');
  console.log('5. Short password test result:', shortPassRes);
  if (shortPassRes.success) throw new Error('Test 5 failed: accepted short password');

  // Test 6: Reset password with valid new password
  const newPassword = 'NewSecurePassword123!';
  const resetSuccessRes = await authService.resetPassword('admin@sanmanuel.gov.ph', resetToken, newPassword);
  console.log('6. Valid password reset result:', resetSuccessRes);
  if (!resetSuccessRes.success) throw new Error('Test 6 failed');

  // Test 7: Verify token reuse is blocked
  const reUseTokenRes = await authService.resetPassword('admin@sanmanuel.gov.ph', resetToken, 'AnotherPassword123!');
  console.log('7. Re-use token test result:', reUseTokenRes);
  if (reUseTokenRes.success) throw new Error('Test 7 failed: allowed token reuse');

  // Test 8: Login with new password
  const loginRes = await authService.login('admin', newPassword);
  console.log('8. Login with new password result:', loginRes.success, loginRes.message);
  if (!loginRes.success) throw new Error('Test 8 failed: could not login with new password');

  // Reset password back to standard dev password 'admin123' so admin credentials remain known
  const defaultResetToken = 'temp_default_token';
  const bcrypt = require('bcrypt');
  const defaultHash = await bcrypt.hash('admin123', 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE username = "admin"', [defaultHash]);
  console.log('Reset admin password back to default "admin123".');

  console.log('--- ALL BACKEND PASSWORD RESET TESTS PASSED! ---');
  await pool.end();
}

testWorkflow().catch(err => {
  console.error('Test workflow failed:', err);
  process.exit(1);
});
