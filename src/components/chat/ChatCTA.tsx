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

/**
 * 🛰️ STRATEGIC CHAT CTA v9.0 // MULTI-LOCALE CONVERSION ENGINE
 * Strategy: High-Status In-Stream Prompts with 100% Bilingual Sync (EN/ES).
 */
export default function ChatCTA({ type, onAction, personaName, balance }: ChatCTAProps) {
  const { login } = useUser();

  // 🌍 GLOBAL LOCALE STATE
  const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';

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
           <h3 className="text-sm font-syncopate font-black uppercase text-white italic tracking-tighter">
             {isSpanish ? 'ENTRA A MI BÓVEDA PRIVADA' : 'ENTER MY PRIVATE VAULT'}
           </h3>
           <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed max-w-[240px] font-black">
             {isSpanish ? (
               <>Regístrate para ver mi archivo completo y recibe <span className="text-[#ff00ff]">1,500 créditos</span> de regalo para empezar.</>
             ) : (
               <>Join me to see my full archive and get a <span className="text-[#ff00ff]">1,500 credit gift</span> to help you get started.</>
             )}
           </p>
        </div>

        <button 
           onClick={() => login()}
           className="mt-2 w-full h-16 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] font-syncopate italic rounded-2xl hover:bg-[#ff00ff] hover:text-white transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 z-10 flex items-center justify-center gap-2"
        >
           {isSpanish ? 'ENTRAR Y RECLAMAR REGALO' : 'ENTER VAULT + 1,500 GIFT'}
           <ArrowRight size={14} />
        </button>

        <div className="pt-2 flex items-center gap-2 opacity-30">
           <ShieldPlus size={10} className="text-[#ff00ff]" />
           <span className="text-[7px] font-black uppercase tracking-widest">
              {isSpanish ? 'Conexión Segura Activa' : 'Secure Private Connection Active'}
           </span>
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
         <h3 className="text-sm font-syncopate font-black uppercase text-white italic tracking-tighter">
           {balance && balance > 0 
             ? (isSpanish ? 'CRÉDITOS INSUFICIENTES' : 'NOT ENOUGH CREDITS')
             : (isSpanish ? 'SIN CRÉDITOS' : 'OUT OF CREDITS')}
         </h3>
         <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed max-w-[240px] font-black">
           {isSpanish ? (
             <>Actualmente tienes <span className="text-white font-syncopate">{balance !== undefined ? balance.toLocaleString() : '---'}</span>. <br /> Añade créditos para mantener el Sincronismo.</>
           ) : (
             <>You currently have <span className="text-white font-syncopate">{balance !== undefined ? balance.toLocaleString() : '---'}</span>. <br /> Add credits to maintain Sync Lock.</>
           )}
         </p>
      </div>

      <button 
         onClick={onAction}
         className="mt-2 w-full h-16 bg-[#00f0ff] text-black text-[10px] font-black uppercase tracking-[0.3em] font-syncopate italic rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,240,255,0.3)] z-10 flex items-center justify-center gap-2"
      >
         {isSpanish ? 'CENTRO DE CRÉDITOS' : 'ADD CREDITS'}
         <Zap size={14} fill="currentColor" />
      </button>

      <div className="pt-2 flex items-center gap-2 opacity-30">
         <ShieldPlus size={10} className="text-[#ff00ff]" />
         <span className="text-[7px] font-black uppercase tracking-widest">
            {isSpanish ? 'Puente Soberano Instantáneo' : 'Instant Sovereign Bridge'}
         </span>
      </div>
    </motion.div>
  );
}
