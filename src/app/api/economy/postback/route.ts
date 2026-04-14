import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 🛰️ SYNDICATE POSTBACK NODE v1.0
 * Receives completion signals from OGAds / CPA Networks.
 * URL for OGAds Dashboard: https://your-domain.com/api/economy/postback?uid={unique_id}&payout={payout_amount}&offer_id={offer_id}
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    
    // 🧬 EXTRACT SIGNAL DATA
    const guestId = searchParams.get('uid'); // The Guest/User ID we passed in the link
    const rawPayout = searchParams.get('payout'); // The dollar amount or credit value
    const offerId = searchParams.get('offer_id');

    if (!guestId || !rawPayout) {
        return NextResponse.json({ error: 'Incomplete Signal' }, { status: 400 });
    }

    try {
        // 🧬 CALIBRATE PAYOUT
        // OGAds usually sends dollar amount (e.g. 2.88). We multiply by 1000 for our Economy.
        const creditValue = Math.floor(parseFloat(rawPayout) * 1000);

        if (isNaN(creditValue) || creditValue <= 0) {
            return NextResponse.json({ error: 'Invalid Payout' }, { status: 400 });
        }

        // 🛡️ ATOMIC DEPOSIT
        // Update the Guest's balance in the DB instantly.
        const updatedUser = await prisma.guest.update({
            where: { id: guestId },
            data: {
                credits: { increment: creditValue }
            }
        });

        console.log(`[POSTBACK SUCCESS] Node ${offerId} cleared for Guest ${guestId}. +${creditValue} CR.`);

        // 🛰️ SIGNAL OK TO NETWORK
        return new NextResponse('OK', { status: 200 }); // CPA Networks expect a literal 'OK' or 200 status
        
    } catch (err: any) {
        console.error('[POSTBACK ERROR]:', err.message);
        return NextResponse.json({ error: 'Uplink Failed' }, { status: 500 });
    }
}
