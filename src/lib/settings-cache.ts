import { query } from './db';

// cache ในหน่วยความจำ เหมาะกับ deployment แบบ VM/VPS เดี่ยว (ดีไซน์เดียวกับ lib/rate-limit.ts)
// เดิม RootLayout ยิง query ไป DB ทุกครั้งที่โหลดหน้า ทั้งที่ค่านี้แทบไม่เปลี่ยนเลย
// ทำให้ทุกหน้าทั่วเว็บช้าลงโดยไม่จำเป็นจากการรอ DB round-trip ที่ไม่มีประโยชน์
type Cache = { value: boolean; expiresAt: number };

const TTL_MS = 30 * 1000; // 30 วินาที พอสำหรับ toggle ที่ไม่ได้เปลี่ยนบ่อย
let cached: Cache | null = null;

export async function getIsGrayscale(): Promise<boolean> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  try {
    const res = await query('SELECT is_grayscale FROM site_settings WHERE id = $1', ['global']);
    const value = Boolean(res.rows[0]?.is_grayscale);
    cached = { value, expiresAt: Date.now() + TTL_MS };
    return value;
  } catch {
    // DB สะดุดชั่วคราว — ใช้ค่าเก่าที่เคย cache ไว้ต่อไปก่อน (ไม่ใช่ throw ทำให้ทั้งเว็บพัง)
    return cached?.value ?? false;
  }
}

/** เรียกทันทีหลังมีคนเปลี่ยนค่าโหมดขาวดำ ให้มีผลทันทีโดยไม่ต้องรอ TTL หมดอายุ */
export function invalidateGrayscaleCache() {
  cached = null;
}