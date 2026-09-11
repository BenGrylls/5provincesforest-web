// src/lib/session.js
//
// ออกและตรวจสอบ "signed session token" สำหรับระบบ admin
//
// ทำไมต้องมีไฟล์นี้:
// เดิมระบบใช้ ADMIN_SESSION_TOKEN ค่าคงที่ตัวเดียวเป็น cookie "admin_token"
// ให้ผู้ใช้ admin ทุกคน (ทั้ง super_admin และ sub_admin) ใช้ค่าเดียวกันหมด
// ส่วนสิทธิ์ (role) ถูกเก็บแยกไว้ใน cookie "admin_role" ธรรมดาที่ไม่มีการเซ็นรับรอง
// ทำให้ sub_admin ที่ login ถูกต้องแล้ว สามารถคัดลอกค่า cookie ของตัวเอง แล้วแก้ค่า
// admin_role เป็น "super_admin" เอง (เช่นด้วย curl/Postman) เพื่อยกระดับสิทธิ์ตัวเองได้ทันที
//
// วิธีแก้: เปลี่ยนมาออก token ที่ "เซ็นด้วย HMAC-SHA256" โดยฝัง username + role +
// วันหมดอายุไว้ในตัว token เอง แล้วตรวจลายเซ็นทุกครั้งที่ verify — ทำให้ role ที่อ่านได้
// เชื่อถือได้จริง เพราะถูกคำนวณมาจากค่าที่ server เซ็นไว้ตอน login เท่านั้น
// ไม่มีทางปลอมค่า role ได้ถ้าไม่รู้ ADMIN_SESSION_TOKEN (secret) ที่ใช้เซ็น
//
// ใช้ได้เฉพาะฝั่ง Node.js runtime เท่านั้น (API routes ปกติของ Next.js ที่ไม่ได้ประกาศ
// runtime = 'edge') เพราะพึ่งพา Node 'crypto' โมดูล ห้าม import ไฟล์นี้ใน src/proxy.ts
// (proxy รันบน Edge runtime ซึ่งไม่มีโมดูลนี้ให้ใช้)

import { createHmac, timingSafeEqual } from 'crypto';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 ชั่วโมง เท่ากับ maxAge ของ cookie เดิม

function getSecret() {
  const secret = process.env.ADMIN_SESSION_TOKEN;
  if (!secret || secret.length < 16) {
    throw new Error('ADMIN_SESSION_TOKEN ยังไม่ได้ตั้งค่า หรือสั้นเกินไป (ต้องยาวอย่างน้อย 16 ตัวอักษร)');
  }
  return secret;
}

function sign(payloadB64) {
  return createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

/**
 * ออก session token ใหม่ (เรียกตอน login สำเร็จเท่านั้น)
 * @param {string} username
 * @param {'super_admin' | 'sub_admin'} role
 * @param {number} [ttlMs] อายุ token เป็นมิลลิวินาที (ค่าเริ่มต้น 24 ชั่วโมง)
 * @returns {string} token สำหรับเก็บลง cookie "admin_token"
 */
export function createSessionToken(username, role, ttlMs = DEFAULT_TTL_MS) {
  if (typeof username !== 'string' || !username) {
    throw new Error('username ไม่ถูกต้อง');
  }
  if (role !== 'super_admin' && role !== 'sub_admin') {
    throw new Error('role ไม่ถูกต้อง');
  }
  const payload = { u: username, r: role, e: Date.now() + ttlMs };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

/**
 * ตรวจสอบ session token ที่ได้จาก cookie "admin_token"
 * @param {string | undefined | null} token
 * @returns {{ username: string, role: 'super_admin' | 'sub_admin', expires: number } | null}
 *   คืนค่า null ถ้า token ไม่มี, รูปแบบผิด, ลายเซ็นไม่ตรง, หรือหมดอายุแล้ว
 */
export function verifySessionToken(token) {
  if (typeof token !== 'string' || !token) return null;

  const separatorIndex = token.lastIndexOf('.');
  if (separatorIndex <= 0 || separatorIndex === token.length - 1) return null;

  const payloadB64 = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  let expectedSignature;
  try {
    expectedSignature = sign(payloadB64);
  } catch {
    // ADMIN_SESSION_TOKEN ไม่ได้ตั้งค่า -> ถือว่ายังไม่พร้อมใช้งาน auth เลย
    return null;
  }

  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (
    !payload ||
    typeof payload.u !== 'string' ||
    (payload.r !== 'super_admin' && payload.r !== 'sub_admin') ||
    typeof payload.e !== 'number'
  ) {
    return null;
  }

  if (Date.now() > payload.e) return null; // token หมดอายุแล้ว

  return { username: payload.u, role: payload.r, expires: payload.e };
}
