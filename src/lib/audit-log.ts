import { query } from './db';

export type AuditResult = 'success' | 'failed' | 'forbidden';

export type AuditLogInput = {
  /** request ปัจจุบัน — ใช้ดึง IP และ user agent อัตโนมัติ */
  request: Request;
  /** ชื่อผู้ทำรายการ (username) — ถ้าไม่รู้ตัวตน (เช่น login ล้มเหลว) ใส่ค่าที่กรอกมาหรือ 'unknown' */
  username: string;
  /** รหัสการกระทำ ตัวพิมพ์ใหญ่คั่นด้วย _ เช่น CREATE, LOGIN_FAILED, PERMISSIONS_CHANGED */
  action: string;
  /** หมวดที่เกี่ยวข้อง เช่น news, media, publications, committee, objectives, history, settings, admin, auth */
  category: string;
  /** ประเภทของแถวข้อมูลที่ถูกกระทำ เช่น 'article', 'sub_admin', 'committee_unit', 'session' */
  targetType?: string | null;
  /** id จริงของแถวข้อมูลนั้นในตาราง — ใช้ trace ย้อนหลังได้แม่นยำแม้ title จะถูกแก้ไปแล้ว */
  targetId?: string | number | null;
  /** ชื่อ/หัวข้อที่อ่านง่าย ไว้แสดงในตาราง log โดยไม่ต้อง join ตารางอื่น */
  targetTitle?: string;
  /** ค่าก่อน/หลังที่เปลี่ยน หรือรายละเอียดอื่นที่ช่วยสืบสวน — ใส่เฉพาะฟิลด์ที่เปลี่ยน ไม่ต้องส่งข้อมูลเต็มทั้งก้อน */
  detail?: Record<string, unknown> | null;
  /** ผลลัพธ์ของการกระทำ — ค่าเริ่มต้นคือ success */
  result?: AuditResult;
};

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

// PATCH: จำกัดความยาวฟิลด์ กัน log flooding จาก request ที่ตั้งใจส่งค่ายาวผิดปกติ
// (เช่น title บทความยาวเป็นหมื่นตัวอักษร, header user-agent ปลอม) ไม่ให้ตาราง log บวมง่ายเกินไป
const MAX_TITLE_LENGTH = 300;
const MAX_USER_AGENT_LENGTH = 300;
const MAX_DETAIL_LENGTH = 4000;

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/**
 * บันทึก audit log หนึ่งรายการ ใช้แทนการเขียน INSERT INTO admin_logs กระจายในแต่ละ route
 * ตั้งใจไม่ throw ถ้าเขียนไม่สำเร็จ (เช่น DB สะดุดชั่วคราว) เพื่อไม่ให้ log ล้มเหลวแล้วพา
 * response หลักของ endpoint พังไปด้วย — แค่ swallow error เงียบๆ
 */
export async function writeAuditLog({
  request,
  username,
  action,
  category,
  targetType = null,
  targetId = null,
  targetTitle = '',
  detail = null,
  result = 'success',
}: AuditLogInput): Promise<void> {
  try {
    const detailJson = detail ? JSON.stringify(detail) : null;
    await query(
      `INSERT INTO admin_logs
        (admin_username, action, target_title, category, target_type, target_id, ip_address, user_agent, detail, result)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        username || 'unknown',
        action,
        truncate(targetTitle, MAX_TITLE_LENGTH),
        category,
        targetType,
        targetId === null || targetId === undefined ? null : String(targetId),
        clientIp(request),
        truncate(request.headers.get('user-agent') || 'unknown', MAX_USER_AGENT_LENGTH),
        detailJson ? truncate(detailJson, MAX_DETAIL_LENGTH) : null,
        result,
      ],
    );
  } catch {
    // ไม่ให้การบันทึก log ที่ล้มเหลวไปกลบ response หลักของ endpoint
  }
}

/**
 * เรียกทุกครั้งที่ตอบ 403/สั่งปฏิเสธคำขอเพราะสิทธิ์ไม่พอ "ระหว่างที่ล็อกอินอยู่แล้ว"
 * (เช่น sub-admin พยายามเข้าหมวดที่ไม่มีสิทธิ์) — เป็นสัญญาณสำรวจ/พยายามยกระดับสิทธิ์
 * ไม่ใช้กับ request ที่ยังไม่ล็อกอินเลย (401 ธรรมดา) เพราะจะรก log จาก bot/scanner ทั่วไป
 */
export async function logForbidden(request: Request, params: {
  username: string;
  category: string;
  targetType?: string;
  targetId?: string | number | null;
  targetTitle?: string;
  reason?: string;
}): Promise<void> {
  await writeAuditLog({
    request,
    username: params.username,
    action: 'FORBIDDEN',
    category: params.category,
    targetType: params.targetType ?? null,
    targetId: params.targetId ?? null,
    targetTitle: params.targetTitle ?? '',
    detail: params.reason ? { reason: params.reason } : null,
    result: 'forbidden',
  });
}

/** เรียกทุกครั้งที่ sameOrigin() ปฏิเสธ request — มักเป็น scanner หรือมี config ผิดฝั่ง client */
export async function logCsrfBlocked(request: Request): Promise<void> {
  let path = 'unknown';
  try {
    path = new URL(request.url).pathname;
  } catch {
    // ignore — เก็บ 'unknown' ไว้เฉยๆ
  }
  await writeAuditLog({
    request,
    username: 'unknown',
    action: 'CSRF_BLOCKED',
    category: 'security',
    targetType: 'request',
    targetTitle: path,
    result: 'forbidden',
  });
}