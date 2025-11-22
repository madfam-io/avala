import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware - The Bouncer
 * Protects routes based on authentication cookies
 *
 * Flow:
 * 1. Check for access_token cookie
 * 2. If on /login and authenticated -> redirect to /dashboard
 * 3. If on /dashboard/* and NOT authenticated -> redirect to /login
 * 4. Otherwise, allow request
 */

const publicPaths = ['/login', '/verify'];
const protectedPaths = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth cookie
  const accessToken = request.cookies.get('access_token');
  const isAuthenticated = !!accessToken;

  // Check if path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Check if path is protected
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // If authenticated user tries to access login, redirect to dashboard
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If unauthenticated user tries to access protected route, redirect to login
  if (!isAuthenticated && isProtectedPath) {
    const loginUrl = new URL('/login', request.url);
    // Store the attempted URL for redirect after login
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow request to proceed
  return NextResponse.next();
}

/**
 * Matcher configuration
 * Apply middleware to these paths
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
