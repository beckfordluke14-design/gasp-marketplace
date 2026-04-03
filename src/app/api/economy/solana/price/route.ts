import { NextResponse } from 'next/server';

/**
 * 🛡️ SOVEREIGN SERVER-SIDE ORACLE
 * Fetches the real-time SOL/USD price from multiple sources to bypass browser CORS blocks.
 */
export async function GET() {
    try {
        // Source 1: DexScreener (High Reliability, No Auth)
        const dRes = await fetch('https://api.dexscreener.com/latest/dex/pairs/solana/83w5pydpoy9g8r8k6z3a6p5r4v5d5p1n3e7e2y7m', { next: { revalidate: 15 } });
        const dData = await dRes.json();
        const p1 = dData.pairs?.[0]?.priceUsd;
        if (p1) return NextResponse.json({ success: true, price: parseFloat(p1) });

        // Source 2: CoinGecko (Global Stable)
        const gRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', { next: { revalidate: 15 } });
        const gData = await gRes.json();
        if (gData.solana?.usd) return NextResponse.json({ success: true, price: parseFloat(gData.solana.usd) });

        return NextResponse.json({ success: false, error: 'All feeds lagging' }, { status: 503 });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
