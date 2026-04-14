import { NextRequest, NextResponse } from 'next/server';

/**
 * 🛰️ SYNDICATE MISSION RELAY
 * Returns the curated SOI mission stack loaded into the Ogads Smart Link.
 * The Smart Link handles offer rotation per device/country.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const trackingId = searchParams.get('trackingId') || 'syndicate_guest';
    const SMART_LINK = `https://appchecker.space/sl/3181j?aff_sub=${trackingId}`;

    // 🔥 GENEROUS TIERS — Rounded up for maximum "Greed Factor"
    // $2.88 -> 3000 | $2.50 -> 2500 | $2.00 -> 2200
    const missions = [
        {
            id: 'og_71281',
            title: 'Get $1,000 Mystery Gift Box!',
            description: 'Enter your email for a chance to win a $1,000 Mystery Gift Box. US only.',
            payout: 3000,
            link: SMART_LINK,
            type: 'Email Submit',
            network: 'Ogads'
        },
        {
            id: 'og_57464',
            title: 'Win a $100 PayPal Gift Card!',
            description: 'Submit your email for a chance to win a $100 PayPal Gift Card. Fast and easy.',
            payout: 2500,
            link: SMART_LINK,
            type: 'Email Submit',
            network: 'Ogads'
        },
        {
            id: 'og_69344',
            title: 'Get $750 to your CashApp!',
            description: 'Enter your details for a chance to receive $750 directly to your CashApp.',
            payout: 2500,
            link: SMART_LINK,
            type: 'Email Submit',
            network: 'Ogads'
        },
        {
            id: 'og_59475',
            title: 'Win a $100 Chick-Fil-A Gift Card!',
            description: 'Complete a quick form for a chance to win a $100 Chick-Fil-A Gift Card.',
            payout: 2500,
            link: SMART_LINK,
            type: 'Email Submit',
            network: 'Ogads'
        },
        {
            id: 'og_68838',
            title: 'Win a new iPhone 17!',
            description: 'Enter your email for a chance to win the brand new iPhone 17. Limited time.',
            payout: 2500,
            link: SMART_LINK,
            type: 'Email Submit',
            network: 'Ogads'
        },
        {
            id: 'og_71456',
            title: 'Get $1,000 Kroger vs Aldi Voucher!',
            description: 'Which store do you prefer? Enter your email and win a $1,000 shopping voucher.',
            payout: 2500,
            link: SMART_LINK,
            type: 'Email Submit',
            network: 'Ogads'
        },
        {
            id: 'og_70774',
            title: 'Win $50,000 Cash!',
            description: 'Enter your email for a chance to win $50,000 in our sweepstakes. US residents only.',
            payout: 2500,
            link: SMART_LINK,
            type: 'Email Submit',
            network: 'Ogads'
        },
        {
            id: 'og_68283',
            title: 'Win an Adidas Gift Card!',
            description: 'Try your luck — submit your email for a chance to win an Adidas Gift Card.',
            payout: 2500,
            link: SMART_LINK,
            type: 'Email Submit',
            network: 'Ogads'
        },
        {
            id: 'og_68793',
            title: 'Win Amazon $1,000 Gift Card!',
            description: 'Enter your email for a chance to win a $1,000 Amazon Gift Card. Fast entry.',
            payout: 2000,
            link: SMART_LINK,
            type: 'Email Submit',
            network: 'Ogads'
        },
        {
            id: 'og_65107',
            title: '$500 Walmart Voucher — Enter Now!',
            description: 'Don\'t miss out! Submit your email for a chance to win a $500 Walmart voucher.',
            payout: 2000,
            link: SMART_LINK,
            type: 'Email Submit',
            network: 'Ogads'
        }
    ];

    return NextResponse.json({ success: true, missions });
}
