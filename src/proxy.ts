import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Next 16 เปลี่ยนชื่อ convention จาก middleware เป็น proxy (ไฟล์เดิมคือ src/middleware.ts)
export function proxy(request: NextRequest) {
  // proxy รันบน Edge runtime (ไม่มี Node 'crypto' module ให้ใช้)
  // เดิม token เป็นค่าคงที่ตัวเดียว (ADMIN_SESSION_TOKEN) จึงเทียบตรงๆ ได้
  // ตอนนี้ token ถูกเซ็นด้วย HMAC และเปลี่ยนไปทุก session (ดู src/lib/session.js)
  // จึงเทียบตรงๆ ที่นี่ไม่ได้อีกต่อไป — ที่นี่เช็คแค่ "มี cookie หรือไม่" เพื่อ redirect
  // แบบคร่าวๆ (UX เท่านั้น) ส่วนการตรวจลายเซ็น/role จริงทำที่ API routes ทุกจุด
  // (ผ่าน isAuthenticated / getAdminSession ใน src/lib/auth.ts) ซึ่งเป็นด่านที่บังคับ
  // สิทธิ์จริงในการอ่าน/แก้ไขข้อมูลทั้งหมด ต่อให้ cookie ตรงนี้ถูกปลอมก็ผ่าน API ไม่ได้
  const token = request.cookies.get('admin_token')?.value;
  const authenticated = Boolean(token);
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
