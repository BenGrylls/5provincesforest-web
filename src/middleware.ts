import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Middleware runs on the Edge runtime, so keep this check Web-API-only.
  const token = request.cookies.get('admin_token')?.value;
  const authenticated = Boolean(process.env.ADMIN_SESSION_TOKEN)
    && token === process.env.ADMIN_SESSION_TOKEN;
  const isLoginPage = request.nextUrl.pathname === '/admin/login';
  const isSubAdmin = request.cookies.get('admin_role')?.value === 'sub_admin';
  const restrictedPath = request.nextUrl.pathname === '/admin/sub-admins'
    || request.nextUrl.pathname === '/admin/settings'
    || (request.nextUrl.pathname === '/admin/content' && request.nextUrl.searchParams.get('tab') === 'logs');

  if (!authenticated && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (authenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (authenticated && isSubAdmin && restrictedPath) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
