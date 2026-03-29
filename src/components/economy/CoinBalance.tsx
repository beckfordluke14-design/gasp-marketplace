'use client';

import { Diamond, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '../providers/UserProvider';
import { formatCredits } from '@/lib/format';

interface CoinBalanceProps {
  onOpenTopUp: () => void;
}

export default function CoinBalance({ onOpenTopUp }: CoinBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, authenticated } = useUser();

  async function fetchBalance() {
    const guestId = localStorage.getItem('gasp_guest_id');
    const idToUse = user?.id || guestId;

    if (!idToUse) return;

    try {
        const res = await fetch(`/api/economy/balance?userId=${idToUse}`);
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
    const interval = setInterval(fetchBalance, 3000); // Poll every 3s for real-time feel

    // Listen for immediate refresh events after any spend
    const onSpend = () => setTimeout(fetchBalance, 500); // slight debounce for DB to commit
    window.addEventListener('gasp_balance_refresh', onSpend);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('gasp_balance_refresh', onSpend);
    };
  }, [user?.id]);

  const claimStarter = async () => {
     const guestId = localStorage.getItem('gasp_guest_id');
     const idToUse = user?.id || guestId;
     if (!idToUse || loading) return;
     setLoading(true);

     try {
         const res = await fetch('/api/economy/balance', {
            method: 'POST',
            body: JSON.stringify({ userId: idToUse, action: 'starter_claim' })
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

  // 🛡️ SILENT GUEST PROTOCOL: Invisible if not authenticated
  if (!authenticated) return null;

  return (
      <div className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 text-white">
         <Diamond size={12} className="md:size-14 text-[#00f0ff] animate-pulse" />
         <span className="text-[12px] md:text-[14px] font-black italic tracking-tighter">
            {balance !== null ? formatCredits(balance) : '---'}
         </span>
         
         {balance !== null && balance === 0 && (
           <button 
             onClick={claimStarter}
             disabled={loading}
             className="ml-4 px-4 py-1.5 bg-[#ff00ff] text-black text-[9px] font-black uppercase tracking-widest rounded-xl animate-pulse hover:scale-110 transition-all shadow-[0_0_30px_#ff00ff] flex items-center gap-2"
           >
             {loading ? <Zap size={10} className="animate-spin" /> : <SparklesIcon />}
             Claim Starter
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
