import { NextRequest, NextResponse } from 'next/server';

/**
 * 🛰️ SYNDICATE MISSION RELAY (CPAGrip Proxy)
 * Fetches the live offer feed for the user's current IP/Device.
 */
export async function GET(req: NextRequest) {
    const userId = "76614";
    const pubkey = "8bd95e1c09ee9d064aaea6f28427974c";
    const key = "b820c00efb2b75d05913c939001baab2";
    
    // 🛡️ SECURITY: Detect User IP and Agent to pass to CPAGrip
    // This ensures the feed shows offers the user can ACTUALLY complete.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip');
    const ua = req.headers.get('user-agent');
    
    const url = `https://www.cpagrip.com/common/offer_feed_json.php?user_id=${userId}&pubkey=${pubkey}&key=${key}${ip ? `&ip=${ip}` : ''}${ua ? `&ua=${encodeURIComponent(ua)}` : ''}`;

    try {
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        
        // 🧪 OPTIMIZATION: Filter for High-Intent / High-Payout categories only
        const missions = (data.offers || []).slice(0, 10).map((offer: any) => ({
            id: offer.offerid,
            title: offer.title,
            description: offer.adcopy,
            payout: parseFloat(offer.payout),
            link: offer.link,
            type: offer.type, // Desktop vs Mobile
            category: offer.category
        }));

        return NextResponse.json({ success: true, missions });
    } catch (err) {
        console.error('[Mission Relay Failure]:', err);
        return NextResponse.json({ success: false, error: 'Syndicate Network Offline' }, { status: 500 });
    }
}
