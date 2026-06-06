import { auth } from '@/auth';

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isAuthRoute =
    nextUrl.pathname === '/login' ||
    nextUrl.pathname === '/register';
  
  const isDashboardRoute =
    nextUrl.pathname.startsWith('/dashboard') ||
    nextUrl.pathname.startsWith('/vendors') ||
    nextUrl.pathname.startsWith('/rfqs') ||
    nextUrl.pathname.startsWith('/quotations') ||
    nextUrl.pathname.startsWith('/approvals') ||
    nextUrl.pathname.startsWith('/purchase-orders') ||
    nextUrl.pathname.startsWith('/invoices') ||
    nextUrl.pathname.startsWith('/activity') ||
    nextUrl.pathname.startsWith('/reports');

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL('/dashboard', nextUrl));
    }
    return undefined;
  }

  if (isDashboardRoute) {
    if (!isLoggedIn) {
      return Response.redirect(new URL('/login', nextUrl));
    }
    return undefined;
  }

  return undefined;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
