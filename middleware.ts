import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if accessing dashboard routes
  const isDashboardRoute = pathname.includes('/dashboard');
  
  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  
  // If accessing dashboard without token, redirect to login
  if (isDashboardRoute && !token) {
    const locale = pathname.split('/')[1] || 'en';
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // If accessing login with token, redirect to dashboard
  const isLoginRoute = pathname.includes('/login');
  if (isLoginRoute && token) {
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

