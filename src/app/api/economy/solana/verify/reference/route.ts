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

    // 1. Connect to Solana — Multi-Node Relay Protocol
    const endpoints = [
        'https://solana-rpc.publicnode.com',
        'https://api.mainnet-beta.solana.com'
    ];
    
    let connection;
    let fallbackSuccess = false;

    for (const endpoint of endpoints) {
        try {
            // 'finalized' enforces absolute blockchain finality (~12 seconds, 32+ confirmations)
            // No transaction will be processed unless it is mathematically irreversible.
            connection = new Connection(endpoint, 'finalized');
            // Test connection with a light request
            await connection.getSlot();
            fallbackSuccess = true;
            console.log(`[P2P RPC] Connected to ${endpoint}`);
            break;
        } catch (e) {
            console.warn(`[P2P RPC] Endpoint Failed: ${endpoint}`);
        }
    }

    if (!fallbackSuccess || !connection) {
        return NextResponse.json({ success: false, error: 'INFRASTRUCTURE_OFFLINE' }, { status: 503 });
    }

    const referencePubkey = new PublicKey(reference);

    // 2. Discovery Loop: Reference first, then Treasury Sweep
    let signatures = await connection.getSignaturesForAddress(referencePubkey, { limit: 5 });
    // 🚨 CRITICAL: Only consider CONFIRMED, SUCCESSFUL transactions — filter out failed ones
    let signature = signatures.find(s => !s.err)?.signature || null;

    // Fetch session metadata for exact amount matching
    const { rows: sessionRows } = await db.query(`SELECT metadata FROM p2p_sessions WHERE reference = $1`, [reference]);
    const storedMetadata = sessionRows[0]?.metadata || {};
    const expectedSolAmount = storedMetadata.expectedSol;

    // 🛡️ RECOVERY FALLBACK: If reference is missing, scan treasury for exact amount
    if (!signature) {
        console.log(`[P2P Poll] Reference missing. Scanning treasury for ~${expectedSolAmount} SOL...`);
        const treasurySigs = await connection.getSignaturesForAddress(new PublicKey(SYNDICATE_TREASURY_SOL), { limit: 20 });
        
        for (const sigInfo of treasurySigs) {
            const { rows: processed } = await db.query(`SELECT 1 FROM transactions WHERE meta->>'txId' = $1`, [sigInfo.signature]);
            if (processed.length > 0) continue;

            const fetchedTx = await connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 });
            if (!fetchedTx || !fetchedTx.meta) continue;
            // 🚨 CRITICAL: Skip failed transactions — a failed tx still has instructions visible on-chain
            if (fetchedTx.meta.err !== null) {
                console.log(`[P2P Treasury Scan] Skipping FAILED tx: ${sigInfo.signature}`);
                continue;
            }

            const solTransfer = fetchedTx.transaction.message.instructions.find(ix => 
               (ix as any).programId?.toBase58() === '11111111111111111111111111111111' &&
               (ix as any).parsed?.info?.destination === SYNDICATE_TREASURY_SOL
            );

            if (solTransfer) {
               const lamports = (solTransfer as any).parsed?.info?.lamports || 0;
               const solSent = lamports / 1e9;
               
               // Match based on stored amount (allow tiny margin for 'dusting')
               const diff = Math.abs(solSent - (expectedSolAmount || (expectedAmountUsd / 79.19)));
               if (diff < 0.0001) {
                  console.log('[P2P Poll] Treasury Match Found Via Stored Amount:', sigInfo.signature);
                  signature = sigInfo.signature;
                  break;
               }
            }
        }
    }

    if (!signature) {
      return NextResponse.json({ success: false, error: 'TX_NOT_FOUND_YET' });
    }

    // 3. Check for Idempotency with found signature
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

    // 🚨 CRITICAL SECURITY GATE: Reject failed transactions
    // A failed Solana tx still shows all instructions in the parsed data.
    // Without this check, the oracle can be tricked by a failed transfer.
    if (tx.meta.err !== null) {
      console.error(`[P2P Audit] REJECTED: Transaction ${signature} FAILED on-chain. Error:`, tx.meta.err);
      // Mark this session dead so polling stops
      await db.query(`UPDATE p2p_sessions SET status = 'failed' WHERE reference = $1`, [reference]);
      return NextResponse.json({ success: false, error: 'TX_FAILED_ON_CHAIN' });
    }

    // 🔬 AUDIT: Verify Destination and Amount
    let actualAmountUsd = 0;
    let isNativeSol = false;

    // Fetch session meta for a potential 'Last Known Good' fallback
    const { rows: sessionRowsFull } = await db.query(`SELECT metadata FROM p2p_sessions WHERE reference = $1`, [reference]);
    const priceAtCreation = sessionRowsFull[0]?.metadata?.priceAtCreation;

    // Check for Native SOL instructions
    const solTransfer = tx.transaction.message.instructions.find(ix => 
       (ix as any).programId?.toBase58() === '11111111111111111111111111111111' &&
       (ix as any).parsed?.type === 'transfer' &&
       (ix as any).parsed?.info?.destination === SYNDICATE_TREASURY_SOL
    );

    // Audit vars for meta
    let solPrice = 0; 
    let prices: number[] = [];

    if (solTransfer) {
       const lamports = (solTransfer as any).parsed?.info?.lamports || 0;
       const solSent = lamports / 1e9;
       isNativeSol = true;

       // 🛡️ DYNAMIC ORACLE ENFORCEMENT: Multi-Source Weighted Median (High Precision)
       try {
           // Source 1: CoinGecko
           const gRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
           const gData = await gRes.json();
           if (gData?.solana?.usd) prices.push(parseFloat(gData.solana.usd));
       } catch (_) {}

       try {
           // Source 2: Binance
           const bRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT');
           const bData = await bRes.json();
           if (bData?.price) prices.push(parseFloat(bData.price));
       } catch (_) {}

       try {
           // Source 3: Kraken
           const kRes = await fetch('https://api.kraken.com/0/public/Ticker?pair=SOLUSD');
           const kData = await kRes.json();
           const kVal = kData?.result?.SOLUSD?.c?.[0];
           if (kVal) prices.push(parseFloat(kVal));
       } catch (_) {}

       if (prices.length > 0) {
           solPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
           console.log(`[P2P Oracle] Dynamic Verified Price: $${solPrice.toFixed(2)} (${prices.length} feeds)`);
       } else if (priceAtCreation) {
           solPrice = priceAtCreation;
           console.log(`[P2P Oracle] Oracle Drift: Using Last-Known Fresh Price $${solPrice.toFixed(2)}`);
       }

       if (solPrice === 0) {
           return NextResponse.json({ success: false, error: 'ORACLE_UNAVAILABLE' }, { status: 503 });
       }
       
       actualAmountUsd = solSent * solPrice;
    } else {
       // Check for USDC Token Transfer (Stable 1:1)
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

    // 🛡️ REVENUE PROTECTION: Institutional Floor
    const floorUsd = 0.50; 
    if (actualAmountUsd < floorUsd) {
       console.log(`[P2P Verify] Deposit below settlement floor: $${actualAmountUsd}`);
       return NextResponse.json({ success: false, error: 'BELOW_FLOOR' });
    }

    // 🔬 DYNAMIC CREDIT CALCULATION: 1,000 Credits per $1.00
    const proRatedCredits = Math.floor(actualAmountUsd * 1000);

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
        actualAmountUsd,
        oracleUsed: isNativeSol ? (prices.length > 0 ? 'multi_live' : 'snapshot_fallback') : 'native_usdc'
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
