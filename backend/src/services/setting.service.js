const settingRepository = require('../repositories/setting.repository');

const getAll = async () => {
  const settings = await settingRepository.findAll();
  const grouped = settings.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});
  return { success: true, message: 'Settings retrieved successfully.', data: grouped };
};

const getByCategory = async (category) => {
  const settings = await settingRepository.findByCategory(category);
  return { success: true, message: 'Settings retrieved successfully.', data: settings };
};

const getByKey = async (key) => {
  const setting = await settingRepository.findByKey(key);
  if (!setting) return { success: false, message: 'Setting not found.' };
  return { success: true, message: 'Setting retrieved successfully.', data: setting };
};

const updateSetting = async (key, value, userId) => {
  const setting = await settingRepository.findByKey(key);
  if (!setting) return { success: false, message: 'Setting not found.' };
  if (setting.is_readonly) return { success: false, message: 'This setting is read-only.' };
  await settingRepository.update(key, value, userId);
  return { success: true, message: 'Setting updated successfully.' };
};

module.exports = { getAll, getByCategory, getByKey, updateSetting };
