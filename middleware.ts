import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const response = NextResponse.next();

  // 🛡️ SYNDICATE PROXY: Check for Privy identities (Sovereign Node)
  const allCookies = req.cookies.getAll();
  const hasPrivySession = allCookies.some(c => c.name.startsWith('privy-'));

  const isAuthed = hasPrivySession;

  // ROUTE LOGIC: THE BOUNCER
  const url = req.nextUrl.clone();
  
  // Public Paths
  const publicPaths = ['/login', '/', '/api', '/news', '/terms', '/privacy', '/refunds', '/contact', '/how-to'];
  const isPublic = publicPaths.some(p => url.pathname.startsWith(p));

  if (isPublic) {
    if (isAuthed && url.pathname === '/login') {
       return NextResponse.redirect(new URL('/feed', req.url));
    }
    return response;
  }

  // Protected Paths: Redirect to /login if no valid token is found
  if (!isAuthed && !url.pathname.startsWith('/login') && url.pathname !== '/') {
     console.log('🛡️ [Middleware] Redirecting unauthenticated user to /login');
     return NextResponse.redirect(new URL('/login', req.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};


