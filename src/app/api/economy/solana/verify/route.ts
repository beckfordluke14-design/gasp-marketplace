import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { db } from '@/lib/db';
import { issueCredits } from '@/lib/economy/issueCredits';
import { SYNDICATE_TREASURY_SOL } from '@/lib/economy/constants';

/**
 * 🛰️ SOVEREIGN ON-CHAIN VERIFIER v1.0
 * Verifies P2P Solana Transactions in real-time.
 * Strategy: Zero-Trust verification of USDC transfers to treasury.
 */

// USDC Mint Address on Solana
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export async function POST(req: Request) {
  try {
    const { signature, userId, expectedAmount } = await req.json();

    if (!signature || !userId) {
      return NextResponse.json({ success: false, error: 'MISSING_PAYLOAD' }, { status: 400 });
    }

    // 1. Check if this TX signature has ALREADY been used (Idempotency)
    const { rows: existing } = await db.query(
      `SELECT 1 FROM transactions WHERE meta->>'signature' = $1 LIMIT 1`,
      [signature]
    );
    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: 'SIGNATURE_ALREADY_REDEEMED' }, { status: 400 });
    }

    // 2. Connect to Solana Mainnet
    // Using a public RPC - should be replaced with Helius/Triton for high-traffic surge
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

    // 3. Fetch Transaction Details
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });

    if (!tx) {
      return NextResponse.json({ success: false, error: 'TRANSACTION_NOT_FOUND' }, { status: 404 });
    }

    // 🛡️ SECURITY AUDIT: Verify Destination, Amount, and Asset
    let actualAmountUsdc = 0;
    const treasuryPubkey = new PublicKey(SYNDICATE_TREASURY_SOL);
    
    // Look for Token Transfers (USDC)
    const postTokenBalances = tx.meta?.postTokenBalances || [];
    const preTokenBalances = tx.meta?.preTokenBalances || [];

    // Find the balance change for the treasury wallet
    const treasuryBalanceChange = postTokenBalances.find(b => 
      b.owner === SYNDICATE_TREASURY_SOL && 
      b.mint === USDC_MINT
    );

    if (!treasuryBalanceChange) {
       // Check inner instructions or simple transfers if it was a direct transfer
       // For a proper USDC onramp, it should be a Token Transfer
       return NextResponse.json({ success: false, error: 'NO_TREASURY_TRANSFER_DETECTED' }, { status: 400 });
    }

    const preBalance = preTokenBalances.find(b => b.owner === SYNDICATE_TREASURY_SOL && b.mint === USDC_MINT)?.uiTokenAmount?.uiAmount || 0;
    const postBalance = treasuryBalanceChange.uiTokenAmount?.uiAmount || 0;
    actualAmountUsdc = postBalance - preBalance;

    if (actualAmountUsdc <= 0) {
      return NextResponse.json({ success: false, error: 'ZERO_TRANSFER_DETECTED' }, { status: 400 });
    }

    // Determine package based on amount (allowing for small variance or custom)
    // We prioritize the amount actually sent
    const creditsToIssue = Math.floor(actualAmountUsdc * 1000);

    // 4. Issue Credits Atomic Sync
    const result = await issueCredits({
      userId,
      actualAmountUsd: actualAmountUsdc,
      provider: 'helio',
      txId: signature,
      meta: {
        signature,
        type: 'solana_p2p_sync',
        verifiedOnChain: true,
        network: 'solana',
        asset: 'USDC'
      }
    });

    // 🔒 CLOSE THE LOOP: Mark the server-side session as complete
    await db.query(`
      UPDATE p2p_sessions 
      SET status = 'complete', claimed_at = NOW()
      WHERE user_id = $1 AND status = 'pending'
    `, [userId]);

    return NextResponse.json({
      success: true,
      credits: result.credits,
      amount: actualAmountUsdc
    });

  } catch (err: any) {
    console.error('[SolanaVerify] Fault:', err.message);
    return NextResponse.json({ success: false, error: `FAULT: ${err.message}` }, { status: 500 });
  }
}
