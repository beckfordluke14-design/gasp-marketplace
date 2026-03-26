import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';

/**
 * ⛽ SOVEREIGN VERIFIER NODE v1.8
 * Objective: Verify P2P USDC Settlements on Solana/Base.
 * Censorship Resistance Level: UNSTOPPABLE.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, packageId, network, txHash, amountUsd: clientAmount } = body;

        if (!txHash || !userId || !packageId) {
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

        // 🧬 MERCHANT LEDGERS (Your Sovereign Nodes)
        const MERCHANT_WALLETS = {
            solana: 'DGQVNRTWEv1HEwP6Wtcm1LEUPgZKsW9JfwVpEDjPcEkS',
            base:   '0x3d395781aE795dE79e79e79E79e79E79E79E79e7'
        };

        // --- NETWORK CHANNEL 1: SOLANA (SOL) ---
        if (network === 'solana') {
            const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
            const tx = await connection.getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0 });

            if (tx) {
                // 🧬 AUDIT: Check if destination matches your merchant node
                const postTokenBalances = tx.meta?.postTokenBalances || [];
                const preTokenBalances = tx.meta?.preTokenBalances || [];
                
                // USDC Mint (Solana) 
                const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

                // We scan for the merchant's token balance increase
                const merchantBalanceChange = postTokenBalances.find(b => 
                    b.mint === USDC_MINT && 
                    b.owner === MERCHANT_WALLETS.solana
                );

                if (merchantBalanceChange) {
                    const postAmount = merchantBalanceChange.uiTokenAmount.uiAmount || 0;
                    const preAmount = preTokenBalances.find(b => b.owner === MERCHANT_WALLETS.solana)?.uiTokenAmount.uiAmount || 0;
                    const delta = postAmount - preAmount;

                    // Allow 1% wiggle room for rounding
                    if (delta >= pkg.priceUsd * 0.99) {
                        isVerified = true;
                    }
                }
            }
        } 
        
        // --- NETWORK CHANNEL 2: BASE (EVM L2) ---
        else if (network === 'base') {
            const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
            const receipt = await provider.getTransactionReceipt(txHash);
            const tx = await provider.getTransaction(txHash);

            if (receipt && tx && receipt.status === 1) { // status 1 = success
                // USDC Token (Base)
                const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'.toLowerCase();
                
                // Verify the 'to' address is your merchant node (actually the USDC contract for token transfer)
                // We really want to check the 'Transfer' logs or amount
                const amountHex = tx.value; // For native base eth? No, we check USDC logs.
                
                if (tx.to?.toLowerCase() === BASE_USDC) {
                    // Simple hack: if it's sent to the USDC contract, we check the 'data' field 
                    // (transfer(to, amount) starts with 0xa9059cbb)
                    if (tx.data.startsWith('0xa9059cbb')) {
                        const destination = '0x' + tx.data.substring(34, 74).toLowerCase();
                        const hexAmount = '0x' + tx.data.substring(74);
                        const cleanAmount = parseInt(hexAmount, 16) / 1000000; // USDC is 6 decimals

                        if (destination.includes(MERCHANT_WALLETS.base.substring(2).toLowerCase()) && cleanAmount >= pkg.priceUsd * 0.99) {
                            isVerified = true;
                        }
                    }
                }
            }
        }

        if (!isVerified) {
            return new Response(JSON.stringify({ success: false, error: 'Identity/Ledger Match Failed. Broadcast your transaction first.' }), { status: 400 });
        }

        // 🧬 SYNC UNIVERSAL LEDGERS
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const totalCredits = pkg.credits + Math.floor(pkg.credits * 0.15); // Bonus applied

        // 1. Update Premium Wallet
        const { data: wallet } = await supabase.from('wallets').select('id, credit_balance').eq('user_id', userId).maybeSingle();
        if (wallet) {
            await supabase.from('wallets').update({ credit_balance: wallet.credit_balance + totalCredits }).eq('id', wallet.id);
        } else {
            await supabase.from('wallets').insert({ user_id: userId, credit_balance: totalCredits });
        }

        // 2. Update Airdrop Matrix (Profiles)
        const { data: profile } = await supabase.from('profiles').select('credit_balance').eq('id', userId).single();
        await supabase.from('profiles').update({ credit_balance: (profile?.credit_balance || 0) + totalCredits }).eq('id', userId);

        // 3. Log Audit Ledger
        await supabase.from('audit_ledger').insert({
            user_id: userId,
            action: 'SOVEREIGN_NODE_SETTLEMENT',
            amount_usd: pkg.priceUsd,
            credits_added: totalCredits,
            status: 'SETTLED',
            network: network,
            external_id: txHash
        });

        return new Response(JSON.stringify({ success: true, credits: totalCredits }), { status: 200 });

    } catch (e: any) {
        console.error('FATAL VERIFIER ERROR:', e.message);
        return new Response(JSON.stringify({ success: false, error: 'The Blockchain Node is throttling. Re-verify in 60s.' }), { status: 500 });
    }
}
