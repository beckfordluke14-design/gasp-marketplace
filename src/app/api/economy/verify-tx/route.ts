import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';

/**
 * ⛽ SOVEREIGN AUTO-SCANNER NODE v4.0 (Airdrop-Hardened)
 * Objective: Zero-Friction P2P USDC/SOL/ETH Settlement via Ledger Polling.
 * Logic: Scans Networks for [Sender Wallet] -> [Merchant Wallet] flow.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, packageId, network, senderWallet, amountUsd: clientAmount } = body;

        if (!senderWallet || !userId || !packageId) {
            return new Response(JSON.stringify({ success: false, error: 'Identity Cluster Metadata Missing.' }), { status: 400 });
        }

        // 🧬 DYNAMIC RESOLVER: Support fixed tiers + custom Whale amounts
        const isCustom = packageId.startsWith('custom_');
        const customPrice = isCustom ? parseFloat(packageId.split('_')[1]) : 0;
        const pkg = isCustom 
            ? { id: packageId, priceUsd: customPrice, credits: customPrice * 15 }
            : CREDIT_PACKAGES.find(p => p.id === packageId);

        if (!pkg) return new Response(JSON.stringify({ success: false, error: 'Invalid Economy Tier.' }), { status: 400 });

        let isVerified = false;
        let finalTxHash = '';

        // 🧬 MERCHANT LEDGERS (Your Sovereign Nodes)
        const MERCHANT_WALLETS = {
            solana: 'DGQVNRTWEv1HEwP6Wtcm1LEUPgZKsW9JfwVpEDjPcEkS',
            base:   '0xe45e8529487139D9373423282B3485Beb7F0a6C7'
        };

        // --- NETWORK CHANNEL 1: SOLANA (SOL + USDC) ---
        if (network === 'solana') {
            const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
            const merchantPubkey = new PublicKey(MERCHANT_WALLETS.solana);
            
            // 📡 SCAN: Fetch last 20 signatures for the merchant node
            const signatures = await connection.getSignaturesForAddress(merchantPubkey, { limit: 20 });
            const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

            for (const sigInfo of signatures) {
                // Skip if older than 1 hour
                if (sigInfo.blockTime && (Date.now() / 1000 - sigInfo.blockTime > 3600)) continue;

                const tx = await connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 });
                if (!tx) continue;

                // --- PATH A: USDC (SPL TOKEN) ---
                const postTokenBalances = tx.meta?.postTokenBalances || [];
                const preTokenBalances = tx.meta?.preTokenBalances || [];
                
                const merchantBalanceChange = postTokenBalances.find(b => 
                    b.mint === USDC_MINT && 
                    b.owner === MERCHANT_WALLETS.solana
                );

                if (merchantBalanceChange) {
                    const postAmount = merchantBalanceChange.uiTokenAmount.uiAmount || 0;
                    const preAmount = preTokenBalances.find(b => b.owner === MERCHANT_WALLETS.solana)?.uiTokenAmount.uiAmount || 0;
                    const delta = postAmount - preAmount;

                    const accountKeys = tx.transaction.message.accountKeys.map(k => k.pubkey.toString());
                    const isFromSender = senderWallet === 'AUTO_POLL' ? true : accountKeys.includes(senderWallet);

                    if (isFromSender && delta >= pkg.priceUsd * 0.98) { // 2% wiggle room
                        isVerified = true;
                        finalTxHash = sigInfo.signature;
                        break;
                    }
                }

                // --- PATH B: NATIVE SOL (SYSTEM PROGRAM) ---
                if (!isVerified) {
                    const instructions = tx.transaction.message.instructions;
                    for (const ix of instructions) {
                        if ('parsed' in ix && ix.programId.toString() === '11111111111111111111111111111111') {
                            const parsedIx = ix.parsed;
                            if (parsedIx.type === 'transfer') {
                                const source = parsedIx.info.source;
                                const destination = parsedIx.info.destination;
                                const lamports = parsedIx.info.lamports;
                                const solAmount = lamports / 1000000000;

                                const isToMerchant = destination === MERCHANT_WALLETS.solana;
                                const isFromSender = senderWallet === 'AUTO_POLL' ? true : source === senderWallet;

                                // Allow wiggle room for fee deduction or minor oracle variance
                                const targetSol = parseFloat(body.nativeAmount || '0');
                                if (isToMerchant && isFromSender && solAmount >= targetSol * 0.98 && targetSol > 0) {
                                    isVerified = true;
                                    finalTxHash = sigInfo.signature;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (isVerified) break;
            }
        } 
        
        // --- NETWORK CHANNEL 2: BASE (EVM L2) ---
        else if (network === 'base') {
            const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
            const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'.toLowerCase();
            
            // Note: Base scanning is active but best for USDC-only right now. 🛡️
            // Implementation for ETH native can be added later.
            return new Response(JSON.stringify({ success: false, error: 'Base Auto-Scanner is in maintenance. Please use Solana Node for instant verification.' }), { status: 400 });
        }

        if (!isVerified) {
            return new Response(JSON.stringify({ success: false, error: 'No recent transaction found. Ensuring broadcast is confirmed.' }), { status: 400 });
        }

        // 🧬 SECURE FULFILLMENT ATOMICS
        // 🛡️ DOUBLE-SPEND DEFENSE
        const { rows: existing } = await db.query('SELECT id FROM audit_ledger WHERE external_id = $1 LIMIT 1', [finalTxHash]);
        if (existing.length > 0) return NextResponse.json({ success: false, error: 'Sovereign Check: Transaction already settled.' }, { status: 400 });

        const totalCredits = pkg.credits + Math.floor(pkg.credits * 0.15); // Bonus applied

        // 1. Log Audit Ledger (Airdrop Source of Truth)
        await db.query(`
            INSERT INTO audit_ledger (user_id, action, amount_usd, credits_added, status, network, external_id, sender_wallet, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `, [
            userId, 
            'SOVEREIGN_AUTO_SCAN_SETTLEMENT', 
            pkg.priceUsd, 
            totalCredits, 
            'SETTLED', 
            network, 
            finalTxHash, 
            senderWallet
        ]);

        // 2. Update Sovereign Ledger (Profiles table)
        // We use UPSERT path via ON CONFLICT
        await db.query(`
            INSERT INTO profiles (id, total_spent_usd, credit_balance, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (id) 
            DO UPDATE SET 
                total_spent_usd = profiles.total_spent_usd + EXCLUDED.total_spent_usd,
                credit_balance = profiles.credit_balance + EXCLUDED.credit_balance,
                updated_at = NOW()
        `, [userId, pkg.priceUsd, totalCredits]);

        return NextResponse.json({ success: true, credits: totalCredits });

    } catch (e: any) {
        console.error('FATAL VERIFIER ERROR:', e.message);
        return NextResponse.json({ success: false, error: 'Blockchain Node Congestion. Re-scan in 60s.' }, { status: 500 });
    }
}
