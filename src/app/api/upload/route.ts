import { NextResponse } from 'next/server';
import { canAccessCategory, canManageHistory, isAuthenticated, isSuperAdminRequest, type ContentCategory } from '@/lib/auth';
import { sameOrigin } from '@/lib/csrf';
import { saveUpload, type UploadFolder } from '@/lib/uploads';

export const runtime = 'nodejs';

const FOLDERS: UploadFolder[] = ['news', 'media', 'publications', 'history', 'cover'];

// PATCH(3): ผูก folder กับสิทธิ์เดียวกับที่ endpoint อื่นใช้ตรวจอยู่แล้ว
// เดิม endpoint นี้เช็คแค่ isAuthenticated() เฉยๆ — sub-admin ที่มีสิทธิ์แค่ "ข่าวสาร"
// เข้ามาอัปโหลดเข้าโฟลเดอร์ cover/history ได้ ทั้งที่ไม่มีสิทธิ์จัดการหมวดนั้น
const FOLDER_GUARDS: Record<UploadFolder, (request: Request) => Promise<boolean>> = {
  news: (req) => canAccessCategory(req, 'news' as ContentCategory),
  media: (req) => canAccessCategory(req, 'media' as ContentCategory),
  publications: (req) => canAccessCategory(req, 'publications' as ContentCategory),
  history: (req) => canManageHistory(req),
  cover: (req) => isSuperAdminRequest(req),
};

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'CSRF check failed' }, { status: 403 });
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

    // PATCH(3): บังคับสิทธิ์รายโฟลเดอร์
    if (!await FOLDER_GUARDS[folder as UploadFolder](request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, filePath: await saveUpload(file, folder as UploadFolder) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'อัปโหลดไฟล์ไม่สำเร็จ' }, { status: 400 });
  }
}