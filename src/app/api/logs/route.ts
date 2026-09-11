import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isAuthenticated, isSuperAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
  if (!isAuthenticated(request) || !await isSuperAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await query('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 50');
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
