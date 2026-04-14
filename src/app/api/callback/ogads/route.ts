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
    const payout = parseFloat(String(payoutRaw || '0'));

    try {
        // 🔱 USE OFFICIAL ECONOMY ENGINE
        await issueCredits({
            userId,
            actualAmountUsd: payout,
            provider: 'ogads',
            txId: conversionId,
            meta: { 
                network: 'ogads',
                payoutRaw 
            }
        });

        console.log(`[OGADS_CALLBACK] ✅ REWARD INFUSED: User ${userId} ($${payout})`);
        return NextResponse.json({ success: true, message: 'Syndicate Reward Infused' });
    } catch (err) {
        console.error('[OGADS_CALLBACK_FAILURE]:', err);
        return NextResponse.json({ error: 'Internal Relay Failure' }, { status: 500 });
    }
}
