#!/usr/bin/env node
/**
 * ลบ audit log (admin_logs) เก่าตามนโยบายการเก็บรักษา (retention policy)
 *
 * นโยบาย:
 *   - log เหตุการณ์ด้านความปลอดภัย (login/สิทธิ์/403/CSRF) เก็บอย่างน้อย 180 วัน
 *   - log การแก้ไขเนื้อหาทั่วไป (CREATE/UPDATE/DELETE ข่าว/สื่อ/ฯลฯ) เก็บ 90 วัน
 *
 * วิธีใช้: node scripts/cleanup-logs.mjs
 * ตั้งเป็น cron job บน VPS ให้รันอัตโนมัติ เช่น รันทุกคืนตี 3:
 *   0 3 * * * cd /path/to/5provincesforest-web && node scripts/cleanup-logs.mjs >> /var/log/cleanup-logs.log 2>&1
 *
 * ไม่ได้ทำเป็น API endpoint ที่เรียกผ่านเว็บได้ ตั้งใจให้รันจาก server-side/cron เท่านั้น
 * (audit log ต้อง append-only ผ่านหน้าเว็บ — การลบทำได้จากเครื่องมือฝั่ง infra เท่านั้น)
 */

import pg from 'pg';

const { Pool } = pg;

// event ที่ถือเป็นเรื่องความปลอดภัย เก็บนานกว่ากลุ่มอื่น
const SECURITY_ACTIONS = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGIN_RATE_LIMITED',
  'LOGOUT',
  'PASSWORD_CHANGED',
  'PASSWORD_CHANGE_FAILED',
  'SUB_ADMIN_CREATED',
  'PERMISSIONS_CHANGED',
  'FORBIDDEN',
  'CSRF_BLOCKED',
];

const SECURITY_RETENTION_DAYS = 180;
const NORMAL_RETENTION_DAYS = 90;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ ไม่พบ DATABASE_URL ใน environment — ตั้งค่าก่อนรันสคริปต์นี้');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const normalResult = await pool.query(
      `DELETE FROM admin_logs
       WHERE created_at < NOW() - INTERVAL '${NORMAL_RETENTION_DAYS} days'
         AND NOT (action = ANY($1))`,
      [SECURITY_ACTIONS],
    );
    const securityResult = await pool.query(
      `DELETE FROM admin_logs
       WHERE created_at < NOW() - INTERVAL '${SECURITY_RETENTION_DAYS} days'
         AND action = ANY($1)`,
      [SECURITY_ACTIONS],
    );

    console.log(`[${new Date().toISOString()}] cleanup-logs เสร็จสิ้น`);
    console.log(`  ลบ log ทั่วไปที่เก่ากว่า ${NORMAL_RETENTION_DAYS} วัน: ${normalResult.rowCount} แถว`);
    console.log(`  ลบ log ความปลอดภัยที่เก่ากว่า ${SECURITY_RETENTION_DAYS} วัน: ${securityResult.rowCount} แถว`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('cleanup-logs ล้มเหลว:', error);
  process.exit(1);
});
