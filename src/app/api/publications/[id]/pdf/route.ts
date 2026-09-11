import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { resolveUploadPath } from '@/lib/uploads';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const result = await query('SELECT pdf_file FROM articles WHERE id = $1 AND category = $2', [id, 'publications']);
    const pdfFile = result.rows[0]?.pdf_file;
    if (typeof pdfFile !== 'string' || !pdfFile.startsWith('/uploads/') || !pdfFile.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // เดิมใช้ path.basename() แล้วต่อกับ public/uploads ตรงๆ จึงอ่านไฟล์ในโฟลเดอร์ย่อยไม่ได้
    const filePath = resolveUploadPath(pdfFile);
    if (!filePath) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'application/pdf',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}