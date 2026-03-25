import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
    SUPABASE_URL_DEFAULT: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'MISSING',
    NODE_ENV: process.env.NODE_ENV
  });
}



