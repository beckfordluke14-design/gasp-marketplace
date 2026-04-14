import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const ogToken = "43203|vPiLg7nTbuG68qZGxZKCyRBsMF0HxKcRKEL9C8iP14ea15f5";
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '8.8.8.8';
    const ua = req.headers.get('user-agent') || '';

    try {
        // Try the v2 endpoint
        const res = await fetch(`https://authenticateapp.online/api/v2/offers?ip=${ip}&ua=${encodeURIComponent(ua)}`, {
            cache: 'no-store',
            headers: { 'Authorization': `Bearer ${ogToken}` }
        });

        const text = await res.text();
        let json: any = null;
        try { json = JSON.parse(text); } catch {}

        return NextResponse.json({
            status: res.status,
            ip_used: ip,
            raw_keys: json ? Object.keys(json) : null,
            offer_count: json?.data?.length || json?.offers?.length || 0,
            sample: json?.data?.[0] || json?.offers?.[0] || json,
            raw_text_preview: text.substring(0, 500)
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message });
    }
}
