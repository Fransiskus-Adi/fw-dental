import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64 using atob and handle URL decoding of utf-8
    const raw = atob(base64);
    const jsonPayload = decodeURIComponent(
      raw
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Unconditional access for asset files, api, next internals, login page, access-denied
  if (
    pathname === '/admin/login' ||
    pathname === '/admin/access-denied' ||
    pathname.startsWith('/admin/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_token')?.value;

  // 1. If not authenticated
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  // 2. Validate token and check expiration
  const payload = decodeJwt(token);
  const now = Math.floor(Date.now() / 1000);

  if (!payload || (payload.exp && now >= payload.exp)) {
    // Expired or invalid token, clear cookie and redirect
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    const response = NextResponse.redirect(url);
    response.cookies.delete('admin_token');
    return response;
  }

  // 3. Permission Checks
  const permissions = payload.permissions || {};

  let hasAccess = true;

  if (pathname === '/admin') {
    hasAccess = !!permissions.page_dashboard;
  } else if (pathname.startsWith('/admin/bookings')) {
    hasAccess = !!permissions.page_bookings;
  } else if (pathname.startsWith('/admin/transactions')) {
    hasAccess = !!permissions.page_transactions;
  } else if (pathname.startsWith('/admin/schedules')) {
    hasAccess = !!permissions.page_schedules;
  } else if (pathname.startsWith('/admin/master-data/employees')) {
    hasAccess = !!permissions.page_employees;
  } else if (pathname.startsWith('/admin/master-data/doctors')) {
    hasAccess = !!permissions.page_doctors;
  } else if (pathname.startsWith('/admin/master-data/roles')) {
    hasAccess = !!permissions.page_roles;
  } else if (pathname.startsWith('/admin/settings')) {
    hasAccess = !!permissions.page_settings;
  }

  if (!hasAccess) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/access-denied';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
