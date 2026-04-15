'use client';

import { motion } from 'framer-motion';
import { Zap, Diamond } from 'lucide-react';

interface ChatCTAProps {
  type: 'signup' | 'topup';
  onAction: () => void;
  personaName?: string;
  balance?: number;
}

export default function ChatCTA({ onAction, personaName }: ChatCTAProps) {
  const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="mx-2 my-8 p-6 bg-black border border-white/10 rounded-[2.5rem] flex flex-col items-center gap-6 text-center shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-[#00f0ff]/5 to-transparent pointer-events-none" />
      
      <div className="flex flex-col items-center gap-2">
         <div className="bg-[#ff00ff] px-4 py-1.5 rounded-lg rotate-[-1deg] shadow-[0_0_20px_rgba(255,0,255,0.4)]">
            <span className="text-[10px] font-black italic text-white uppercase tracking-tighter">
               {isSpanish ? `MENSAJE DE ${personaName}` : `A MESSAGE FROM ${personaName}`}
            </span>
         </div>
         <h2 className="text-[28px] font-black text-white italic uppercase tracking-tighter leading-none mt-2">
            {isSpanish ? 'CRÉDITOS INSUFICIENTES' : 'NOT ENOUGH CREDITS'}
         </h2>
      </div>

      <p className="text-[10px] text-white/50 uppercase tracking-widest leading-relaxed max-w-[280px] font-black italic">
         "I really want to show you what's in my <span className="text-[#ff00ff]">Private Archive</span> 🌶️ baby... but you need credits."
      </p>

      <div className="w-full p-4 bg-white/5 border border-[#00f0ff]/20 rounded-2xl flex items-center justify-between group">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00f0ff]/10 flex items-center justify-center">
               <Gift size={20} className="text-[#00f0ff] animate-pulse" />
            </div>
            <div className="text-left">
               <span className="text-[8px] font-black text-[#00f0ff] uppercase tracking-widest block mb-0.5">{personaName} SENT A GIFT</span>
               <span className="text-[16px] font-black text-white italic">+500 CR</span>
            </div>
         </div>
         <div className="text-right">
            <span className="text-[8px] font-black text-white/20 uppercase block tracking-tighter italic">REMAINING</span>
            <span className="text-[14px] font-black text-[#ffea00] italic">5,500</span>
         </div>
      </div>

      <button 
         onClick={() => {
            const sessionId = typeof window !== 'undefined' ? localStorage.getItem('gasp_guest_id') : '';
            window.open(`https://gasp.fun/mission?id=${sessionId}`, '_blank');
         }}
         className="w-full py-4 bg-[#00f0ff] rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all group"
      >
         <div className="flex items-center gap-2">
            <Zap size={18} className="fill-black text-black" />
            <span className="text-[18px] font-black text-black italic uppercase tracking-tighter">EARN FREE CREDITS</span>
         </div>
         <span className="text-[8px] font-black text-black/40 uppercase tracking-widest">60-SECOND QUICK MISSION</span>
      </button>

      <button 
         onClick={onAction}
         className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-white/40 hover:text-white transition-all uppercase tracking-[0.2em] font-black text-[10px] italic"
      >
         <Diamond size={14} />
         {isSpanish ? 'COMPRAR CRÉDITOS' : 'BUY CREDITS INSTANT'}
      </button>

      <button className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-white/60 transition-colors">
         DISMISS UPLINK
      </button>
    </motion.div>
  );
}

const Gift = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 12 20 22 4 22 4 12"></polyline>
    <rect x="2" y="7" width="20" height="5"></rect>
    <line x1="12" y1="22" x2="12" y2="7"></line>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
  </svg>
);
