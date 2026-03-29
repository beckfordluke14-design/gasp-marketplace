'use client';

import { Diamond, Zap, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '../providers/UserProvider';
import { formatCredits } from '@/lib/format';
import { motion, AnimatePresence } from 'framer-motion';

interface CoinBalanceProps {
  onOpenTopUp: () => void;
}

export default function CoinBalance({ onOpenTopUp }: CoinBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user, authenticated } = useUser();
  const prevBalanceRef = useRef<number | null>(null);

  async function fetchBalance() {
    const guestId = localStorage.getItem('gasp_guest_id');
    const idToUse = user?.id || guestId;

    if (!idToUse) return;

    try {
        const res = await fetch(`/api/economy/balance?userId=${idToUse}`);
        const data = await res.json();
        if (data.success) {
            const newBal = data.balance;
            
            // 🎁 TRIGGER: Success Animation on Increase
            if (prevBalanceRef.current !== null && newBal > prevBalanceRef.current) {
               setShowSuccess(true);
               setTimeout(() => setShowSuccess(false), 3000);
            }
            
            setBalance(newBal);
            prevBalanceRef.current = newBal;
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
            // RE-INITIALIZE: The success trigger above will handle the animation
         } else {
            alert(`Claim Failure: ${data.error || 'Identity rejection.'}`);
         }
     } catch (e: any) {
         console.error('[Claim] Pulse Failure:', e);
         alert(`Neural Pulse Error: ${e.message}`);
     }
     setLoading(false);
  };

  if (!authenticated) return null;

  return (
      <div className="relative flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 text-white font-outfit">
         
         <AnimatePresence>
            {showSuccess && (
               <motion.div 
                 initial={{ opacity: 0, y: 10, scale: 0.5 }}
                 animate={{ opacity: 1, y: -25, scale: 1.1 }}
                 exit={{ opacity: 0, scale: 1.5 }}
                 className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#00f0ff] text-black px-3 py-1 rounded-full shadow-[0_0_30px_#00f0ff] whitespace-nowrap"
               >
                  <CheckCircle2 size={12} className="shrink-0" />
                  <span className="text-[9px] font-black uppercase tracking-widest">GASP Credits Injected</span>
               </motion.div>
            )}
         </AnimatePresence>

         <motion.div
           animate={showSuccess ? { 
             scale: [1, 1.2, 1],
             filter: ["blur(0px)", "blur(2px)", "blur(0px)"]
           } : {}}
           className="flex items-center gap-2"
         >
            <Diamond 
              size={12} 
              className={`md:size-14 transition-colors duration-500 ${showSuccess ? 'text-white' : 'text-[#00f0ff]'} animate-pulse`} 
            />
            <span className="text-[12px] md:text-[14px] font-black italic tracking-tighter">
               {balance !== null ? formatCredits(balance) : '---'}
            </span>
         </motion.div>
         
         {balance !== null && (balance === 0 || balance < 100) && (
           <button 
             onClick={claimStarter}
             disabled={loading}
             className="ml-4 px-4 py-1.5 bg-[#ff00ff] text-black text-[9px] font-black uppercase tracking-widest rounded-xl animate-pulse hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_#ff00ff] flex items-center gap-2"
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
