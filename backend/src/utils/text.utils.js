/**
 * Text utility helper for normalizing user-entered text details to uppercase
 * across the system while preserving email addresses, passwords, tokens, URLs,
 * and binary/file paths.
 */

const PRESERVED_KEYS = new Set([
  'email',
  'email_address',
  'emailaddress',
  'password',
  'password_hash',
  'passwordhash',
  'temporarypassword',
  'temporary_password',
  'newpassword',
  'new_password',
  'currentpassword',
  'current_password',
  'confirmpassword',
  'confirm_password',
  'token',
  'temptoken',
  'temp_token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'idempotencykey',
  'idempotency_key',
  'photo',
  'signature',
  'avatar',
  'profile_picture',
  'qr_code',
  'qr_code_url',
  'template_path',
  'file_path',
  'filepath',
  'attachment',
  'url'
]);

function isPreservedKey(key) {
  if (!key) return false;
  const cleanKey = String(key).toLowerCase().replace(/[-_\s.]/g, '');
  if (PRESERVED_KEYS.has(cleanKey)) return true;
  if (cleanKey.includes('email') || cleanKey.includes('password') || cleanKey.includes('token') || cleanKey.includes('photo') || cleanKey.includes('signature')) {
    return true;
  }
  return false;
}

function toUppercaseText(val) {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (!trimmed) return val;
  // If it's a data URL, base64 string, URL, or valid email pattern, keep original
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return val;
  }
  return val.toUpperCase();
}

function normalizeUppercase(obj) {
  if (!obj || typeof obj !== 'object') {
    return typeof obj === 'string' ? toUppercaseText(obj) : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => normalizeUppercase(item));
  }
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isPreservedKey(key)) {
      result[key] = value;
    } else if (typeof value === 'string') {
      result[key] = toUppercaseText(value);
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      result[key] = normalizeUppercase(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

module.exports = {
  toUppercaseText,
  normalizeUppercase,
  isPreservedKey
};
