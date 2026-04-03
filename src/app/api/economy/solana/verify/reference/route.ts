import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { db } from '@/lib/db';
import { issueCredits } from '@/lib/economy/issueCredits';
import { SYNDICATE_TREASURY_SOL } from '@/lib/economy/constants';

/**
 * 🛰️ SOVEREIGN AUTOMATIC VERIFIER v2.0
 * Strategy: Zero-Touch Solana Pay Reference Tracking.
 * Scans the blockchain for transactions containing a unique session reference.
 */

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');
    const userId = searchParams.get('userId');
    const expectedAmountUsd = parseFloat(searchParams.get('expectedAmount') || '0');

    if (!reference || !userId) {
      return NextResponse.json({ success: false, error: 'MISSING_PARAMS' }, { status: 400 });
    }

    // 1. Connect to Solana Mainnet
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    const referencePubkey = new PublicKey(reference);

    // 2. Fetch signatures for the unique reference
    const signatures = await connection.getSignaturesForAddress(referencePubkey, { limit: 1 });

    if (signatures.length === 0) {
      return NextResponse.json({ success: false, error: 'TX_NOT_FOUND_YET' });
    }

    const { signature } = signatures[0];

    // 3. Check for Idempotency
    const { rows: existing } = await db.query(
      `SELECT 1 FROM transactions WHERE meta->>'txId' = $1 LIMIT 1`,
      [signature]
    );
    if (existing.length > 0) {
      return NextResponse.json({ success: true, processed: true });
    }

    // 4. Fetch and Audit the Transaction
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });

    if (!tx || !tx.meta) {
      return NextResponse.json({ success: false, error: 'TX_FETCH_FAULT' });
    }

    // 🔬 AUDIT: Verify Destination and Amount
    let actualAmountUsd = 0;
    let isNativeSol = false;

    // Check for Native SOL first
    const solTransfer = tx.transaction.message.instructions.find(ix => 
       (ix as any).programId?.toBase58() === '11111111111111111111111111111111' &&
       (ix as any).parsed?.type === 'transfer' &&
       (ix as any).parsed?.info?.destination === SYNDICATE_TREASURY_SOL
    );

    if (solTransfer) {
       const lamports = (solTransfer as any).parsed?.info?.lamports || 0;
       const solSent = lamports / 1e9;
       
       // 🛡️ RECOVERY: Use DexScreener + CoinGecko Oracle (No 401s)
       let solPrice = 188; // Safety Floor
       try {
           const dRes = await fetch('https://api.dexscreener.com/latest/dex/pairs/solana/83w5pydpoy9g8r8k6z3a6p5r4v5d5p1n3e7e2y7m');
           const dData = await dRes.json();
           const p1 = dData.pairs?.[0]?.priceUsd;
           if (p1) {
               solPrice = parseFloat(p1);
           } else {
               const gRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
               const gData = await gRes.json();
               if (gData.solana?.usd) solPrice = gData.solana.usd;
           }
       } catch (e) {
           console.error('[Verify Price Feed Delay]:', e);
       }
       
       actualAmountUsd = solSent * solPrice;
       isNativeSol = true;
    } else {
       // Check for USDC Token Transfer
       const treasuryBalanceChange = tx.meta.postTokenBalances?.find(b => 
         b.owner === SYNDICATE_TREASURY_SOL && 
         b.mint === USDC_MINT
       );

       if (treasuryBalanceChange) {
          const preBalance = tx.meta.preTokenBalances?.find(b => 
            b.owner === SYNDICATE_TREASURY_SOL && b.mint === USDC_MINT
          )?.uiTokenAmount?.uiAmount || 0;
          const postBalance = treasuryBalanceChange.uiTokenAmount?.uiAmount || 0;
          actualAmountUsd = postBalance - preBalance;
       }
    }

    // 🛡️ SECURITY CEILING: Verify sufficient payment
    // We allow a 5% margin for price volatility if paying in SOL
    const margin = isNativeSol ? 0.95 : 0.99; 
    if (actualAmountUsd < expectedAmountUsd * margin) {
       console.log(`[P2P Poll] Underpaid: Received $${actualAmountUsd} but expected $${expectedAmountUsd}`);
       return NextResponse.json({ success: false, error: 'UNDERPAID' });
    }

    // 4. Issue Credits with Automatic Synchronization
    const result = await issueCredits({
      userId,
      actualAmountUsd,
      provider: 'helio',
      txId: signature,
      meta: {
        signature,
        type: 'automatic_solana_pay_sync',
        reference,
        isNativeSol,
        actualAmountUsd
      }
    });

    return NextResponse.json({
      success: true,
      credits: result.credits,
      txId: signature
    });

  } catch (err: any) {
    console.error('[SolanaPoll] Core Fault:', err.message);
    return NextResponse.json({ success: false, error: 'POLL_INTERNAL_ERROR' }, { status: 500 });
  }
}
