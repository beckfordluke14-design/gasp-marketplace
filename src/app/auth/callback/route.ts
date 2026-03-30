import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 🛡️ AUTH CALLBACK: Supabase auth removed. Identity handled by Privy.
// This route is now a simple pass-through redirect for legacy deep links.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next') ?? '/feed';
  return NextResponse.redirect(`${origin}${next}`);
}
