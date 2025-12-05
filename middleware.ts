import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if accessing dashboard routes
  const isDashboardRoute = pathname.includes('/dashboard');
  
  // Check if accessing set-password route (special case - user has temp token)
  const isSetPasswordRoute = pathname.includes('/set-password');
  
  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  
  // If accessing dashboard without token, redirect to login
  if (isDashboardRoute && !token) {
    const locale = pathname.split('/')[1] || 'en';
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Allow set-password route - token check will happen client-side
  // This is needed because cookie may not be set immediately after login
  if (isSetPasswordRoute) {
    return intlMiddleware(request);
  }
  
  // If accessing login with token, redirect to dashboard (unless coming from set-password flow)
  const isLoginRoute = pathname.includes('/login');
  if (isLoginRoute && token && !isSetPasswordRoute) {
    const locale = pathname.split('/')[1] || 'en';
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  // Continue with intl middleware
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(ar|en)/:path*']
};

