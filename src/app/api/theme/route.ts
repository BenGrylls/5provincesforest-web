import { NextResponse } from 'next/server';
import { getIsGrayscale } from '@/lib/settings-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { isGrayscale: await getIsGrayscale() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}