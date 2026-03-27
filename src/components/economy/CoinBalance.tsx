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
      <div className="flex flex-col items-end gap-1">
         <div 
           className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-2.5 rounded-2xl md:rounded-full bg-black/5 backdrop-blur-3xl border border-white/5 shadow-inner"
         >
           <div className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center bg-[#00f0ff]/10 text-[#00f0ff]">
              <Diamond size={14} className="font-black" />
           </div>
           <div className="flex flex-col items-start leading-none">
              <span className="text-[14px] md:text-[18px] font-black italic tracking-tighter text-white font-outfit">
                 {balance !== null ? balance.toLocaleString() : '---'}
              </span>
              <span className="text-[6px] font-black uppercase tracking-[0.2em] text-[#00f0ff]/40">Verified Balance</span>
           </div>
         </div>
       
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
