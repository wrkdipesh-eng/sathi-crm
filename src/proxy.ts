import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PROTECTED_PREFIXES = ['/dashboard'];
const AUTH_ONLY_ROUTES = ['/login'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log("PROXY PATHNAME:", pathname);
  const token = req.cookies.get('token')?.value ?? null;
  const user = token ? verifyToken(token) : null;

  // Unauthenticated access to protected routes or root -> /login
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if ((isProtected || pathname === '/') && !user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Already logged in and hitting / or /login → /dashboard
  if ((AUTH_ONLY_ROUTES.includes(pathname) || pathname === '/') && user) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/login',
  ],
};
