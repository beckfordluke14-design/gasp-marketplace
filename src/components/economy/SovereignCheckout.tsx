'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Zap, Copy, Loader2, ArrowRight } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';

interface SovereignCheckoutProps {
  userId: string;
  packageId: string;
  onSuccess: (credits: number) => void;
  onCancel: () => void;
}

/**
 * ⛽ SOVEREIGN GASP NODE v4.0 (Memecoin Optimized)
 * Objective: No-Confusion / Stable + Native 1-Click Settlement.
 * Channel: Solana (USDC & SOL).
 */
export default function SovereignCheckout({ userId, packageId, onSuccess, onCancel }: SovereignCheckoutProps) {
  const [network, setNetwork] = useState<'solana' | 'base'>('solana');
  const [senderWallet, setSenderWallet] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [status, setStatus] = useState<'waiting' | 'scanning' | 'confirmed'>('waiting');
  
  const MERCHANT_WALLETS = {
    solana: 'DGQVNRTWEv1HEwP6Wtcm1LEUPgZKsW9JfwVpEDjPcEkS',
    base:   '0xe45e8529487139D9373423282B3485Beb7F0a6C7'
  };

  // 🧬 DYNAMIC RESOLVER
  const isCustom = packageId.startsWith('custom_');
  const customVal = isCustom ? parseFloat(packageId.split('_')[1]) : 0;
  const pkg = isCustom 
    ? { id: packageId, priceUsd: customVal, credits: customVal * 15, label: 'Custom Stake' }
    : (CREDIT_PACKAGES.find(p => p.id === packageId) || CREDIT_PACKAGES[0]);

  const cryptoBonus = Math.floor(pkg.credits * 0.15);
  const totalCredits = pkg.credits + cryptoBonus;

  // 📡 LIVE PRICE ORACLE (SOL/ETH -> USD)
  const [nativePrice, setNativePrice] = useState<number | null>(null);
  
  useEffect(() => {
    async function fetchPrice() {
        try {
            const coin = network === 'solana' ? 'SOL' : 'ETH';
            const res = await fetch(`https://api.coinbase.com/v2/prices/${coin}-USD/spot`);
            const data = await res.json();
            if (data.data?.amount) setNativePrice(parseFloat(data.data.amount));
        } catch (e) { console.warn('Oracle Link Throttled.'); }
    }
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [network]);

  const nativeEquivalent = nativePrice ? (pkg.priceUsd / nativePrice).toFixed(4) : '...';

  // 🧬 PROTOCOL LINKS
  const solanaPayLink = `solana:${MERCHANT_WALLETS.solana}?amount=${pkg.priceUsd}&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&label=Gasp%20Stake&memo=${userId}`;
  const nativeSolLink = `solana:${MERCHANT_WALLETS.solana}?amount=${nativeEquivalent}&label=Gasp%20Stake&memo=${userId}`;
  const evmPayLink = `ethereum:${MERCHANT_WALLETS.base}?amount=${pkg.priceUsd}&label=Gasp%20Stake`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(network === 'solana' ? solanaPayLink : evmPayLink)}`;

  // 🧬 BITREFILL-STYLE AUTO-POLLER
  const handleVerify = async (silent = false) => {
    if (!silent) setIsVerifying(true);
    if (!silent) setVerificationError(null);

    try {
        const res = await fetch('/api/economy/verify-tx', {
            method: 'POST',
            body: JSON.stringify({
                userId,
                packageId,
                network,
                senderWallet: senderWallet || 'AUTO_POLL',
                amountUsd: pkg.priceUsd,
                nativeAmount: nativeEquivalent
            })
        });

        const data = await res.json();
        if (data.success) {
            setStatus('confirmed');
            onSuccess(totalCredits);
            return true;
        } else if (!silent) {
            setVerificationError(data.error || 'No transaction detected yet.');
        }
    } catch (e) {
        if (!silent) setVerificationError('Network Latency. Re-scan in 30s.');
    } finally {
        if (!silent) setIsVerifying(false);
    }
    return false;
  };

  // 📡 ACTIVE WATCHER LOOP
  useEffect(() => {
    if (status === 'confirmed') return;
    const pollInterval = setInterval(() => { handleVerify(true); }, 8000);
    return () => clearInterval(pollInterval);
  }, [status, network, senderWallet]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 font-outfit overflow-x-hidden">
       
       {/* Header */}
       <div className="space-y-2 text-left">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#00f0ff]">
                {status === 'confirmed' ? 'Stake Verified' : 'Live Oracle Active'}
             </span>
          </div>
          <h2 className="text-3xl font-syncopate font-black uppercase italic text-white tracking-tighter">
             Sovereign <br /> <span className="text-[#00f0ff]">Bridge</span>
          </h2>
       </div>

       {/* Summary */}
       <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex flex-col gap-1 text-left">
             <span className="text-[10px] uppercase font-black text-white/40 tracking-widest">{pkg.label}</span>
             <span className="text-2xl font-syncopate font-bold text-white italic uppercase">{totalCredits.toLocaleString()}c</span>
          </div>
          <div className="text-right">
             <div className="flex flex-col items-end">
                <span className="text-xl font-black text-[#00f0ff] italic">${pkg.priceUsd}</span>
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1">
                   ≈ {nativeEquivalent} {network === 'solana' ? 'SOL' : 'ETH'}
                </span>
             </div>
          </div>
       </div>

       {/* Actions */}
       <div className="space-y-4">
          <div className="bg-white/5 rounded-2xl p-1.5 flex items-center gap-1 border border-white/10 mb-2">
             <button 
               onClick={() => setNetwork('solana')}
               className={`flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${network === 'solana' ? 'bg-[#9945FF] text-white' : 'text-white/40'}`}
             >
                Solana (Recommended)
             </button>
             <button 
               onClick={() => setNetwork('base')}
               className={`flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${network === 'base' ? 'bg-[#0052FF] text-white' : 'text-white/40'}`}
             >
                Base L2
             </button>
          </div>

          <a 
            href={network === 'solana' ? solanaPayLink : evmPayLink}
            className="w-full h-16 rounded-2xl bg-white text-black flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest"
          >
             <Zap size={18} fill="black" />
             One-Click Stake (USDC)
          </a>

          <a 
            href={network === 'solana' ? nativeSolLink : undefined}
            className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(153,69,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest ${network === 'solana' ? 'bg-[#9945FF] text-white' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
          >
             <Zap size={18} fill={network === 'solana' ? 'white' : 'transparent'} />
             Pay in {network === 'solana' ? 'SOL' : 'ETH'} ≈ {nativeEquivalent}
          </a>

          <div className="flex items-center gap-4 text-white/10">
             <div className="h-px flex-1 bg-current" />
             <span className="text-[8px] font-black uppercase italic">Or Send via Node ID</span>
             <div className="h-px flex-1 bg-current" />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
             <div className="shrink-0 w-36 h-36 bg-white p-2 rounded-2xl">
                <img src={qrCodeUrl} alt="QR" className="w-full h-full" />
             </div>
             <div className="flex-1 space-y-4 text-center md:text-left">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#00f0ff] leading-relaxed">
                   Step 1: Scan QR or Send <span className="text-white">{nativeEquivalent} {network === 'solana' ? 'SOL' : 'ETH'}</span> / <span className="text-white">${pkg.priceUsd} USDC</span>.
                </p>
                <div 
                   onClick={() => {
                     navigator.clipboard.writeText(MERCHANT_WALLETS[network]);
                     alert('Merchant Node ID Copied! 🛡️💨');
                   }}
                   className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between group cursor-pointer hover:border-[#00f0ff]/40 transition-all font-mono"
                >
                   <code className="text-[9px] text-white/50 break-all select-all group-hover:text-white">
                      {MERCHANT_WALLETS[network]}
                   </code>
                   <Copy size={12} className="text-white/20 shrink-0 ml-2" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#00f0ff] leading-relaxed">
                   Step 2: Node watches for payment...
                </p>
             </div>
          </div>
       </div>

       {/* Input */}
       <div className="space-y-4 pt-4 border-t border-white/5 text-left text-left">
           <p className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-relaxed">
              Manual Fail-Safe: Paste <span className="text-white">YOUR Account ID</span> if auto-scan fails.
           </p>
           <div className="flex gap-2">
              <input 
                type="text"
                value={senderWallet}
                onChange={(e) => setSenderWallet(e.target.value)}
                placeholder="Your Wallet (Optional)..."
                className="flex-1 h-12 bg-black/40 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-[#9945FF] transition-all"
              />
              <button 
                onClick={() => {
                   navigator.clipboard.writeText(MERCHANT_WALLETS.solana);
                   alert('Solana Merchant Node ID Copied! 🛡️💨');
                }}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                 <Copy size={16} className="text-white/40" />
              </button>
           </div>
       </div>

       <div className="space-y-4">
          {verificationError && (
             <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
                <p className="text-[9px] font-black text-red-400 uppercase tracking-widest leading-relaxed">{verificationError}</p>
             </div>
          )}

          <button 
            onClick={() => handleVerify(false)}
            disabled={isVerifying || status === 'confirmed'}
            className={`w-full h-14 rounded-2xl bg-[#9945FF] text-white text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(153,69,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale`}
          >
             {isVerifying ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
             {isVerifying ? 'Scanning Ledger...' : (status === 'confirmed' ? 'Stake Verified' : 'Manual Scan Override')}
          </button>

          <button onClick={onCancel} className="w-full text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors pt-4">
             Return to Tier Selector
          </button>
       </div>

    </div>
  );
}
