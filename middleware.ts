import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// Public routes that don't require authentication
const publicRoutes = ['/login', '/set-password', '/track', '/403'];

// Check if path is a public route
function isPublicRoute(pathname: string): boolean {
  // Remove locale prefix for checking (e.g., /en/login -> /login)
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, '') || '/';

  // Root path is public (landing page)
  if (pathWithoutLocale === '/' || pathWithoutLocale === '') {
    return true;
  }

  return publicRoutes.some(route => pathWithoutLocale.startsWith(route));
}

// Check if path is the login route
function isLoginRoute(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, '') || '/';
  return pathWithoutLocale === '/login' || pathWithoutLocale.startsWith('/login');
}

// Check if path is a dashboard route
function isDashboardRoute(pathname: string): boolean {
  return pathname.includes('/dashboard');
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookies
  const token = request.cookies.get('token')?.value;

  // Extract locale from path or default to 'en'
  const localeMatch = pathname.match(/^\/(en|ar)/);
  const locale = localeMatch ? localeMatch[1] : 'en';

  // If accessing dashboard without token, redirect to login
  if (isDashboardRoute(pathname) && !token) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login WITH token, redirect to dashboard
  // But add a query param so client can verify if session is actually valid
  if (isLoginRoute(pathname) && token) {
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    // Add a flag to let client know to validate session
    dashboardUrl.searchParams.set('validate', '1');
    return NextResponse.redirect(dashboardUrl);
  }

  // Continue with intl middleware for all other cases
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except static files and api routes
  matcher: ['/((?!_next|api|.*\\..*).*)']
};
