import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    factory_logic: 'V2_PLURAL_VIDEOS', 
    target_endpoint: 'https://api.x.ai/v1/videos/generations',
    deploy_time: new Date().toISOString()
  });
}



