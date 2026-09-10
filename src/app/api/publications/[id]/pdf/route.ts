import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const result = await query('SELECT pdf_file FROM articles WHERE id = $1 AND category = $2', [id, 'publications']);
    const pdfFile = result.rows[0]?.pdf_file;
    if (typeof pdfFile !== 'string' || !pdfFile.startsWith('/uploads/') || !pdfFile.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const filename = path.basename(pdfFile);
    const file = await readFile(path.join(process.cwd(), 'public', 'uploads', filename));
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