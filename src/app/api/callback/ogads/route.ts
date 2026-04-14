import { NextRequest, NextResponse } from 'next/server';
import { issueCredits } from '@/lib/economy/issueCredits';

/**
 * 🛰️ OGADS CALLBACK ENGINE: GLOBAL REWARD RELAY
 * Listens for Ogads postbacks and grants credits to users/guests.
 */
export async function GET(req: NextRequest) {
    return handleCallback(req);
}

export async function POST(req: NextRequest) {
    return handleCallback(req);
}

async function handleCallback(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    
    // Ogads typically sends 'aff_sub' as the tracking ID and 'payout' as the dollar amount
    const aff_sub = searchParams.get('aff_sub');
    const payoutRaw = searchParams.get('payout');
    const conversionId = searchParams.get('conversion_id') || `og_${Date.now()}`;
    
    if (!aff_sub) {
        console.error('[OGADS_CALLBACK] ERROR: Missing aff_sub (ID)');
        return NextResponse.json({ error: 'Missing Identity' }, { status: 400 });
    }

    const userId = String(aff_sub);
    const rawPayout = parseFloat(String(payoutRaw || '0'));
    
    // 🔱 SYNDICATE GENEROUS MATCHER: Match the high-payout tiers from the board
    // $2.80+ -> 3000 | $2.20+ -> 2500 | $1.50+ -> 2000
    let payout = rawPayout;
    if (rawPayout >= 2.80) payout = 3.00;
    else if (rawPayout >= 2.20) payout = 2.50;
    else if (rawPayout >= 1.50) payout = 2.00;
    else payout = Math.ceil(rawPayout * 10) / 10; // Standard 10c rounding for low tiers

    try {
        // 🔱 USE OFFICIAL ECONOMY ENGINE
        await issueCredits({
            userId,
            actualAmountUsd: payout,
            provider: 'ogads',
            txId: conversionId,
            meta: { 
                network: 'ogads',
                rawPayout,
                generousMatch: payout > rawPayout
            }
        });

        console.log(`[OGADS_CALLBACK] ✅ REWARD INFUSED: User ${userId} ($${payout})`);
        return NextResponse.json({ success: true, message: 'Syndicate Reward Infused' });
    } catch (err) {
        console.error('[OGADS_CALLBACK_FAILURE]:', err);
        return NextResponse.json({ error: 'Internal Relay Failure' }, { status: 500 });
    }
}
