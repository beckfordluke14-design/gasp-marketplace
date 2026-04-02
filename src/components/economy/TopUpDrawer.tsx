'use client';

import { 
  X, 
  Terminal, 
  ChevronRight, 
  ShieldCheck, 
  Wallet, 
  CreditCard,
  History,
  Zap,
  Lock,
  ArrowUpRight,
  Shield,
  Copy,
  Clock,
  Diamond,
  ArrowRight,
  Globe
} from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import SovereignCheckout from './SovereignCheckout';

interface TopUpDrawerProps {
  onClose: () => void;
  userId: string;
}

interface Transaction {
  id: string;
  amount: number;
  credits: number;
  status: string;
  timestamp: string;
}

/**
 * ⛽ TERMINAL TOP-UP v3.5 // REVENUE MAXIMIZER
 * Objective: 100% Permissionless P2P Settlement with Cross-Chain Privy Sync.
 * Strategy: Institutional Upselling with Tiered Bonus Logic.
 */
export default function TopUpDrawer({ onClose, userId }: TopUpDrawerProps) {
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');

  // 🧬 SETTLEMENT WATCHER
  useEffect(() => {
    const handleSuccess = () => {
      setIsSuccess(true);
      window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
    };
    window.addEventListener('gasp_transfer_success', handleSuccess);
    return () => window.removeEventListener('gasp_transfer_success', handleSuccess);
  }, []);

  const loadHistory = async () => {
    if (historyLoading) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/economy/history?userId=${userId}`);
      const data = await res.json();
      if (data.success) setHistory(data.transactions);
    } catch {}
    setHistoryLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 m-auto w-[95%] md:w-[420px] h-fit bg-black/95 backdrop-blur-3xl border border-white/10 z-[300] flex flex-col items-center justify-center p-10 text-center font-outfit rounded-[3rem] shadow-2xl">
        <div className="w-24 h-24 rounded-full bg-[#ff6b00]/20 flex items-center justify-center mb-8 border border-[#ff6b00]/40 shadow-[0_0_60px_rgba(255,107,0,0.3)]">
          <Diamond size={48} className="text-[#ff6b00] animate-pulse" />
        </div>
        <h3 className="text-3xl font-syncopate font-black uppercase italic text-white mb-4">Transfer Complete</h3>
        <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black leading-relaxed px-6">
          Your digital settlement is confirmed. Credits + Bonus successfully added. See you in the Archive. 🧿🛡️
        </p>
        <button 
          onClick={onClose}
          className="mt-16 w-full h-16 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          ENTER ARCHIVE
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full h-[90vh] md:h-auto md:max-h-[85vh] md:w-[480px] bg-black border-t md:border border-white/10 rounded-t-[3rem] md:rounded-[3rem] overflow-hidden flex flex-col shadow-[0_-20px_100px_rgba(0,0,0,1)]">
        
        {/* 🧬 HEADER */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ff6b00]/10 flex items-center justify-center border border-[#ff6b00]/20">
                <Diamond size={20} className="text-[#ff6b00]" />
              </div>
              <div>
                <h2 className="text-lg font-syncopate font-black text-white italic tracking-tighter">GASP // ARCHIVE</h2>
                <div className="flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-[#ff6b00] animate-pulse" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Strategic Treasury Active</span>
                </div>
              </div>
           </div>
           <button 
             onClick={onClose}
             className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:bg-white/10 hover:text-white transition-all"
           >
             <X size={18} />
           </button>
        </div>

        {!selectedPkgId ? (
          <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
              {/* 🧬 DYNAMIC PACKAGE GRID: REVENUE MAXIMIZER */}
              <div className="grid grid-cols-1 gap-4">
                {CREDIT_PACKAGES.map((pkg) => {
                  const isHighTier = pkg.priceUsd >= 50;
                  const bonusLabel = pkg.priceUsd >= 100 ? "+40% STRATEGIC BONUS" : pkg.priceUsd >= 50 ? "+25% BONUS" : "+15% INITIAL BONUS";
                  
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPkgId(pkg.id)}
                      className={`group relative p-6 rounded-[2rem] border transition-all text-left overflow-hidden ${
                        selectedPkgId === pkg.id 
                        ? 'bg-white/10 border-[#00f0ff] shadow-[0_0_40px_rgba(0,240,255,0.2)]' 
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
                      }`}
                    >
                      {isHighTier && (
                        <div className="absolute top-0 right-0 px-4 py-1 bg-[#00f0ff] text-black text-[7px] font-black uppercase tracking-widest rounded-bl-xl italic animate-pulse">
                          Institutional Tier
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between relative z-10">
                        <div className="space-y-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-white/40 block">Digital Credit Node</span>
                          <h4 className="text-xl font-syncopate font-black text-white italic">${pkg.priceUsd}</h4>
                        </div>
                        <div className="text-right">
                          <span className={`text-[9px] font-black uppercase tracking-widest block ${isHighTier ? 'text-[#00f0ff]' : 'text-[#ff6b00]'}`}>
                            {bonusLabel}
                          </span>
                          <span className="text-xl font-bold text-white tracking-widest">
                            {pkg.credits.toLocaleString()}💎
                          </span>
                        </div>
                      </div>

                      {selectedPkgId === pkg.id && (
                        <motion.div 
                          layoutId="pkg-glow"
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00f0ff]/5 to-transparent pointer-events-none"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 🧬 CUSTOM INPUT HUB */}
              <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">Custom Contribution</span>
                    <History 
                      size={14} 
                      className={`text-white/20 cursor-pointer hover:text-white transition-colors ${showHistory ? 'text-[#ff6b00]' : ''}`} 
                      onClick={() => setShowHistory(!showHistory)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <input 
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="ENTER AMOUNT"
                      className="flex-1 h-14 bg-black border border-white/10 rounded-2xl px-6 text-white font-syncopate text-xs focus:border-[#ff6b00] focus:ring-0 transition-all placeholder:text-white/10"
                    />
                    <button 
                      onClick={() => customAmount && setSelectedPkgId(`custom_${customAmount}`)}
                      className="w-14 h-14 bg-[#ff6b00] rounded-2xl flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
              </div>

              {showHistory && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">Archived Transfers</span>
                    <div className="space-y-2">
                        {history.length > 0 ? history.map((tx: Transaction) => (
                           <div key={tx.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <Clock size={12} className="text-[#ff6b00]" />
                                 <div className="flex flex-col">
                                    <span className="text-[10px] text-white font-bold">${tx.amount} US-SETTLE</span>
                                    <span className="text-[7px] text-white/20 uppercase font-black">{new Date(tx.timestamp).toLocaleDateString()}</span>
                                 </div>
                              </div>
                              <span className="text-[9px] font-black text-[#ff6b00]">+{tx.credits.toLocaleString()}💎</span>
                           </div>
                        )) : (
                          <div className="p-8 text-center bg-white/2 border border-dashed border-white/5 rounded-2xl">
                             <p className="text-[8px] text-white/20 uppercase font-bold tracking-widest italic">No Institutional History Found</p>
                          </div>
                        )}
                    </div>
                </div>
              )}
          </div>
        ) : (
          <InstitutionalCashier 
            userId={userId} 
            customAmount={selectedPkgId.startsWith('custom_') ? selectedPkgId.split('_')[1] : CREDIT_PACKAGES.find(p => p.id === selectedPkgId)?.priceUsd.toString() || '0'} 
            onStepBack={() => setSelectedPkgId(null)}
          />
        )}

        <div className="p-6 bg-black/40 border-t border-white/5 flex items-center justify-center gap-2">
            <Lock size={12} className="text-white/20" />
            <span className="text-[7px] font-black uppercase tracking-widest text-white/20">End-to-End Sovereign Security Active</span>
        </div>
      </div>
    </div>
  );
}

function InstitutionalCashier({ userId, customAmount, onStepBack }: { userId: string, customAmount: string, onStepBack: () => void }) {
    const vaultAddress = "DGQVNRTWEv1HEwP6Wtcm1LEUPgZKsW9JfwVpEDjPcEkS";
    const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const [isPaying, setIsPaying] = useState(false);
    const { wallets } = useWallets();

    // 🧬 NATIVE ACTION: TRIGGER WALLET DIRECTLY
    const handleWalletPay = async () => {
        setIsPaying(true);
        try {
            // 1. EXTENSION CHECK (PHANTOM/SOLFARE)
            const solana = (window as any).solana;
            if (solana) {
                 window.location.href = `solana:${vaultAddress}?amount=${customAmount}&spl-token=${usdcMint}&label=GASP%20ARCHIVE&message=Refuel:${userId.slice(0,8)}`;
                 setIsPaying(false);
                 return;
            }

            // 2. PRIVY EMBEDDED WALLET CHECK
            const solanaWallet = wallets.find((w) => w.walletClientType === 'privy');
            if (solanaWallet) {
                alert("🛡️ Strategic Redirect: Opening Privy Secure Settlement...");
                window.location.href = `solana:${vaultAddress}?amount=${customAmount}&spl-token=${usdcMint}&label=GASP%20ARCHIVE`;
                setIsPaying(false);
                return;
            }

            alert("🛡️ No Wallet Detected. Please scan the QR Code below with your mobile wallet.");
        } catch (err) {
            console.error("❌ Settlement error:", err);
        }
        setIsPaying(false);
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(vaultAddress);
        alert("🛡️ Vault Address Copied for Archive Settlement.");
    };

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`solana:${vaultAddress}?amount=${customAmount}&spl-token=${usdcMint}&label=GASP%20ARCHIVE`)}`;

    return (
        <div className="flex-1 flex flex-col p-8 space-y-6 animate-in zoom-in duration-500 overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#00f0ff] italic flex items-center gap-2">
                   <ShieldCheck size={12} className="animate-pulse" /> Native Settlement Node Active
                </span>
                <button onClick={onStepBack} className="text-[9px] text-white/40 uppercase font-black tracking-widest hover:text-white">Return</button>
            </div>

            <div className="flex flex-col items-center bg-black/40 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                <div className="text-center space-y-2">
                    <h4 className="text-3xl font-syncopate font-black text-white italic tracking-tighter">${customAmount}</h4>
                    <p className="text-[8px] text-white/30 uppercase font-bold tracking-widest">Settlement for Archive Credits (USDC) 🛡️</p>
                </div>

                <div className="relative p-4 bg-white rounded-3xl group shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                    <img src={qrUrl} alt="Scan to Pay" className="w-40 h-40 object-contain rounded-xl" />
                    <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[8px] font-black uppercase text-black tracking-widest text-center px-4">Scan with Phantom<br/>or Trust Wallet App</span>
                    </div>
                </div>

                <div className="w-full space-y-3">
                    <button 
                        onClick={handleWalletPay}
                        disabled={isPaying}
                        className="w-full h-14 rounded-2xl bg-[#00f0ff] text-black font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_40px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2"
                    >
                        <Wallet size={16} /> Settle Invoice (One-Click)
                    </button>
                    <p className="text-[7px] text-white/30 uppercase text-center font-bold tracking-widest animate-pulse">
                        Desktop: Supports Phantom // Solflare // Backpack
                    </p>
                    
                    <p className="text-[7px] text-white/20 uppercase text-center font-black tracking-[0.3em] py-2">OR MANUAL SETTLEMENT</p>

                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl relative group">
                        <code className="block text-[9px] font-mono text-white/40 break-all text-center leading-relaxed mb-1 pr-6">
                            {vaultAddress}
                        </code>
                        <button 
                            onClick={copyAddress}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:bg-[#00f0ff] hover:text-black transition-all"
                        >
                            <Copy size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <p className="text-[7px] text-white/20 text-center font-black uppercase tracking-widest leading-loose pb-12 italic">
               Solana Native Node: ONLINE // 100% Sovereign USDC Settlement 🧿🛡️
            </p>
        </div>
    );
}
