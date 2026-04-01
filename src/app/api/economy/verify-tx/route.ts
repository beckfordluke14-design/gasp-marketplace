import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { db } from '@/lib/db';
import { SYNDICATE_TREASURY_SOL, USDC_MINT_SOL } from '@/lib/economy/constants';

/**
 * 🛰️ SOVEREIGN TRANSACTION VERIFIER v6.0
 * Objective: Direct On-Chain Fulfillment for the Archive Bridge.
 */
export async function POST(req: Request) {
    try {
        const { signature, userId, amountUsdc, expectedCredits } = await req.json();

        if (!signature || !userId || !amountUsdc) {
            return NextResponse.json({ success: false, error: 'Missing critical identifiers.' }, { status: 400 });
        }

        console.log(`📡 [Verifier] Checking signature: ${signature} for user: ${userId}`);

        // 🧿 REAL-TIME BLOCKCHAIN UPLINK
        const connection = new Connection(
            process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
            'confirmed'
        );

        // Wait up to 30 seconds for confirmation if it's a fresh signature
        const status = await connection.getSignatureStatus(signature);
        if (status?.value?.err) {
            return NextResponse.json({ success: false, error: 'Transaction failed on-chain.' }, { status: 400 });
        }

        // 🛡️ REVENUE-WATCHER: Confirm successful transaction details
        const tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
        });

        if (!tx) {
            return NextResponse.json({ success: false, error: 'Transaction not found or not yet indexed.' }, { status: 404 });
        }

        // Verify it was a successful USDC transfer to our vault
        // 🧬 Logic: Loop through token balances changes and find the one that matches our DGQ vault
        const postTokenBalances = tx.meta?.postTokenBalances || [];
        const preTokenBalances = tx.meta?.preTokenBalances || [];

        const vaultBalanceAfter = postTokenBalances.find(
            b => b.owner === SYNDICATE_TREASURY_SOL && b.mint === USDC_MINT_SOL
        );
        const vaultBalanceBefore = preTokenBalances.find(
            b => b.owner === SYNDICATE_TREASURY_SOL && b.mint === USDC_MINT_SOL
        ) || { uiTokenAmount: { uiAmount: 0 } };

        const actualReceived = (vaultBalanceAfter?.uiTokenAmount.uiAmount || 0) - (vaultBalanceBefore?.uiTokenAmount.uiAmount || 0);

        // Allow for 1.5% margin for swap slippage/fees
        const minimumRequired = amountUsdc * 0.985;

        if (actualReceived < minimumRequired) {
             console.error(`❌ [Verifier] Amount Failure. Received: ${actualReceived}, Required: ${minimumRequired}`);
             return NextResponse.json({ success: false, error: 'Verification Failed: Incorrect amount received.' }, { status: 400 });
        }

        console.log(`✅ [Verifier] Payment Validated: ${actualReceived} USDC received.`);

        // 🏦 CREDIT INJECTION
        await db.query(`
            UPDATE profiles 
            SET credits = credits + $1 
            WHERE id = $2
        `, [expectedCredits, userId]);

        // Log the success
        await db.query(`
            INSERT INTO transactions (user_id, amount, type, provider, meta, created_at)
            VALUES ($1, $2, 'credit_buy', 'jupiter_direct', $3, NOW())
        `, [userId, actualReceived, JSON.stringify({ signature, source: 'jupiter_bridge' })]);

        return NextResponse.json({ 
            success: true, 
            creditsGranted: expectedCredits,
            newBalance: actualReceived 
        });

    } catch (err: any) {
        console.error('❌ [Verifier] Critical Fault:', err.message);
        return NextResponse.json({ success: false, error: `Critical System Fault: ${err.message}` }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ status: 'ACTIVE // SOVEREIGN_UPLINK_6.0' });
}
