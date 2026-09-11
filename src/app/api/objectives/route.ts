import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { canManageObjectives, isAuthenticated } from '@/lib/auth';

export const OBJECTIVE_ICONS = ['leaf', 'shield', 'target', 'droplet', 'users', 'heart'] as const;
type ObjectiveIcon = (typeof OBJECTIVE_ICONS)[number];

function isIcon(value: unknown): value is ObjectiveIcon {
  return typeof value === 'string' && (OBJECTIVE_ICONS as readonly string[]).includes(value);
}

/** ตรวจสิทธิ์สำหรับทุก method ที่เขียนข้อมูล */
async function guard(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }
  if (!await canManageObjectives(request)) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขวัตถุประสงค์และภารกิจ' }, { status: 403 });
  }
  return null;
}

// GET เปิดสาธารณะโดยตั้งใจ — หน้า /about/objectives ของผู้เข้าชมทั่วไปอ่านผ่าน query โดยตรง
// แต่เปิดไว้เผื่อฝั่ง client เรียกใช้ด้วย
export async function GET() {
  try {
    const result = await query('SELECT id, title, description, icon, sort_order FROM objectives ORDER BY sort_order ASC');
    return NextResponse.json(result.rows || []);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;

  try {
    const { title } = await request.json();
    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'ต้องระบุหัวข้อ' }, { status: 400 });
    }
    const result = await query(
      `INSERT INTO objectives (title, description, icon, sort_order)
       VALUES ($1, '', 'leaf', COALESCE((SELECT MAX(sort_order) FROM objectives), 0) + 1)
       RETURNING id, title, description, icon, sort_order`,
      [title.trim()],
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: 'เพิ่มข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;

  try {
    const body = await request.json();

    // จัดเรียงลำดับใหม่ทั้งชุด
    if (body.type === 'order') {
      if (!Array.isArray(body.ids) || !body.ids.every((id: unknown) => Number.isSafeInteger(id))) {
        return NextResponse.json({ error: 'ลำดับไม่ถูกต้อง' }, { status: 400 });
      }
      // ตั้งเป็นค่าติดลบก่อนเพื่อเลี่ยงชนกันระหว่างสลับ (sort_order ไม่ซ้ำกันในชุดเดียว)
      for (const [index, id] of body.ids.entries()) {
        await query('UPDATE objectives SET sort_order = $1 WHERE id = $2', [-(index + 1), id]);
      }
      for (const [index, id] of body.ids.entries()) {
        await query('UPDATE objectives SET sort_order = $1 WHERE id = $2', [index + 1, id]);
      }
      return NextResponse.json({ success: true });
    }

    const { id, title, description, icon } = body;
    if (!Number.isSafeInteger(id) || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
    const result = await query(
      'UPDATE objectives SET title = $1, description = $2, icon = $3 WHERE id = $4 RETURNING id, title, description, icon, sort_order',
      [title.trim(), typeof description === 'string' ? description : '', isIcon(icon) ? icon : 'leaf', id],
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch {
    return NextResponse.json({ error: 'บันทึกไม่สำเร็จ' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 400 });
  }
  try {
    await query('DELETE FROM objectives WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'ลบไม่สำเร็จ' }, { status: 500 });
  }
}
