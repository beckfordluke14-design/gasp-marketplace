import { NextResponse } from 'next/server';
import { isAdminRequest, unauthorizedResponse } from '@/lib/auth';
import { issueCredits } from '@/lib/economy/issueCredits';

export const dynamic = 'force-dynamic';

/**
 * 🛡️ SOVEREIGN ADMIN: MANUAL CREDIT GRANT
 * Allows admins to manually override and issue credits.
 */
export async function POST(req: Request) {
    try {
        if (!(await isAdminRequest(req))) {
            return unauthorizedResponse();
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
