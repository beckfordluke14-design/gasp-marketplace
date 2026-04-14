import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const ogToken = "43203|vPiLg7nTbuG68qZGxZKCyRBsMF0HxKcRKEL9C8iP14ea15f5";
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '8.8.8.8';
    const ua = req.headers.get('user-agent') || '';

    const endpoints = [
        "https://members.ogads.com/api/v2/offers",
        "https://members.ogads.com/api/v1/offers",
        "https://members.ogads.com/offers"
    ];

    const results: any[] = [];

    for (const endpoint of endpoints) {
        try {
            const res = await fetch(`${endpoint}?ip=${ip}&ua=${encodeURIComponent(ua)}`, {
                cache: 'no-store',
                headers: { 'Authorization': `Bearer ${ogToken}` }
            });
            const text = await res.text();
            let json: any = null;
            try { json = JSON.parse(text); } catch {}
            results.push({
                endpoint,
                status: res.status,
                ok: res.ok,
                offer_count: json?.data?.length || json?.offers?.length || 0,
                sample: json?.data?.[0] || json?.offers?.[0] || null,
                raw_preview: text.substring(0, 200)
            });
        } catch (e: any) {
            results.push({ endpoint, error: e.message });
        }
    }

    return NextResponse.json({ ip_used: ip, results });
}
