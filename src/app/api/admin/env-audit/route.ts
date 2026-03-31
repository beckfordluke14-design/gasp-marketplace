import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest, unauthorizedResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const isAuthorized = await isAdminRequest(req);
  if (!isAuthorized) return unauthorizedResponse();

  return NextResponse.json({
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
    SUPABASE_URL_DEFAULT: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'MISSING',
    NODE_ENV: process.env.NODE_ENV
  });
}



