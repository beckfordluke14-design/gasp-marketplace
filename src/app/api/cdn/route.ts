import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');

  if (!path) {
    return new NextResponse('Missing path', { status: 400 });
  }

   // 🛡️ SOVEREIGN R2 HUB: asset.gasp.fun
   const targetUrl = `https://asset.gasp.fun/${path}`;
 
   try {
     const response = await fetch(targetUrl, {
       next: { revalidate: 31536000 } // Cache for 1 year
     });
 
     if (!response.ok) {
       console.log(`[R2 Fetch Miss]: ${targetUrl}`);
       return new NextResponse('Not found', { status: 404 });
     }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    // 🛡️ REVENUE PROTECTION: Serve with high cache headers
    // Cloudflare will see these and cache the asset on its edge globally.
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000, immutable',
        'Vary': 'Accept-Encoding'
      }
    });
  } catch (error) {
    console.error('[CDN Proxy Failure]:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
