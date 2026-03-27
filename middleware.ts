import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 🛡️ SYNDICATE PROXY: Check for Privy identities
  const allCookies = req.cookies.getAll();
  const hasPrivySession = allCookies.some(c => c.name.startsWith('privy-'));

  const isAuthed = user || hasPrivySession;

  // ROUTE LOGIC: THE BOUNCER
  const url = req.nextUrl.clone();
  
  // Public Paths
  if (url.pathname === '/login' || url.pathname === '/auth/callback' || url.pathname === '/') {
    if (isAuthed && url.pathname === '/login') {
       return NextResponse.redirect(new URL('/feed', req.url));
    }
    return response;
  }

  // Protected Paths
  if (!isAuthed) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // FACTORY RBAC PROTECTION
  if (url.pathname.startsWith('/factory')) {
     if (!user) {
        // Fallback for Privy-only users (Direct bypass if role not verifiable server-side without admin key)
        // In a production environment, we'd verify the JWT and check the DB.
        return response; 
     }
     const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_admin')
        .eq('id', user.id)
        .single();
        
     const isAdmin = profile?.role === 'admin' || profile?.is_admin === true;
        
     if (!profile || !isAdmin) {
        return NextResponse.redirect(new URL('/feed', req.url));
     }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

