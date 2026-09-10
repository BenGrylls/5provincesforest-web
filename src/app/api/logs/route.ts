import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ADMIN_ROLE_COOKIE, isAuthenticated } from '@/lib/auth';

function isSuperAdmin(request: Request) {
  const role = request.headers
    .get('cookie')
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${ADMIN_ROLE_COOKIE}=`))
    ?.slice(`${ADMIN_ROLE_COOKIE}=`.length);
  return role === undefined || role === 'super_admin';
}

export async function GET(request: Request) {
  if (!isAuthenticated(request) || !isSuperAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await query('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 50');
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
