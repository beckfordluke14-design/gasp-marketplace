import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { db } from '@/lib/db';
import { SYNDICATE_TREASURY_SOL, USDC_MINT_SOL } from '@/lib/economy/constants';

/**
 * 🛰️ SOVEREIGN TRANSACTION AUDITOR v7.0 // DYNAMIC GRANT ENGINE
 * Objective: Verify actual on-chain settlement and grant credits dynamically.
 * Security: Prevents underpayment fraud by auditing the specific vault balance change.
 */
export async function POST(req: Request) {
    try {
        const { signature, userId } = await req.json();

        if (!signature || !userId) {
            return NextResponse.json({ success: false, error: 'Missing critical identifiers.' }, { status: 400 });
        }

        console.log(`📡 [Auditor] Auditing signature: ${signature} for user: ${userId}`);

        // 🧿 REAL-TIME BLOCKCHAIN UPLINK
        const connection = new Connection(
            process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
            'confirmed'
        );

        // Fetch transaction with full metadata
        const tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
        });

        if (!tx) {
            return NextResponse.json({ success: false, error: 'Transaction not found or not yet indexed.' }, { status: 404 });
        }

        // 🛡️ REVENUE-WATCHER: Audit vault balance changes
        const postTokenBalances = tx.meta?.postTokenBalances || [];
        const preTokenBalances = tx.meta?.preTokenBalances || [];

        const vaultBalanceAfter = postTokenBalances.find(
            b => b.owner === SYNDICATE_TREASURY_SOL && b.mint === USDC_MINT_SOL
        );
        const vaultBalanceBefore = preTokenBalances.find(
            b => b.owner === SYNDICATE_TREASURY_SOL && b.mint === USDC_MINT_SOL
        ) || { uiTokenAmount: { uiAmount: 0 } };

        const actualReceived = (vaultBalanceAfter?.uiTokenAmount.uiAmount || 0) - (vaultBalanceBefore?.uiTokenAmount.uiAmount || 0);

        // Check for validity
        if (actualReceived <= 0) {
             console.error(`❌ [Auditor] Zero/Negative Balance detected. Received: ${actualReceived}`);
             return NextResponse.json({ success: false, error: 'Verification Failed: No USDC deposit detected in treasury.' }, { status: 400 });
        }

        // 🧬 DYNAMIC CREDIT CALCULATION (INSTITUTIONAL AUDIT)
        // Rate: 100 base credits per 1 USDC
        // Bonus Tiers based on ACTUAL amount received
        let bonusMultiplier = 1;
        if (actualReceived >= 100) bonusMultiplier = 1.40; // 40% Bonus
        else if (actualReceived >= 50) bonusMultiplier = 1.25; // 25% Bonus
        else if (actualReceived >= 19.99) bonusMultiplier = 1.15; // 15% Bonus

        const creditsToGrant = Math.floor(actualReceived * 100 * bonusMultiplier);

        console.log(`✅ [Auditor] Validated: ${actualReceived} USDC received. Dynamic Grant: ${creditsToGrant} Credits.`);

        // 🏦 CREDIT INJECTION
        await db.query(`
            UPDATE profiles 
            SET credits = credits + $1 
            WHERE id = $2
        `, [creditsToGrant, userId]);

        // Log the success in the ledger
        await db.query(`
            INSERT INTO transactions (user_id, amount, type, provider, meta, created_at)
            VALUES ($1, $2, 'credit_buy', 'on_chain_audit', $3, NOW())
        `, [
            userId, 
            actualReceived, 
            JSON.stringify({ 
                signature, 
                bonus_applied: `${(bonusMultiplier - 1) * 100}%`, 
                raw_usdc: actualReceived,
                timestamp: new Date().toISOString()
            })
        ]);

        return NextResponse.json({ 
            success: true, 
            creditsGranted: creditsToGrant,
            actualReceived: actualReceived,
            bonus: `${(bonusMultiplier - 1) * 100}%`
        });

    } catch (err: any) {
        console.error('❌ [Auditor] Critical Fault:', err.message);
        return NextResponse.json({ success: false, error: `Critical Audit Fault: ${err.message}` }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ status: 'ACTIVE // SOVEREIGN_AUDITOR_7.0' });
}
