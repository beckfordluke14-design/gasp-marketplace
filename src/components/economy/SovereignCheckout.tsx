'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Zap, Copy, Loader2, ArrowRight, Wallet as WalletIcon, Diamond } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';
import { useWallet } from '../providers/WalletProvider';
import { ethers } from 'ethers';
import * as solanaWeb3 from '@solana/web3.js';

interface SovereignCheckoutProps {
  userId: string;
  packageId: string;
  onSuccess: (credits: number) => void;
  onCancel: () => void;
}

/**
 * ⛽ SOVEREIGN GASP NODE v5.0 (Elite Desk Edition)
 * Objective: Side-by-Side Desktop Checkout + Session Persistence.
 */
export default function SovereignCheckout({ userId, packageId, onSuccess, onCancel }: SovereignCheckoutProps) {
  const [network, setNetwork] = useState<'solana' | 'base'>('solana');
  const [senderWallet, setSenderWallet] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [status, setStatus] = useState<'waiting' | 'scanning' | 'confirmed'>('waiting');
  
  const { isConnected, address, network: walletNetwork } = useWallet();
  
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
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(network === 'solana' ? solanaPayLink : evmPayLink)}`;

  const handleWalletStake = async () => {
    if (!isConnected) {
       alert('Connection Required: Please link Metamask or Phantom to initialize the neural bridge.');
       return;
    }
    
    setIsVerifying(true);
    setVerificationError(null);

    try {
        if (walletNetwork === 'evm') {
           const ethereum = (window as any).ethereum;
           if (!ethereum) throw new Error('EVM Node Disconnected');
           
           const provider = new ethers.BrowserProvider(ethereum);
           const signer = await provider.getSigner();

           // 💎 SETTLEMENT: BASE L2 Settlement
           const tx = await signer.sendTransaction({
              to: MERCHANT_WALLETS.base,
              value: ethers.parseEther(nativeEquivalent)
           });
           
           setSenderWallet(address!);
           console.log('[EVM] Settlement Pending:', tx.hash);

        } else if (walletNetwork === 'solana') {
           const solana = (window as any).solana;
           if (!solana?.isPhantom) throw new Error('Solana Node Disconnected');

           const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));
           const transaction = new solanaWeb3.Transaction().add(
             solanaWeb3.SystemProgram.transfer({
               fromPubkey: new solanaWeb3.PublicKey(address!),
               toPubkey: new solanaWeb3.PublicKey(MERCHANT_WALLETS.solana),
               lamports: Math.floor(parseFloat(nativeEquivalent) * solanaWeb3.LAMPORTS_PER_SOL),
             })
           );

           const { blockhash } = await connection.getLatestBlockhash();
           transaction.recentBlockhash = blockhash;
           transaction.feePayer = new solanaWeb3.PublicKey(address!);

           const { signature } = await solana.signAndSendTransaction(transaction);
           setSenderWallet(address!);
           console.log('[SOL] Settlement Pending:', signature);
        }
    } catch (e: any) {
        console.error('[Settlement Error]:', e);
        setVerificationError(e.message || 'Node Settlement Refused.');
    } finally {
        setIsVerifying(false);
    }
  };

  const handleVerify = async (silent = false) => {
    if (!silent) setIsVerifying(true);
    if (!silent) setVerificationError(null);

    try {
        const res = await fetch('/api/economy/verify-tx', {
            method: 'POST',
            body: JSON.stringify({
                userId, packageId, network,
                senderWallet: senderWallet || 'AUTO_POLL',
                amountUsd: pkg.priceUsd,
                nativeAmount: nativeEquivalent
            })
        });

        const data = await res.json();
        if (data.success) {
            setStatus('confirmed');
            localStorage.removeItem('gasp_active_stake');
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

  useEffect(() => {
    // 🧬 PERSIST: Store for session recovery
    localStorage.setItem('gasp_active_stake', JSON.stringify({ packageId, userId, timestamp: Date.now() }));
    
    if (status === 'confirmed') return;
    const pollInterval = setInterval(() => { handleVerify(true); }, 8000);
    return () => clearInterval(pollInterval);
  }, [status, network, senderWallet]);

  return (
    <div className="p-5 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 font-outfit overflow-x-hidden">
       
       <div className="flex items-center justify-between">
          <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
                 <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#00f0ff]">
                    {status === 'confirmed' ? 'Stake Verified' : 'Session Recovery Active'}
                 </span>
              </div>
              <h2 className="text-2xl md:text-5xl font-syncopate font-black uppercase italic text-white tracking-tighter leading-none">
                 Stake Terminal
              </h2>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          
          {/* LEFT: THE QR NODE */}
          <div className="space-y-4">
             <div className="p-6 md:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 flex flex-col items-center gap-6 shadow-[0_30px_100px_rgba(0,0,0,1)]">
                <div className="shrink-0 w-full aspect-square max-w-[180px] md:max-w-[240px] bg-white p-2 rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                   <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(network === 'solana' ? nativeSolLink : evmPayLink)}`} alt="QR" className="w-full h-full" />
                </div>
                
                <div className="w-full space-y-4">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00f0ff] text-center italic">
                      Step 1: Initialize Settlement
                   </p>
                   <div 
                      onClick={() => {
                        navigator.clipboard.writeText(MERCHANT_WALLETS[network]);
                        alert('Wallet Address Copied! 🛡️');
                      }}
                      className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between group cursor-pointer hover:border-[#00f0ff]/40 transition-all font-mono"
                   >
                      <code className="text-[9px] text-white/40 break-all truncate group-hover:text-white">
                         {MERCHANT_WALLETS[network]}
                      </code>
                      <Copy size={14} className="text-white/20 shrink-0 ml-2" />
                   </div>
                </div>
             </div>
             
             <div className="hidden md:block p-4 rounded-2xl bg-white/[0.01] border border-white/5 text-center">
                <p className="text-[9px] text-white/20 font-black uppercase tracking-widest italic leading-relaxed">
                   Active monitoring for <span className="text-white">{nativeEquivalent} {network === 'solana' ? 'SOL' : 'ETH'}</span>
                </p>
             </div>
          </div>

          {/* RIGHT: THE SETTLEMENT HUB */}
          <div className="space-y-6">
             <div className="p-6 md:p-10 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col gap-8 shadow-2xl">
                <div className="flex flex-col gap-6">
                   <div className="flex flex-col gap-1.5 border-b border-white/5 pb-6">
                      <span className="text-[10px] uppercase font-black text-white/40 tracking-widest italic">{pkg.label}</span>
                      <div className="flex flex-wrap items-baseline gap-3">
                        <span className="text-3xl md:text-4xl font-syncopate font-black text-white italic uppercase tracking-tighter break-all">
                           {totalCredits.toLocaleString()}
                        </span>
                        <span className="text-[10px] md:text-sm font-black text-white/20 uppercase tracking-[0.2em]">Credits</span>
                      </div>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">Total Settlement</span>
                      <span className="text-3xl md:text-5xl font-syncopate font-black text-[#00f0ff] italic tracking-tighter shadow-[#00f0ff]/10 drop-shadow-xl h-20 flex items-center">${pkg.priceUsd}</span>
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                   <div className="bg-black/20 p-1.5 rounded-2xl flex items-center gap-1.5 border border-white/5">
                      <button onClick={() => setNetwork('solana')} className={`flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${network === 'solana' ? 'bg-[#9945FF] text-white' : 'text-white/30'}`}>Solana</button>
                      <button onClick={() => setNetwork('base')} className={`flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${network === 'base' ? 'bg-[#0052FF] text-white' : 'text-white/30'}`}>Base L2</button>
                   </div>
                                      {isConnected && walletNetwork === (network === 'solana' ? 'solana' : 'evm') ? (
                        <button 
                          onClick={handleWalletStake}
                          disabled={isVerifying}
                          className={`w-full h-16 rounded-2xl ${network === 'solana' ? 'bg-[#9945FF] shadow-[0_0_40px_rgba(153,69,255,0.4)]' : 'bg-[#0052FF] shadow-[0_0_40px_rgba(0,82,255,0.4)]'} text-white flex items-center justify-center gap-3 transition-all text-[11px] font-black uppercase tracking-[0.2em] animate-pulse`}
                        >
                           {isVerifying ? <Loader2 size={24} className="animate-spin" /> : <WalletIcon size={20} />}
                           {isVerifying ? 'Settling Node...' : `Settle via ${walletNetwork === 'solana' ? 'Phantom' : 'Metamask'}`}
                        </button>
                     ) : (
                        <a 
                          href={network === 'solana' ? nativeSolLink : evmPayLink} 
                          className="w-full h-16 rounded-2xl bg-white text-black flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                           <Zap size={20} fill="black" /> {network === 'solana' ? 'Sign via Phantom' : 'One-Click Stake'}
                        </a>
                     )}

                    <div className="text-center">
                       <p className="text-[8px] font-black uppercase text-white/20 tracking-widest italic">
                          {isConnected ? 'Connection Node Green' : 'Manual / QR Bridge Fallback'}
                       </p>
                    </div>
                 </div>
             </div>

             <div className="space-y-4">
                <input 
                  type="text" 
                  value={senderWallet} 
                  onChange={(e) => setSenderWallet(e.target.value)} 
                  placeholder="Your Wallet Address (Optional Manual Link)..." 
                  className="w-full h-12 bg-black/40 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white placeholder:text-white/10 focus:border-[#00f0ff]" 
                />
                
                <button 
                  onClick={() => handleVerify(false)} 
                  disabled={isVerifying || status === 'confirmed'}
                  className="w-full h-16 rounded-2xl bg-[#00f0ff] text-black text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(0,240,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                   {isVerifying ? <Loader2 size={24} className="animate-spin" /> : <ShieldCheck size={24} />}
                   {isVerifying ? 'Scanning Ledger...' : 'Manual Scan Override'}
                </button>

                {verificationError && (
                   <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest text-center">{verificationError}</p>
                   </div>
                )}
                
                <button onClick={onCancel} className="w-full text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors pt-4">
                   Cancel & Return to Tiers
                </button>
             </div>
          </div>
       </div>

    </div>
  );
}
