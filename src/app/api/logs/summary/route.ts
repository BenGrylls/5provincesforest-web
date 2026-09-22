import { NextResponse } from 'next/server';
import { getAdminSession, isAuthenticated, isSuperAdminRequest } from '@/lib/auth';
import { logForbidden } from '@/lib/audit-log';
import { query } from '@/lib/db';

/**
 * สรุปเหตุการณ์ความปลอดภัยล่าสุด ให้ super admin เห็นภาพรวมโดยไม่ต้องไล่อ่าน log ทีละบรรทัด
 * เฉพาะ super admin เท่านั้น (sub-admin ไม่ควรเห็นข้อมูล IP/บัญชีคนอื่น)
 */
export async function GET(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await isSuperAdminRequest(request)) {
    const actor = await getAdminSession(request);
    await logForbidden(request, { username: actor?.username || 'unknown', category: 'admin', reason: 'ไม่ใช่ super admin' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [loginFailures, rateLimited, recentDenied, bruteForceWarnings, probingWarnings, persistentWarnings] = await Promise.all([
      // login ล้มเหลว 24 ชม.ล่าสุด แยกต่อ IP
      query(
        `SELECT ip_address, COUNT(*)::int AS count, MAX(created_at) AS last_attempt
         FROM admin_logs
         WHERE action = 'LOGIN_FAILED' AND created_at > NOW() - INTERVAL '24 hours'
         GROUP BY ip_address ORDER BY count DESC LIMIT 20`,
      ),
      // IP ที่โดน rate-limit ใน 15 นาทีที่ผ่านมา (เท่ากับหน้าต่างเวลาบล็อกจริงใน lib/rate-limit.ts) — ถือว่า "ตอนนี้" ยังโดนบล็อกอยู่
      query(
        `SELECT ip_address, admin_username, MAX(created_at) AS last_hit
         FROM admin_logs
         WHERE action = 'LOGIN_RATE_LIMITED' AND created_at > NOW() - INTERVAL '15 minutes'
         GROUP BY ip_address, admin_username ORDER BY last_hit DESC LIMIT 20`,
      ),
      // event ถูกปฏิเสธล่าสุด (403 ทั้งจากสิทธิ์ไม่พอ และจาก CSRF)
      query(
        `SELECT admin_username, action, target_title, category, ip_address, created_at
         FROM admin_logs
         WHERE action IN ('FORBIDDEN', 'CSRF_BLOCKED')
         ORDER BY created_at DESC LIMIT 20`,
      ),
      // เตือน: login ล้มเหลว >= 10 ครั้งจาก IP เดียวใน 1 ชม. — สัญญาณ brute force
      query(
        `SELECT ip_address, COUNT(*)::int AS count
         FROM admin_logs
         WHERE action = 'LOGIN_FAILED' AND created_at > NOW() - INTERVAL '1 hour'
         GROUP BY ip_address HAVING COUNT(*) >= 10`,
      ),
      // เตือน: 403 >= 5 ครั้งจากบัญชีเดียวใน 1 ชม. — สัญญาณสำรวจ/พยายามยกระดับสิทธิ์
      query(
        `SELECT admin_username, COUNT(*)::int AS count
         FROM admin_logs
         WHERE action = 'FORBIDDEN' AND created_at > NOW() - INTERVAL '1 hour'
         GROUP BY admin_username HAVING COUNT(*) >= 5`,
      ),
      // เตือน: IP ที่เคยโดน rate-limit แล้วกลับมา login ผิดอีกหลังบล็อกหมดเวลา (>15 นาทีถัดมา) ภายใน 24 ชม.
      // — พฤติกรรมนี้ต่างจาก bot ทั่วไปที่เจอ 429 แล้วเลิกไปเลย บ่งชี้ว่าเป็นคนที่ตั้งใจรอแล้วลองใหม่จริงๆ
      query(
        `SELECT DISTINCT rl.ip_address
         FROM admin_logs rl
         JOIN admin_logs lf
           ON lf.ip_address = rl.ip_address
          AND lf.action = 'LOGIN_FAILED'
          AND lf.created_at > rl.created_at + INTERVAL '15 minutes'
          AND lf.created_at < rl.created_at + INTERVAL '24 hours'
         WHERE rl.action = 'LOGIN_RATE_LIMITED' AND rl.created_at > NOW() - INTERVAL '24 hours'
         LIMIT 20`,
      ),
    ]);

    const warnings: string[] = [
      ...bruteForceWarnings.rows.map((row) => `IP ${row.ip_address} พยายาม login ผิด ${row.count} ครั้งใน 1 ชั่วโมงที่ผ่านมา — คล้าย brute force`),
      ...probingWarnings.rows.map((row) => `บัญชี ${row.admin_username} ถูกปฏิเสธสิทธิ์ (403) ${row.count} ครั้งใน 1 ชั่วโมงที่ผ่านมา — คล้ายพยายามสำรวจ/ยกระดับสิทธิ์`),
      ...persistentWarnings.rows.map((row) => `IP ${row.ip_address} เคยโดน rate-limit แล้วยังกลับมา login ผิดซ้ำหลังพ้นเวลาบล็อก — น่าจะเป็นความพยายามต่อเนื่อง ไม่ใช่ bot ทั่วไป`),
    ];

    return NextResponse.json({
      loginFailures: loginFailures.rows,
      rateLimited: rateLimited.rows,
      recentDenied: recentDenied.rows,
      warnings,
    });
  } catch (error) {
    console.error('GET /api/logs/summary error:', error);
    return NextResponse.json({ loginFailures: [], rateLimited: [], recentDenied: [], warnings: [] }, { status: 500 });
  }
}