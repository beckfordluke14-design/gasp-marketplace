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

        const missions = rawOffers.map((o: any) => ({
            id: `og_${o.id || o.offerid}`,
            title: o.name || o.title,
            description: o.description || 'Complete this task to earn credits.',
            payout: parseFloat(o.payout || '0'),
            link: `${o.link}${o.link.includes('?') ? '&' : '?'}aff_sub=${trackingId}`,
            type: o.type || 'Mobile',
            network: 'Ogads'
        }))
        .filter((offer: any) => {
            // 🧪 VELOCITY OPTIMIZATION: Filter for Instant-Gratification
            const lowQuality = ['survey', 'questionnaire', 'opinion', 'poll'].some(term => 
                offer.title.toLowerCase().includes(term) || 
                offer.description.toLowerCase().includes(term)
            );
            return !lowQuality;
        })
        .sort((a: any, b: any) => {
            const soiKeywords = ['soi', 'single opt-in', 'email submit', 'zip submit', 'fast submit', '60s'];
            const highValue = ['win', 'iphone', 'cashapp', 'amazon', 'paypal', 'gift card', 'ps5', 'xbox', 'minute'];
            
            const isSOIA = soiKeywords.some(term => a.title.toLowerCase().includes(term) || a.description.toLowerCase().includes(term)) ? 5 : 0;
            const isSOIB = soiKeywords.some(term => b.title.toLowerCase().includes(term) || b.description.toLowerCase().includes(term)) ? 5 : 0;
            
            const scoreA = (highValue.some(term => a.title.toLowerCase().includes(term)) ? 2 : 0) + isSOIA;
            const scoreB = (highValue.some(term => b.title.toLowerCase().includes(term)) ? 2 : 0) + isSOIB;
            
            const priorityVal = scoreB - scoreA;
            if (priorityVal !== 0) return priorityVal;
            return parseFloat(b.payout || '0') - parseFloat(a.payout || '0');
        })
        .slice(0, 25).map(o => {
            const payout = parseFloat(o.payout || '0');
            const credits = Math.ceil((payout * 1000) / 10) * 10;
            return {
                id: o.id,
                title: o.name,
                description: o.description,
                payout: credits, // Show the exact number of credits they get
                link: o.link,
                type: o.type,
                network: o.network
            };
        });

        return NextResponse.json({ success: true, missions });
    } catch (err) {
        console.error('[Ogads Relay Failure]:', err);
        return NextResponse.json({ success: false, error: 'Syndicate Network Offline' }, { status: 500 });
    }
}
