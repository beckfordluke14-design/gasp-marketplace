import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get('id');

    // 📡 SOVEREIGN SETTLEMENT MAP: Link package IDs to Payment URLs
    const checkoutLinks: Record<string, string> = {
        'starter': 'https://buy.stripe.com/abc_starter_link', // Replace with your link
        'member': 'https://buy.stripe.com/abc_member_link',
        'prime': 'https://buy.stripe.com/abc_prime_link',
        'whale': 'https://buy.stripe.com/abc_whale_link',
    };

    const target = checkoutLinks[packageId || 'starter'] || checkoutLinks['starter'];
    
    // 👋 REDIRECT TO REVENUE CAPTURE
    return NextResponse.redirect(target);
}