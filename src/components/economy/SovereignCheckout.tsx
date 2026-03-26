'use client';

import { useState } from 'react';
import { ShieldCheck, Zap, ArrowRight, Loader2, CheckCircle2, Copy } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';

interface SovereignCheckoutProps {
  userId: string;
  packageId: string;
  onSuccess: (credits: number) => void;
  onCancel: () => void;
}

/**
 * ⛽ SOVEREIGN GASP NODE v1.8
 * Objective: Zero-Touch / Zero-KYC Multi-Chain Settlement.
 * Channels: Solana (USDC) | Base (USDC).
 */
export default function SovereignCheckout({ userId, packageId, onSuccess, onCancel }: SovereignCheckoutProps) {
  const [network, setNetwork] = useState<'solana' | 'base'>('solana');
  const [txHash, setTxHash] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // 🧬 DYNAMIC RESOLVER: Handles both fixed tiers and custom Whale amounts.
  const isCustom = packageId.startsWith('custom_');
  const customVal = isCustom ? parseFloat(packageId.split('_')[1]) : 0;
  const pkg = isCustom 
    ? { id: packageId, priceUsd: customVal, credits: customVal * 15, label: 'Custom Stake' }
    : (CREDIT_PACKAGES.find(p => p.id === packageId) || CREDIT_PACKAGES[0]);

  const cryptoBonus = Math.floor(pkg.credits * 0.15);
  const totalCredits = pkg.credits + cryptoBonus;

  // 🧬 MERCHANT LEDGERS (Your Sovereign Destination Nodes)
  const MERCHANT_WALLETS = {
    solana: 'DGQVNRTWEv1HEwP6Wtcm1LEUPgZKsW9JfwVpEDjPcEkS', // 🧬 Solana Node
    base:   '0x3d395781aE795dE79e79e79E79e79E79E79E79e7'   // 🧬 Base/EVM Node (Replace with your own)
  };

  async function handleVerify() {
    if (!txHash) {
        setVerificationError('Signature/Hash Required for Broadcast Verification.');
        return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
        const res = await fetch('/api/economy/verify-tx', {
            method: 'POST',
            loading: true,
            body: JSON.stringify({
                userId,
                packageId,
                network,
                txHash,
                amountUsd: pkg.priceUsd
            })
        } as any);

        const data = await res.json();
        
        if (data.success) {
            onSuccess(totalCredits);
        } else {
            setVerificationError(data.error || 'Identity Verification Failed. Ensure transaction exists on-chain.');
        }
    } catch (e) {
        setVerificationError('Uplink Failed. The Blockchain is crowded. Try again in 60s.');
    } finally {
        setIsVerifying(false);
    }
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
       
       {/* 🧬 HEADER: TGE RESERVATION */}
       <div className="space-y-2">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#00f0ff]">Node-to-Node Settlement</span>
          </div>
          <h2 className="text-3xl font-syncopate font-black uppercase italic text-white tracking-tighter">
             Sovereign <br /> <span className="text-[#00f0ff]">Bridge</span>
          </h2>
       </div>

       {/* 🧩 PACKAGE SUMMARY */}
       <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex flex-col gap-1">
             <span className="text-[10px] uppercase font-black text-white/40 tracking-widest">{pkg.label}</span>
             <span className="text-2xl font-syncopate font-bold text-white italic uppercase">{totalCredits.toLocaleString()}c</span>
          </div>
          <div className="text-right">
             <span className="text-xl font-black text-[#00f0ff] italic">${pkg.priceUsd}</span>
             <p className="text-[7px] font-black uppercase text-white/20 tracking-widest mt-1">+15% Bonus Applied</p>
          </div>
       </div>

       {/* 🌐 NETWORK SELECTOR */}
       <div className="bg-white/5 rounded-2xl p-1.5 flex items-center gap-1 border border-white/10">
          <button 
            onClick={() => setNetwork('solana')}
            className={`flex-1 h-11 rounded-1xl text-[10px] font-black uppercase tracking-widest transition-all ${network === 'solana' ? 'bg-[#9945FF] text-white shadow-[0_0_15px_#9945FF66]' : 'text-white/40 hover:text-white'}`}
          >
             Solana
          </button>
          <button 
            onClick={() => setNetwork('base')}
            className={`flex-1 h-11 rounded-1xl text-[10px] font-black uppercase tracking-widest transition-all ${network === 'base' ? 'bg-[#0052FF] text-white shadow-[0_0_15px_#0052FF66]' : 'text-white/40 hover:text-white'}`}
          >
             Base (L2)
          </button>
       </div>

       {/* ⛓️ MERCHANT LEDGER CARD */}
       <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
          <div className="space-y-4">
             <p className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-relaxed">
                Step 1: Send <span className="text-white">${pkg.priceUsd} in USDC</span> to the Merchant Node below.
             </p>
             <div 
               onClick={() => {
                 navigator.clipboard.writeText(MERCHANT_WALLETS[network]);
                 alert('Merchant Node ID Copied to Clipboard! 🛡️💨');
               }}
               className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between group cursor-pointer hover:border-[#00f0ff]/40 transition-all"
             >
                <code className="text-[10px] font-mono text-white/70 break-all pr-4 group-hover:text-[#00f0ff]">
                   {MERCHANT_WALLETS[network]}
                </code>
                <Copy size={14} className="text-white/20 group-hover:text-[#00f0ff] shrink-0" />
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
             <p className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-relaxed">
                Step 2: Paste your <span className="text-white">Transaction Signature / Hash</span> for network verification.
             </p>
             <input 
               type="text"
               value={txHash}
               onChange={(e) => setTxHash(e.target.value)}
               placeholder="Paste Tx Signature..."
               className="w-full h-12 bg-black/40 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-[#00f0ff] transition-all"
             />
          </div>

          {verificationError && (
             <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">{verificationError}</p>
             </div>
          )}

          <button 
            onClick={handleVerify}
            disabled={isVerifying}
            className={`w-full h-14 rounded-2xl bg-[#00f0ff] text-black text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale`}
          >
             {isVerifying ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
             {isVerifying ? 'Verifying Ledger...' : 'Broadcast Node Verification'}
          </button>
       </div>

       {/* Footer / Cancel */}
       <div className="pt-4 flex flex-col items-center gap-6">
          <p className="text-[8px] text-white/10 uppercase tracking-[0.3em] font-black italic max-w-xs text-center border-t border-white/5 pt-6">
             Gasp Neural-Ledger Verification v1.8 Active. Settlement is non-reversible and occurs directly on the Decentralized Matrix. 🧬🛡️
          </p>
          <button onClick={onCancel} className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">
             Return to Tier Selector
          </button>
       </div>

    </div>
  );
}
