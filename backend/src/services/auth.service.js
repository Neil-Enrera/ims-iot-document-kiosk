const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/auth.repository');
const config = require('../config/environment');

const login = async (username, password) => {
  const user = await authRepository.findByUsername(username);
  if (!user) {
    return { success: false, message: 'Invalid username or password.' };
  }

  if (user.status !== 'ACTIVE') {
    return { success: false, message: 'Account is inactive.' };
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return { success: false, message: 'Invalid username or password.' };
  }

  await authRepository.updateLastLogin(user.user_id);

  const token = jwt.sign(
    { userId: user.user_id, username: user.username, role: user.role_name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const { password_hash: _, ...userData } = user;

  return {
    success: true,
    message: 'Login successful.',
    data: { accessToken: token, user: userData }
  };
};

const getMe = async (userId) => {
  const user = await authRepository.findById(userId);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }
  return { success: true, message: 'User retrieved successfully.', data: user };
};

module.exports = { login, getMe };
