/**
 * Input Validation & Sanitization
 * 
 * Prevents malicious input and enforces consistent validation across the app
 */

export type ValidationResult = {
  valid: boolean;
  error?: string;
  value?: string;
};

/**
 * Validate and sanitize username
 * - Must be alphanumeric with underscore/hyphen only
 * - Length: 3-30 characters
 */
export function validateUsername(value: unknown): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Username ต้องเป็นข้อความ' };
  }

  const trimmed = value.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Username ต้องมีอย่างน้อย 3 ตัวอักษร' };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Username ต้องไม่เกิน 30 ตัวอักษร' };
  }

  // Allow alphanumeric, underscore, hyphen only
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: 'Username สามารถมีตัวอักษร ตัวเลข _ และ - เท่านั้น' };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate title/name field
 * - No leading/trailing spaces
 * - Length: 1-200 characters
 * - No SQL injection patterns
 */
export function validateTitle(value: unknown): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: 'ชื่อต้องเป็นข้อความ' };
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'ชื่อต้องระบุ' };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: 'ชื่อต้องไม่เกิน 200 ตัวอักษร' };
  }

  // Check for SQL injection patterns (basic check)
  if (/['"];?\s*(DROP|DELETE|INSERT|UPDATE|SELECT|EXEC|UNION)/i.test(trimmed)) {
    return { valid: false, error: 'ชื่อมีลักษณะที่ไม่ปลอดภัย' };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate email-like input
 */
export function validateEmail(value: unknown): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: 'อีเมลต้องเป็นข้อความ' };
  }

  const trimmed = value.trim().toLowerCase();

  if (trimmed.length === 0) {
    return { valid: false, error: 'อีเมลต้องระบุ' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'อีเมลต้องไม่เกิน 100 ตัวอักษร' };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate URL (social media, video links)
 */
export function validateUrl(value: unknown): ValidationResult {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { valid: true, value: '' }; // Optional field
  }

  const trimmed = value.trim();

  if (trimmed.length > 500) {
    return { valid: false, error: 'URL ต้องไม่เกิน 500 ตัวอักษร' };
  }

  // Must be HTTPS
  if (!trimmed.startsWith('https://')) {
    return { valid: false, error: 'URL ต้องเป็น HTTPS เท่านั้น' };
  }

  try {
    new URL(trimmed);
  } catch {
    return { valid: false, error: 'รูปแบบ URL ไม่ถูกต้อง' };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate content/description
 * - Can contain newlines, basic formatting
 * - Max 5000 characters
 */
export function validateContent(value: unknown, max = 5000): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: 'เนื้อหาต้องเป็นข้อความ' };
  }

  const trimmed = value.trim();

  if (trimmed.length > max) {
    return { valid: false, error: `เนื้อหาต้องไม่เกิน ${max} ตัวอักษร` };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate number within range
 */
export function validateNumber(
  value: unknown,
  min = 0,
  max = Infinity,
): ValidationResult {
  const num = Number(value);

  if (Number.isNaN(num)) {
    return { valid: false, error: 'ต้องเป็นตัวเลข' };
  }

  if (num < min) {
    return { valid: false, error: `ต้องมากกว่า ${min}` };
  }

  if (num > max) {
    return { valid: false, error: `ต้องไม่เกิน ${max}` };
  }

  return { valid: true, value: String(num) };
}

/**
 * Sanitize HTML content (basic - removes script tags)
 * Note: For complete protection, use a library like DOMPurify on the client
 */
export function sanitizeHtml(value: string): string {
  // Remove script tags and event handlers
  let sanitized = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*"[^"]*"/gi, ''); // Remove event handlers
  sanitized = sanitized.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
  return sanitized;
}
