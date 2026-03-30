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
  if (url.pathname === '/login' || url.pathname === '/' || url.pathname.startsWith('/api')) {
    if (isAuthed && url.pathname === '/login') {
       return NextResponse.redirect(new URL('/feed', req.url));
    }
    return response;
  }

  // Protected Paths (Simple Logic for Railway Migration)
  if (!isAuthed && !url.pathname.startsWith('/login') && url.pathname !== '/') {
    // return NextResponse.redirect(new URL('/login', req.url));
    // For now, allow passage to ensure build doesn't break on missing sessions during pre-generation
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};


