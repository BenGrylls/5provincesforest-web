import { NextResponse } from 'next/server';
import { canManageCommittee, isAuthenticated } from '@/lib/auth';
import { query } from '@/lib/db';
import { isImage } from '@/lib/uploads';

export async function GET(request: Request) {
  if (!isAuthenticated(request) || !await canManageCommittee(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [president, units] = await Promise.all([
    query("SELECT name, position, image_path, image_data IS NOT NULL AS has_image, biography, responsibilities, biography_sections FROM committee_profiles WHERE id = $1", ['president']),
    query('SELECT id, title, description, responsibilities, sort_order FROM committee_units ORDER BY sort_order'),
  ]);
  return NextResponse.json({ president: president.rows[0] || null, units: units.rows });
}

export async function PATCH(request: Request) {
  if (!isAuthenticated(request) || !await canManageCommittee(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const contentType = request.headers.get('content-type') || '';
  const form = contentType.includes('multipart/form-data') ? await request.formData() : null;
  const body = form ? { type: form.get('type'), name: form.get('name'), position: form.get('position'), biography: form.get('biography'), responsibilities: form.get('responsibilities'), existingImage: form.get('existingImage') } : await request.json();
  if (body.type === 'president' && typeof body.name === 'string' && typeof body.position === 'string') {
    let imagePath = typeof body.existingImage === 'string' ? body.existingImage : '';
    let imageData: Buffer | null = null;
    let imageMime = '';
    const image = form?.get('image');
    if (image instanceof File && image.size > 0) {
      if (!isImage(image)) return NextResponse.json({ error: 'รูปภาพต้องเป็น JPG, PNG หรือ WebP' }, { status: 400 });
      imageData = Buffer.from(await image.arrayBuffer());
      imageMime = image.type;
      imagePath = '';
    }
    const current = Array.isArray(body.biographySections) ? body.biographySections : (await query('SELECT biography_sections FROM committee_profiles WHERE id = $1', ['president'])).rows[0]?.biography_sections;
    const sections = Array.isArray(current) ? current.filter((section: unknown): section is { title: string; content: string } => Boolean(section && typeof section === 'object' && typeof (section as { title?: unknown }).title === 'string' && typeof (section as { content?: unknown }).content === 'string')) : [];
    if (imageData) {
      await query('UPDATE committee_profiles SET name = $1, position = $2, image_path = $3, image_data = $4, image_mime = $5, biography = $6, responsibilities = $7, biography_sections = $8 WHERE id = $9', [body.name.trim(), body.position.trim(), imagePath, imageData, imageMime, typeof body.biography === 'string' ? body.biography : '', typeof body.responsibilities === 'string' ? body.responsibilities : '', JSON.stringify(sections), 'president']);
    } else {
      await query('UPDATE committee_profiles SET name = $1, position = $2, image_path = $3, biography = $4, responsibilities = $5, biography_sections = $6 WHERE id = $7', [body.name.trim(), body.position.trim(), imagePath, typeof body.biography === 'string' ? body.biography : '', typeof body.responsibilities === 'string' ? body.responsibilities : '', JSON.stringify(sections), 'president']);
    }
    return NextResponse.json({ success: true });
  }
  if (body.type === 'unit' && Number.isSafeInteger(body.id) && typeof body.title === 'string') {
    const responsibilities = Array.isArray(body.responsibilities) ? body.responsibilities.filter((item: unknown) => typeof item === 'string') : [];
    await query('UPDATE committee_units SET title = $1, description = $2, responsibilities = $3 WHERE id = $4', [body.title.trim(), typeof body.description === 'string' ? body.description : '', responsibilities, body.id]);
    return NextResponse.json({ success: true });
  }
  if (body.type === 'unit-order' && Array.isArray(body.ids) && body.ids.every((id: unknown) => Number.isSafeInteger(id))) {
    await Promise.all(body.ids.map((id: number, index: number) => query('UPDATE committee_units SET sort_order = $1 WHERE id = $2', [index + 1, id])));
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
}

export async function POST(request: Request) {
  if (!isAuthenticated(request) || !await canManageCommittee(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { title } = await request.json();
  if (typeof title !== 'string' || !title.trim()) return NextResponse.json({ error: 'กรุณาระบุชื่อฝ่าย' }, { status: 400 });
  const order = await query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM committee_units');
  const result = await query('INSERT INTO committee_units (title, sort_order) VALUES ($1, $2) RETURNING id, title, description, responsibilities, sort_order', [title.trim(), order.rows[0].next_order]);
  return NextResponse.json(result.rows[0], { status: 201 });
}

export async function DELETE(request: Request) {
  if (!isAuthenticated(request) || !await canManageCommittee(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isSafeInteger(id)) return NextResponse.json({ error: 'ไม่พบฝ่ายที่ต้องการลบ' }, { status: 400 });
  await query('DELETE FROM committee_units WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}