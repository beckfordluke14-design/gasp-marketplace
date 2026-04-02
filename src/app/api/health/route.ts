import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    status: 'SYSTEM_ONLINE',
    timestamp: new Date().toISOString(),
    node_version: process.version,
    port: process.env.PORT || '3000'
  });
}