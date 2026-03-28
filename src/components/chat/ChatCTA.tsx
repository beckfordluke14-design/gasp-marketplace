'use client';

import { motion } from 'framer-motion';
import { Zap, Diamond, ArrowRight, UserPlus, ShieldPlus } from 'lucide-react';
import { useUser } from '../providers/UserProvider';

interface ChatCTAProps {
  type: 'signup' | 'topup';
  onAction: () => void;
  personaName?: string;
  balance?: number;
}

export default function ChatCTA({ type, onAction, personaName, balance }: ChatCTAProps) {
  const { login } = useUser();

  if (type === 'signup') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="mx-2 my-8 p-6 bg-gradient-to-br from-[#111] to-[#050505] border border-white/10 rounded-[2.5rem] flex flex-col items-center gap-4 text-center shadow-2xl relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[#ff00ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="w-14 h-14 bg-[#ff00ff]/20 rounded-full flex items-center justify-center mb-1 border border-[#ff00ff]/30 shadow-[0_0_40px_rgba(255,0,255,0.2)]">
           <UserPlus size={24} className="text-[#ff00ff] animate-pulse" />
        </div>

        <div className="space-y-1 z-10">
           <h3 className="text-sm font-syncopate font-black uppercase text-white italic italic tracking-tighter">
             CONNECTION PAUSED
           </h3>
           <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed max-w-[240px] font-black">
             You’ve Ran Out of Credits. <br /> Sign up to Continue the Conversation with <span className="text-[#ff00ff]">{personaName}</span> & get 5,000 FREE.
           </p>
        </div>

        <button 
           onClick={() => login()}
           className="mt-2 w-full h-16 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] font-syncopate italic rounded-2xl hover:bg-[#00f0ff] hover:text-black transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 z-10 flex items-center justify-center gap-2"
        >
           CLAIM 5,000 FREE CREDITS
           <ArrowRight size={14} />
        </button>

        <div className="pt-2 flex items-center gap-2 opacity-30">
           <ShieldPlus size={10} className="text-[#ff00ff]" />
           <span className="text-[7px] font-black uppercase tracking-widest">Sovereign Identity Protection Active</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="mx-2 my-8 p-6 bg-gradient-to-br from-[#111] to-[#050505] border border-white/10 rounded-[2.5rem] flex flex-col items-center gap-4 text-center shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-[#00f0ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="w-14 h-14 bg-[#00f0ff]/20 rounded-full flex items-center justify-center mb-1 border border-[#00f0ff]/30 shadow-[0_0_40px_rgba(0,240,255,0.2)]">
         <Diamond size={24} className="text-[#00f0ff]" />
      </div>

      <div className="space-y-1 z-10">
         <h3 className="text-sm font-syncopate font-black uppercase text-white italic italic tracking-tighter">
           OUT OF CREDITS
         </h3>
         <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed max-w-[240px] font-black">
           You currently have <span className="text-white font-syncopate">{balance !== undefined ? balance.toLocaleString() : '---'}</span>. <br /> Top up to Continue the Conversation.
         </p>
      </div>

      <button 
         onClick={onAction}
         className="mt-2 w-full h-16 bg-[#00f0ff] text-black text-[10px] font-black uppercase tracking-[0.3em] font-syncopate italic rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,240,255,0.3)] z-10 flex items-center justify-center gap-2"
      >
         RECHARGE HUB
         <Zap size={14} fill="currentColor" />
      </button>

      <div className="pt-2 flex items-center gap-2 opacity-30">
         <ShieldPlus size={10} className="text-[#ff00ff]" />
         <span className="text-[7px] font-black uppercase tracking-widest">Instant Sovereign Bridge</span>
      </div>
    </motion.div>
  );
}
