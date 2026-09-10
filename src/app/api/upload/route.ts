import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { saveUpload } from '@/lib/uploads';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const file = (await request.formData()).get('file');
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: 'ไม่พบไฟล์ในคำขอ' }, { status: 400 });
    return NextResponse.json({ success: true, filePath: await saveUpload(file) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'อัปโหลดไฟล์ไม่สำเร็จ' }, { status: 400 });
  }
}
