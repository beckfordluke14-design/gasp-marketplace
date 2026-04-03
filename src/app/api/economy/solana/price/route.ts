import { NextResponse } from 'next/server';

/**
 * 🛡️ SOVEREIGN SOL/USD ORACLE
 * Source 1: CoinGecko (most accurate global price)
 * Source 2: Binance (high-speed fallback)
 */
export async function GET() {
    try {
        // Source 1: CoinGecko — accurate global SOL/USD spot price
        const gRes = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
            { next: { revalidate: 10 } }
        );
        const gData = await gRes.json();
        if (gData?.solana?.usd) {
            return NextResponse.json({ success: true, price: parseFloat(gData.solana.usd) });
        }
    } catch (_) {}

    try {
        // Source 2: Binance fallback
        const bRes = await fetch(
            'https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT',
            { next: { revalidate: 10 } }
        );
        const bData = await bRes.json();
        if (bData?.price) {
            return NextResponse.json({ success: true, price: parseFloat(bData.price) });
        }
    } catch (_) {}

    return NextResponse.json({ success: false, error: 'All price feeds unavailable' }, { status: 503 });
}
