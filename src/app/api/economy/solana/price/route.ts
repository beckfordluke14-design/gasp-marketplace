import { NextResponse } from 'next/server';

/**
 * 🛡️ SOVEREIGN SOL/USD ORACLE
 * Source 1: CoinGecko (most accurate global price)
 * Source 2: Binance (high-speed fallback)
 */
export async function GET() {
    try {
        const prices: number[] = [];

        // Source 1: CoinGecko — accurate global SOL/USD spot price
        try {
            const gRes = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
                { next: { revalidate: 15 } }
            );
            const gData = await gRes.json();
            if (gData?.solana?.usd) prices.push(parseFloat(gData.solana.usd));
        } catch (_) {}

        // Source 2: Binance — high-speed trading pair
        try {
            const bRes = await fetch(
                'https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT',
                { next: { revalidate: 15 } }
            );
            const bData = await bRes.json();
            if (bData?.price) prices.push(parseFloat(bData.price));
        } catch (_) {}

        // Source 3: Kraken — institutional-grade spot
        try {
            const kRes = await fetch(
                'https://api.kraken.com/0/public/Ticker?pair=SOLUSD',
                { next: { revalidate: 15 } }
            );
            const kData = await kRes.json();
            const kVal = kData?.result?.SOLUSD?.c?.[0];
            if (kVal) prices.push(parseFloat(kVal));
        } catch (_) {}

        if (prices.length > 0) {
            const finalPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            return NextResponse.json({ 
                success: true, 
                price: parseFloat(finalPrice.toFixed(2)),
                sources: prices.length
            });
        }
    } catch (e: any) {
        console.error('[Oracle Engine] Global Fault:', e.message);
    }

    return NextResponse.json({ success: false, error: 'All price feeds unavailable' }, { status: 503 });
}
