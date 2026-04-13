import { NextRequest, NextResponse } from 'next/server';

/**
 * 🛰️ SYNDICATE MISSION RELAY (CPAGrip Proxy)
 * Fetches the live offer feed for the user's current IP/Device.
 */
export async function GET(req: NextRequest) {
    const userId = "76614";
    const pubkey = "8bd95e1c09ee9d064aaea6f28427974c";
    const key = "b820c00efb2b75d05913c939001baab2"; // Confirmed Private Key
    
    // 🛡️ SECURITY: Detect User IP and Agent to pass to CPAGrip
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip');
    const ua = req.headers.get('user-agent');
    
    // 🛰️ IDENTITY SYNC: Pass the visitor's ID to CPAGrip for tracking
    const { searchParams } = new URL(req.url);
    const trackingId = searchParams.get('trackingId') || 'syndicate_guest';
    
    const url = `https://www.cpagrip.com/common/offer_feed_json.php?user_id=${userId}&pubkey=${pubkey}&key=${key}&showmobile=yes&showall=yes${trackingId ? `&tracking_id=${trackingId}` : ''}${ip ? `&ip=${ip}` : ''}${ua ? `&ua=${encodeURIComponent(ua || '')}` : ''}`;

    try {
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        
        // 🧪 VELOCITY OPTIMIZATION: Filter for Instant-Gratification offers (Sweepstakes, Installs)
        // We prioritize non-survey offers to prevent user drop-off.
        let finalOffers = (data.offers || []).filter((offer: any) => {
            const lowQuality = ['survey', 'questionnaire', 'opinion', 'poll'].some(term => 
                offer.title.toLowerCase().includes(term) || 
                offer.adcopy.toLowerCase().includes(term)
            );
            return !lowQuality;
        });

        // 🛡️ SMART FALLBACK: If the high-velocity filter kills all offers, show everything.
        // Better to show a survey than an empty screen.
        if (finalOffers.length === 0) {
            console.warn('[Mission Relay] Hyper-Velocity results empty. Falling back to global feed.');
            finalOffers = data.offers || [];
        }

        // 🧬 SORT BY RECOGNITION: Prioritize high-intent brands (iPhone, CashApp, Amazon, PayPal)
        const prioritized = finalOffers.sort((a: any, b: any) => {
            const highValue = ['win', 'iphone', 'cashapp', 'amazon', 'paypal', 'gift card', 'ps5', 'xbox', '60s', 'minute'];
            const scoreA = highValue.some(term => a.title.toLowerCase().includes(term)) ? 1 : 0;
            const scoreB = highValue.some(term => b.title.toLowerCase().includes(term)) ? 1 : 0;
            return scoreB - scoreA;
        });

        const missions = prioritized.slice(0, 10).map((offer: any) => ({
            id: offer.offerid,
            title: offer.title,
            description: offer.adcopy,
            payout: parseFloat(offer.payout),
            link: offer.link,
            type: offer.type, 
            category: offer.category
        }));

        return NextResponse.json({ success: true, missions });
    } catch (err) {
        console.error('[Mission Relay Failure]:', err);
        return NextResponse.json({ success: false, error: 'Syndicate Network Offline' }, { status: 500 });
    }
}
