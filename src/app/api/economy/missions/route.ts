import { NextRequest, NextResponse } from 'next/server';
import { SYNDICATE_CONFIG } from '@/lib/economy/monetizationConfig';

/**
 * 🛰️ SYNDICATE MISSION RELAY
 * Returns the curated OGAds SOI mission stack.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const trackingId = searchParams.get('trackingId') || 'syndicate_guest';
    const SMART_LINK = SYNDICATE_CONFIG.getSmartLink(trackingId);

    // 🧬 OGADS CORE STACK (Verified Conversion Velocity)
    const missions = [
        {
            id: 'og_71281',
            title: 'Unlock $1,000 Mystery Gift Box',
            description: 'Enter your email to clear the signal and unlock the Mystery Box rewards.',
            payout: 3000,
            link: SMART_LINK,
            type: 'Identity Clearance',
            network: 'OGAds'
        },
        {
            id: 'og_69344',
            title: 'Verify $750 CashApp Uplink',
            description: 'Provide email to verify your CashApp eligibility and unlock archive access.',
            payout: 2500,
            link: SMART_LINK,
            type: 'Account Sync',
            network: 'OGAds'
        },
        {
            id: 'og_71456',
            title: 'Claim $1,000 Kroger Voucher',
            description: 'Choose your preferred node to clear the scan.',
            payout: 2400,
            link: SMART_LINK,
            type: 'Lead Gen',
            network: 'OGAds'
        },
        {
            id: 'og_70774',
            title: 'Win $50,000 Cash Sweepstakes',
            description: 'High-value node clearance required for deep-archive access.',
            payout: 2500,
            link: SMART_LINK,
            type: 'Core Handshake',
            network: 'OGAds'
        },
        {
            id: 'og_57464',
            title: 'Win $100 PayPal Gift Card',
            description: 'Fast entry email submit to restore neural link.',
            payout: 2000,
            link: SMART_LINK,
            type: 'Identity Sync',
            network: 'OGAds'
        },
        {
            id: 'og_43399',
            title: 'Install Opera GX Portal',
            description: 'Instant node activation via browser portal installation.',
            payout: 2000,
            link: SMART_LINK,
            type: 'Node Install',
            network: 'OGAds'
        }
    ];

    return NextResponse.json({ success: true, missions });
}
