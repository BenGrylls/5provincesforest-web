/**
 * Password Policy Validation
 * 
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 digit (0-9)
 * - At least 1 special character (!@#$%^&*)
 */

export type PasswordValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validatePasswordComplexity(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['รหัสผ่านต้องระบุ'] };
  }

  // Check minimum length
  if (password.length < 8) {
    errors.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
  }

  // Check maximum length (prevent extremely long strings)
  if (password.length > 128) {
    errors.push('รหัสผ่านต้องไม่เกิน 128 ตัวอักษร');
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว');
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว');
  }

  // Check for digit
  if (!/\d/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+=\[\]{};:'",.<>?/\\|-]/.test(password)) {
    errors.push('รหัสผ่านต้องมีอักขระพิเศษ (!@#$%^&* เป็นต้น) อย่างน้อย 1 ตัว');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getPasswordPolicyDescription(): string {
  return 'รหัสผ่านต้องมี: ตัวอักษรพิมพ์ใหญ่, พิมพ์เล็ก, ตัวเลข, อักขระพิเศษ และยาวอย่างน้อย 8 ตัว';
}
