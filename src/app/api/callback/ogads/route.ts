import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
    
    if (!aff_sub) {
        console.error('[OGADS_CALLBACK] ERROR: Missing aff_sub (ID)');
        return NextResponse.json({ error: 'Missing Identity' }, { status: 400 });
    }

    const userId = String(aff_sub);
    const payout = parseFloat(String(payoutRaw || '0'));

    // 🔱 SYNDICATE PRECISION CALCULATION: 1,000 Credits per $1.00 USD
    const totalCredits = Math.round(payout) * 1000;

    console.log(`[OGADS_CALLBACK] Received Request // User: ${userId} // Payout: $${payout} // Credits: ${totalCredits}`);

    try {
        // 🧬 IDENTITY RESOLUTION: Registered vs Guest
        const isGuest = userId.startsWith('guest_') || userId.includes('syndicate_guest');

        if (isGuest) {
            console.log(`[OGADS_GUEST] Processing Guest: ${userId}`);
            
            // Upsert the guest record with the new balance
            const { error: guestError } = await supabaseAdmin
                .from('anonymous_guest_sync')
                .upsert({
                    guest_id: userId,
                    total_earned_credits: totalCredits,
                    last_active_at: new Date().toISOString()
                }, { onConflict: 'guest_id' });

            if (guestError) {
                // If update fails, try an incremental update if the row exists
                await supabaseAdmin.rpc('increment_guest_credits', { 
                    t_guest_id: userId, 
                    amount: totalCredits 
                });
            }
        } else {
            console.log(`[OGADS_PRO] Processing Registered Member: ${userId}`);
            
            // Standard Profile Reward
            const { error: profileError } = await supabaseAdmin.rpc('increment_user_balance', {
                target_user_id: userId,
                amount: totalCredits
            });

            if (profileError) throw profileError;
        }

        return NextResponse.json({ success: true, message: 'Syndicate Reward Infused' });
    } catch (err) {
        console.error('[OGADS_CALLBACK_FAILURE]:', err);
        return NextResponse.json({ error: 'Internal Relay Failure' }, { status: 500 });
    }
}
