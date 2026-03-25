'use client';

import { Coins, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

interface CoinBalanceProps {
  onOpenTopUp: () => void;
}

export default function CoinBalance({ onOpenTopUp }: CoinBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      const guestId = localStorage.getItem('gasp_guest_id');
      if (!guestId) return;

      const { data, error } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', guestId)
          .maybeSingle();

      if (data && !error) {
          setBalance(data.balance);
      }
    }
    fetchBalance();
    
    // Low-frequency balance polling for UI freshness
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  const claimStarter = async () => {
     const guestId = localStorage.getItem('gasp_guest_id');
     if (!guestId) return;

     // Force credit 5000 
     const { data, error } = await supabase.rpc('process_spend', {
        p_user_id: guestId,
        p_amount: -5000, // Negative amount to add
        p_type: 'starter_claim',
        p_persona_id: 'system'
     });

     if (!error) window.location.reload();
  };

  return (
     <div className="flex flex-col items-end">
        <button 
          onClick={onOpenTopUp}
          className={`flex items-center gap-1.5 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group`}
        >
          <div className="w-5 h-5 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#00f0ff] to-[#0080ff] shadow-[0_0_20px_#00f0ff]">
             <Coins size={10} className="md:size-16 text-black font-bold" />
          </div>
          <div className="flex flex-col items-start leading-none gap-0.5">
             <span className="text-[12px] md:text-[14px] font-black tracking-tighter text-white">
                {balance !== null ? balance.toLocaleString() : '---'}
             </span>
             <span className="hidden md:block text-[8px] font-black uppercase tracking-[0.2em] text-[#00f0ff]">Breathe Points</span>
          </div>
        </button>
       
       {balance === 0 && (
         <button 
           onClick={claimStarter}
           className="px-3 py-1 bg-[#ff00ff] text-black text-[9px] font-black uppercase tracking-widest rounded-lg animate-pulse hover:scale-110 transition-all shadow-[0_0_20px_#ff00ff]"
         >
           Claim 5000 Starter
         </button>
       )}
    </div>
  );
}



