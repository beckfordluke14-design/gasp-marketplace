import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { issueCredits } from '@/lib/economy/issueCredits';
import { getServerSideProfile } from '@/lib/auth';

/**
 * 🛡️ SOVEREIGN ADMIN: MANUAL CREDIT GRANT
 * Allows admins to manually override and issue credits for manual reconciliation.
 */
export async function POST(req: Request) {
    try {
        const profile = await getServerSideProfile();
        if (!profile?.is_admin) {
            return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 403 });
        }

        const { targetUserId, amountUsd, reason } = await req.json();

        if (!targetUserId || !amountUsd) {
            return NextResponse.json({ success: false, error: 'MISSING_DATA' }, { status: 400 });
        }

        // 🧬 MANUAL INFUSION PROTOCOL
        const result = await issueCredits({
            userId: targetUserId,
            actualAmountUsd: parseFloat(amountUsd),
            provider: 'admin_override',
            txId: `ADMIN-${Date.now()}`,
            meta: {
                adminIssuer: profile.id,
                reason: reason || 'Manual Support Reconciliation',
                timestamp: new Date().toISOString()
            }
        });

        return NextResponse.json({ 
            success: true, 
            credits: result.credits,
            userBalance: result.newBalance 
        });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
