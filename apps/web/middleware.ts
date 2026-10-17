import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, clientAddress, isAutomatedClient } from '@/lib/bot-guard';

/**
 * Runs before every sign-in and dashboard page is sent:
 *  1. Turns away scripts and scrapers, and visitors who ask for pages too fast.
 *  2. Keeps each role inside its own part of the dashboard.
 *
 * The bot checks are on in production (or locally with SMARTCARE_HARDEN=1), so day-to-day development
 * and test tools keep working. Set SMARTCARE_ALLOW_BOTS=1 to switch them off on a live site.
 *
 * Demo mode: while SMARTCARE_DEMO_MODE is not "false", opening a dashboard without signing in picks
 * a demo account for you, so reviewers never hit a wall. A live site should set it to "false".
 */

const ENFORCE_BOT_GUARD =
  (process.env.NODE_ENV === 'production' || process.env.SMARTCARE_HARDEN === '1') &&
  process.env.SMARTCARE_ALLOW_BOTS !== '1';

const DEMO_MODE = process.env.SMARTCARE_DEMO_MODE !== 'false';

// Pages and their prefetches count together, so this leaves plenty of room for normal browsing
const REQUESTS_PER_MINUTE = 240;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ENFORCE_BOT_GUARD) {
    if (isAutomatedClient(request.headers.get('user-agent'))) {
      return new NextResponse('Automated access is not allowed.', {
        status: 403,
        headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
      });
    }

    const { allowed, retryAfterSeconds } = checkRateLimit(
      `page:${clientAddress(request.headers)}`,
      REQUESTS_PER_MINUTE,
      60_000
    );
    if (!allowed) {
      return new NextResponse('Too many requests. Please slow down.', {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds), 'Cache-Control': 'no-store' },
      });
    }
  }

  // Only dashboard pages need a role
  if (!pathname.startsWith('/dashboard/')) {
    return NextResponse.next();
  }

  const roleCookie = request.cookies.get('smartcare_role')?.value;

  // If a session cookie exists, keep the person inside their own area
  if (roleCookie) {
    // 1. Admin / State Command: staff only
    if (pathname.startsWith('/dashboard/admin') && roleCookie !== 'staff') {
      const redirectUrl = roleCookie === 'doctor' ? '/dashboard/hospital' : '/dashboard/patient';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // 2. Doctor / PHC hospital: doctor or staff
    if (pathname.startsWith('/dashboard/hospital') && roleCookie !== 'doctor' && roleCookie !== 'staff') {
      return NextResponse.redirect(new URL('/dashboard/patient', request.url));
    }

    // 3. Patient: patients only
    if (pathname.startsWith('/dashboard/patient') && roleCookie !== 'patient') {
      const redirectUrl = roleCookie === 'doctor' ? '/dashboard/hospital' : '/dashboard/admin';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    return NextResponse.next();
  }

  // No session on a live site: send them to sign in, and come back afterwards
  if (!DEMO_MODE) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Demo mode: pick the demo account that matches the page being opened
  let seededRole = 'patient';
  let seededEmail = 'patient@smartcare.demo';

  if (pathname.startsWith('/dashboard/admin')) {
    seededRole = 'staff';
    seededEmail = 'commander@mohfw.gov.in';
  } else if (pathname.startsWith('/dashboard/hospital')) {
    seededRole = 'doctor';
    seededEmail = 'hospital@smartcare.demo';
  }

  const response = NextResponse.next();
  const cookieOptions = {
    path: '/',
    maxAge: 8 * 60 * 60, // 8 hours
    sameSite: 'lax' as const,
  };
  response.cookies.set('smartcare_role', seededRole, cookieOptions);
  response.cookies.set('smartcare_email', seededEmail, cookieOptions);
  return response;
}

export const config = {
  matcher: ['/login', '/dashboard/:path*'],
};
