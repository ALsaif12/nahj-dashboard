import { NextResponse, type NextRequest } from 'next/server';

// Edge-friendly cookie check. Full JWT verification happens in the server pages
// via lib/auth — this middleware just keeps unauthenticated requests off /dashboard.
export function middleware(req: NextRequest) {
  const token = req.cookies.get('nahj_session')?.value;
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');
  if (isDashboard && !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*'] };
