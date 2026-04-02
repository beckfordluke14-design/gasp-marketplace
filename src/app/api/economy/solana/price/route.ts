import { NextResponse } from 'next/server';

/**
 * 🛡️ SOVEREIGN SERVER-SIDE ORACLE
 * Fetches the real-time SOL/USD price from multiple sources to bypass browser CORS blocks.
 */
export async function GET() {
    try {
        // Source 1: Jupiter v2
        const jRes = await fetch('https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112', { next: { revalidate: 15 } });
        const jData = await jRes.json();
        const p1 = jData.data['So11111111111111111111111111111111111111112']?.price;
        if (p1) return NextResponse.json({ success: true, price: parseFloat(p1) });

        // Source 2: Binance Fallback
        const bRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT', { next: { revalidate: 15 } });
        const bData = await bRes.json();
        if (bData.price) return NextResponse.json({ success: true, price: parseFloat(bData.price) });

        return NextResponse.json({ success: false, error: 'All feeds lagging' }, { status: 503 });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
