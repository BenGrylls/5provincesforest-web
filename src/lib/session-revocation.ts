import { query } from './db';

/**
 * PATCH(4): revocation แบบ "generation" — ง่ายและถูกกว่าเก็บ jti รายตัว
 * แนวคิด: เก็บ "เวลาที่ session เก่าทั้งหมดหมดอายุ" ต่อ user (session_not_before)
 * token ที่ถูกเซ็นออกมา "ก่อน" เวลานี้ = ถือว่าถูกเพิกถอนทั้งก้อน ต้อง login ใหม่
 *
 * เรียกใช้เมื่อ: เปลี่ยนสิทธิ์ sub-admin, เปลี่ยนรหัสผ่าน — เพื่อบังคับให้ session
 * เก่าที่อาจหลุดไปอยู่ในมือคนอื่น (หรือมีสิทธิ์แบบเก่าค้างอยู่) ใช้งานต่อไม่ได้ทันที
 */
export async function revokeSessionsFor(username: string) {
  await query('UPDATE sub_admins SET session_not_before = $1 WHERE username = $2', [Date.now(), username]);
}