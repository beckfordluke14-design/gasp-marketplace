import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * IMAGE PROXY: Fetches external images (Pollinations, etc.) server-side
 * and serves them with proper CORS headers so the browser never sees ORB blocks.
 * Usage: /api/img?url=<encoded_image_url>
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing url param', { status: 400 });
  }

  try {
    const decoded = decodeURIComponent(targetUrl);
    
    // Security: only allow known safe image/video sources (Add Unsplash for Premium Fallbacks)
    const allowedHosts = [
        'image.pollinations.ai', 'pollinations.ai', 
        'picsum.photos', 'vvcwjlcequbkhlpmwzlc.supabase.co', 
        'assets.mixkit.co', 'mixkit.co', 'images.unsplash.com', 'unsplash.com'
    ];
    const urlObj = new URL(decoded);
    const isAllowed = allowedHosts.some(h => urlObj.hostname.includes(h));
    
    if (!isAllowed) {
      return new Response('Host not allowed', { status: 403 });
    }

    const res = await fetch(decoded, {
      signal: AbortSignal.timeout(45000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Referer': 'https://mixkit.co/' }
    });

    if (!res.ok) {
      return new Response('Upstream error: ' + res.status + ' | ' + decoded, { status: 502 });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache 24h
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      }
    });

  } catch (err: any) {
    console.error('[ImageProxy] Error:', err.message);
    return new Response('Proxy error: ' + err.message, { status: 500 });
  }
}



