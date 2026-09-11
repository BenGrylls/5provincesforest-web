/**
 * รายชื่อสิทธิ์ทั้งหมดที่มอบให้ sub-admin ได้ — นิยามไว้ที่เดียว
 *
 * ไฟล์นี้ตั้งใจไม่ import อะไรเลย เพราะถูกใช้ทั้งฝั่ง client (หน้าเลือกสิทธิ์)
 * และฝั่ง server (ตรวจสิทธิ์ใน auth.ts) — ถ้าดึง auth.ts ไปใช้ใน client component
 * จะลาก Node 'crypto' ผ่าน session.js ตามไปด้วยแล้วพัง
 *
 * เดิมรายชื่อนี้ถูก hardcode ไว้ในหน้า sub-admins แยกจาก auth.ts ทำให้
 * 'ประวัติความเป็นมา' ตกหล่น — canManageHistory() ตรวจสิทธิ์นี้อยู่ แต่หน้า UI
 * ไม่เคยเสนอให้ติ๊ก จึงไม่มีทางมอบสิทธิ์นั้นให้ sub-admin ได้เลย
 */
export const PERMISSIONS = [
  'ข่าวสารและกิจกรรม',
  'สื่อและสารคดีธรรมชาติ',
  'คลังเอกสารและวารสาร',
  'โครงสร้างคณะกรรมการ',
  'ประวัติความเป็นมา',
  'วัตถุประสงค์และภารกิจ',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export function isPermission(value: unknown): value is Permission {
  return typeof value === 'string' && (PERMISSIONS as readonly string[]).includes(value);
}
