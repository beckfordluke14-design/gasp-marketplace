import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing URL', { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!res.ok) {
        // Fallback to Pollinations if the primary path is dead
        if (targetUrl.includes('hero.jpg')) {
            const idMatch = targetUrl.match(/personas\/(.*?)\//);
            const id = idMatch ? idMatch[1] : 'unknown';
            const fallback = `https://image.pollinations.ai/prompt/portrait of a young woman?seed=${id}&nologo=true`;
            const fallRes = await fetch(fallback);
            const data = await fallRes.arrayBuffer();
            return new NextResponse(data, {
                headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000' }
            });
        }
        return new NextResponse('Fetch failed', { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const data = await res.arrayBuffer();

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    console.error('Proxy Error:', err);
    return new NextResponse('Internal Error', { status: 500 });
  }
}



