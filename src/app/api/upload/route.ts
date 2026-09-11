import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { saveUpload, type UploadFolder } from '@/lib/uploads';

export const runtime = 'nodejs';

const FOLDERS: UploadFolder[] = ['news', 'media', 'publications', 'history', 'cover'];

// endpoint อัปโหลดทั่วไป — ปัจจุบันยังไม่มีหน้าไหนเรียกใช้
export async function POST(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: 'ไม่พบไฟล์ในคำขอ' }, { status: 400 });

    // ต้องระบุโฟลเดอร์ปลายทางเสมอ ไม่มีค่าเริ่มต้น เพื่อไม่ให้มีไฟล์ตกค้างนอกหมวด
    const folder = String(form.get('folder') || '');
    if (!FOLDERS.includes(folder as UploadFolder)) {
      return NextResponse.json({ success: false, error: `ต้องระบุ folder เป็นหนึ่งใน: ${FOLDERS.join(', ')}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, filePath: await saveUpload(file, folder as UploadFolder) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'อัปโหลดไฟล์ไม่สำเร็จ' }, { status: 400 });
  }
}
