const bcrypt = require('bcrypt');
const userRepository = require('../repositories/user.repository');

const SALT_ROUNDS = 10;

const getAllUsers = async ({ search, status, page = 1, limit = 20, sortBy = 'user_id', sortOrder = 'ASC' }) => {
  const result = await userRepository.findAll({ search, status, page, limit, sortBy, sortOrder });
  return { success: true, message: 'Users retrieved successfully.', data: result };
};

const getUserById = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }
  return { success: true, message: 'User retrieved successfully.', data: user };
};

const createUser = async (userData) => {
  const existing = await userRepository.findByUsername(userData.username);
  if (existing) {
    return { success: false, message: 'Username already exists.' };
  }

  const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);
  let userId;
  try {
    userId = await userRepository.create({ ...userData, passwordHash });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return { success: false, message: 'Invalid role ID.' };
    }
    throw err;
  }
  const user = await userRepository.findById(userId);

  return { success: true, message: 'User created successfully.', data: user };
};

const updateUser = async (userId, userData) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  await userRepository.update(userId, userData);
  const updated = await userRepository.findById(userId);

  return { success: true, message: 'User updated successfully.', data: updated };
};

const changeStatus = async (userId, status) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  await userRepository.updateStatus(userId, status);
  const updated = await userRepository.findById(userId);

  return { success: true, message: 'User status updated successfully.', data: updated };
};

const changePassword = async (userId, newPassword) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userRepository.updatePassword(userId, passwordHash);

  return { success: true, message: 'Password updated successfully.', data: null };
};

const deleteUser = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  await userRepository.remove(userId);

  return { success: true, message: 'User deleted successfully.', data: null };
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, changeStatus, changePassword, deleteUser };
