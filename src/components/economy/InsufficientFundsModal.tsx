'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Diamond, AlertCircle, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '../providers/UserProvider';
import { formatCredits } from '@/lib/format';

interface InsufficientFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTopUp: () => void;
}

export default function InsufficientFundsModal({ isOpen, onClose, onOpenTopUp }: InsufficientFundsModalProps) {
  const { profile } = useUser();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      const guestId = localStorage.getItem('gasp_guest_id');
      const idToUse = profile?.id || guestId;
      if (!idToUse || !isOpen) return;

      try {
        const res = await fetch(`/api/economy/balance?userId=${idToUse}`);
        const data = await res.json();
        if (data.success) {
          setBalance(data.balance);
        }
      } catch (e) {
        console.error('[Balance Fetch] Failed:', e);
      }
    }
    fetchBalance();
  }, [isOpen, profile?.id]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-[400px] bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-[0_20px_100px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Decorative Glitch Background */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff00ff] to-transparent opacity-50" />
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all hover:bg-white/10"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#ff00ff]/10 border border-[#ff00ff]/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,0,255,0.15)]">
               <Zap size={32} className="text-[#ff00ff] animate-pulse" />
            </div>

            <h3 className="text-2xl font-syncopate font-black uppercase italic text-white tracking-tighter mb-2">
               NOT ENOUGH CREDITS
            </h3>
            
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black leading-relaxed mb-8 max-w-[280px]">
               Your current identity balance is <span className="text-white font-syncopate">{balance !== null ? formatCredits(balance) : '---'}</span>. 
               <br />
               Push more credits to your node to keep the connection alive. 🪙🛡️
            </p>

            <div className="w-full space-y-3">
               <button 
                 onClick={() => {
                   onClose();
                   onOpenTopUp();
                 }}
                 className="w-full h-16 rounded-2xl bg-[#00f0ff] text-black text-[10px] font-black uppercase tracking-[0.3em] font-syncopate italic hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(0,240,255,0.3)] flex items-center justify-center gap-3"
               >
                  <Diamond size={14} fill="currentColor" />
                  TOP UP NOW
               </button>
               
               <button 
                 onClick={onClose}
                 className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-[0.2em] hover:text-white transition-all"
               >
                  LATER
               </button>
            </div>
          </div>

          {/* Bottom Security Tag */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 opacity-20">
             <AlertCircle size={10} />
             <span className="text-[7px] font-black uppercase tracking-widest italic">Sovereign Protocol Active</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
