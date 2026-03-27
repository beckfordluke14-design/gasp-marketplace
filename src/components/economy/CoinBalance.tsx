'use client';

import { Diamond, ChevronRight, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

// 🛡️ SOVEREIGN SYNC: Using Economy Balance API (Service Role) instead of 'anon' client.
// This ensures that user credit counts are reliably fetched and displayed in the HUD.

interface CoinBalanceProps {
  onOpenTopUp: () => void;
}

export default function CoinBalance({ onOpenTopUp }: CoinBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchBalance() {
    const guestId = localStorage.getItem('gasp_guest_id');
    if (!guestId) return;

    try {
        const res = await fetch(`/api/economy/balance?userId=${guestId}`);
        const data = await res.json();
        if (data.success) {
            setBalance(data.balance);
        }
    } catch (e) {
        console.error('[Balance] Pulse Failure:', e);
    }
  }

  useEffect(() => {
    fetchBalance();
    
    // Neural polling for real-time wallet sync
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  const claimStarter = async () => {
     const guestId = localStorage.getItem('gasp_guest_id');
     if (!guestId || loading) return;
     setLoading(true);

     try {
         const res = await fetch('/api/economy/balance', {
            method: 'POST',
            body: JSON.stringify({ userId: guestId, action: 'starter_claim' })
         });
         const data = await res.json();
         if (data.success) {
            await fetchBalance();
            window.location.reload();
         }
     } catch (e) {
         console.error('[Claim] Pulse Failure:', e);
     }
     setLoading(false);
  };

  return (
     <div className="flex flex-col items-end gap-2">
        <button 
          onClick={onOpenTopUp}
          className={`flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-2.5 rounded-2xl md:rounded-[1.5rem] bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-[#00f0ff]/40 transition-all group shadow-2xl backdrop-blur-3xl`}
        >
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.4)] group-hover:scale-110 transition-transform">
             <Diamond size={12} className="md:size-16 text-black font-black" />
          </div>
          <div className="flex flex-col items-start leading-none gap-0.5">
             <span className="text-[13px] md:text-[16px] font-syncopate font-black italic tracking-tighter text-white">
                {balance !== null ? balance.toLocaleString() : <Zap size={14} className="animate-pulse text-[#00f0ff]" />}
             </span>
             <span className="hidden md:block text-[7px] font-black uppercase tracking-[0.2em] text-[#00f0ff] opacity-60">Verified Balance</span>
          </div>
          <ChevronRight size={14} className="text-white/20 group-hover:text-white transition-colors ml-1" />
        </button>
       
       {balance !== null && balance === 0 && (
         <button 
           onClick={claimStarter}
           disabled={loading}
           className="px-6 py-2 bg-[#ff00ff] text-black text-[9px] font-black uppercase tracking-widest rounded-xl animate-pulse hover:scale-110 transition-all shadow-[0_0_30px_#ff00ff] flex items-center gap-2"
         >
           {loading ? <Zap size={10} className="animate-spin" /> : <SparklesIcon />}
           Claim 5000 Starter Credits
         </button>
       )}
    </div>
  );
}

function SparklesIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3 1.912 4.913L18.825 9.825 13.913 11.738 12 16.65l-1.912-4.912-4.913-1.913 4.913-1.912z" />
            <path d="m5 3 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
            <path d="m19 17 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
        </svg>
    )
}
