import { compare, hash } from 'bcryptjs';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcryptjs
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against its hash
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password from database
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

/**
 * Generate a secure random token (for session tokens)
 * @param length - Length of token in bytes (default: 32)
 * @returns URL-safe base64 token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('base64url');
}

/**
 * Generate a session token for admin authentication
 * @returns Secure random token
 */
export function generateSessionToken(): string {
  return generateSecureToken(32);
}
