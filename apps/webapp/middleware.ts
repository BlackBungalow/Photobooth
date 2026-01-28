import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'photobooth_admin';

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === '/admin') {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  try {
    jwt.verify(token, process.env.ADMIN_PASSWORD ?? '');
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*']
};
