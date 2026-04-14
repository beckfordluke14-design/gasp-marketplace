import { NextRequest, NextResponse } from 'next/server';

/**
 * 🛰️ SYNDICATE MISSION RELAY (Ogads Proxy)
 * Fetches the live offer feed for the user's current IP/Device.
 */
export async function GET(req: NextRequest) {
    const ogToken = "43203|vPiLg7nTbuG68qZGxZKCyRBsMF0HxKcRKEL9C8iP14ea15f5";
    const ogEndpoint = "https://authenticateapp.online/api/v2/offers";
    
    // 🛡️ SECURITY: Detect User IP and Agent
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '';
    const ua = req.headers.get('user-agent') || '';
    
    const { searchParams } = new URL(req.url);
    const trackingId = searchParams.get('trackingId') || 'syndicate_guest';
    
    try {
        // 🛰️ ELITE OGADS PULL: High Tracking Fidelity
        const ogRes = await fetch(`${ogEndpoint}?ip=${ip}&ua=${encodeURIComponent(ua)}`, { 
            cache: 'no-store',
            headers: { 'Authorization': `Bearer ${ogToken}` }
        }).then(r => r.json()).catch(() => ({ data: [] }));
        
        const rawOffers = ogRes.data || ogRes.offers || [];

        // 🧪 FILTER, SORT, AND MAP IN ONE PASS
        const missions = rawOffers
            .filter((o: any) => {
                const title = o.name || o.title || '';
                const desc = o.description || '';
                return !['survey', 'questionnaire', 'opinion', 'poll'].some(term => 
                    title.toLowerCase().includes(term) || desc.toLowerCase().includes(term)
                );
            })
            .sort((a: any, b: any) => {
                const soiKeywords = ['soi', 'single opt-in', 'email submit', 'zip submit', 'fast submit', '60s'];
                const highValue = ['win', 'iphone', 'cashapp', 'amazon', 'paypal', 'gift card', 'ps5', 'xbox', 'minute'];
                const titleA = (a.name || a.title || '').toLowerCase();
                const titleB = (b.name || b.title || '').toLowerCase();
                
                const isSOIA = soiKeywords.some(term => titleA.includes(term)) ? 5 : 0;
                const isSOIB = soiKeywords.some(term => titleB.includes(term)) ? 5 : 0;
                const scoreA = (highValue.some(term => titleA.includes(term)) ? 2 : 0) + isSOIA;
                const scoreB = (highValue.some(term => titleB.includes(term)) ? 2 : 0) + isSOIB;
                
                return (scoreB - scoreA) || (parseFloat(b.payout || '0') - parseFloat(a.payout || '0'));
            })
            .slice(0, 25)
            .map((o: any) => {
                const payout = parseFloat(o.payout || '0');
                return {
                    id: `og_${o.id || o.offerid}`,
                    title: o.name || o.title,
                    description: o.description || 'Complete this task to earn credits.',
                    payout: Math.ceil((payout * 1000) / 10) * 10,
                    link: `${o.link}${o.link.includes('?') ? '&' : '?'}aff_sub=${trackingId}`,
                    type: o.type || 'Mobile',
                    network: 'Ogads'
                };
            });

        return NextResponse.json({ success: true, missions });
    } catch (err) {
        console.error('[Ogads Relay Failure]:', err);
        return NextResponse.json({ success: false, error: 'Syndicate Network Offline' }, { status: 500 });
    }
}
