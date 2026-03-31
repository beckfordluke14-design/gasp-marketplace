import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') || '12';
        const active = searchParams.get('active') || 'true';
        const closed = searchParams.get('closed') || 'false';

        const res = await fetch(`https://gamma-api.polymarket.com/events?limit=${limit}&active=${active}&closed=${closed}&tag_slug=weather`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            },
            next: { revalidate: 3 } // Very short cache to simulate live
        });

        if (!res.ok) {
            console.error('Proxy failed to fetch Polymarket API:', res.status, res.statusText);
            return NextResponse.json({ error: 'Upstream failed' }, { status: 502 });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Polymarket Proxy Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
