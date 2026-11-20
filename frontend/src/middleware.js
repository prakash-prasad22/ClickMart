import { NextResponse } from 'next/server';

const COOKIE = process.env.AUTH_COOKIE_NAME || 'cm_token';
const STAFF = ['admin', 'manager', 'support'];

/**
 * Edge route guard. It only decodes the JWT payload to route users quickly;
 * the Express API verifies the signature and permissions on every request,
 * so a forged cookie can never read or change data.
 */
function readSession(req) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function middleware(req) {
  const { pathname, search } = req.nextUrl;
  const session = readSession(req);
  const next = encodeURIComponent(pathname + search);

  if (pathname.startsWith('/admin')) {
    const isStaff = session && STAFF.includes(session.role);
    if (pathname === '/admin/login') {
      return isStaff ? NextResponse.redirect(new URL('/admin', req.url)) : NextResponse.next();
    }
    if (!isStaff) return NextResponse.redirect(new URL(`/admin/login?next=${next}`, req.url));
    return NextResponse.next();
  }

  // Customer-only areas
  if (!session) return NextResponse.redirect(new URL(`/login?next=${next}`, req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/checkout'],
};
