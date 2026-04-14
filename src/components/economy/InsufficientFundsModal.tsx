'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Diamond, AlertCircle, Zap, ArrowLeft, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '../providers/UserProvider';
import { formatCredits } from '@/lib/format';
import SyndicateMissionBoard from './SyndicateMissionBoard';
import { SYNDICATE_CONFIG } from '@/lib/economy/monetizationConfig';

interface InsufficientFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTopUp: () => void;
  personaName?: string;
}

export default function InsufficientFundsModal({ isOpen, onClose, onOpenTopUp, personaName }: InsufficientFundsModalProps) {
  const { profile } = useUser();
  const [balance, setBalance] = useState<number | null>(null);
  const [showQuests, setShowQuests] = useState(false);
  const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';
  const isCompliance = SYNDICATE_CONFIG.compliance;

  useEffect(() => {
    if (!isOpen) setShowQuests(false);
  }, [isOpen]);

  useEffect(() => {
    async function fetchBalance() {
      const guestId = localStorage.getItem('gasp_guest_id');
      const idToUse = profile?.id || guestId;
      if (!idToUse || !isOpen) return;
      try {
        const res = await fetch(`/api/economy/balance?userId=${idToUse}`);
        const data = await res.json();
        if (data.success) setBalance(data.balance);
      } catch (e) {
        console.error('[Balance Fetch] Failed:', e);
      }
    }
    fetchBalance();
  }, [isOpen, profile?.id]);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {showQuests ? (
          <motion.div
            key="quests"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md"
          >
            <SyndicateMissionBoard onClose={onClose} />
            <button 
              onClick={() => setShowQuests(false)}
              className="absolute -top-12 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-white transition-all flex items-center gap-2"
            >
              <ArrowLeft size={10} />
              {isSpanish ? 'VOLVER' : 'GO BACK'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-[400px] bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-[0_20px_100px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ffea00] to-transparent opacity-50" />
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all hover:bg-white/10"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#ffea00]/10 border border-[#ffea00]/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,234,0,0.15)]">
                <Zap size={32} className="text-[#ffea00] animate-pulse" />
              </div>

              <h3 className="text-2xl font-syncopate font-black uppercase italic text-white tracking-tighter mb-2">
                {isCompliance ? (isSpanish ? 'IDENTIDAD PENDIENTE' : 'IDENTITY PENDING') : (balance && balance > 0 
                  ? (isSpanish ? 'CRÉDITOS INSUFICIENTES' : 'NOT ENOUGH CREDITS')
                  : (isSpanish ? 'SIN CRÉDITOS' : 'OUT OF CREDITS'))}
              </h3>
              
              <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black leading-relaxed mb-8 max-w-[320px] italic">
                {personaName ? (
                   isSpanish ? (
                     <>{isCompliance ? 'SINCRONIZACIÓN SEGURA CON' : 'CHATEAR CON'} <span className="text-[#ffea00]">{personaName.toUpperCase()}</span> {isCompliance ? 'REQUERIDA PARA MANTENER LA RUTA DE LA SEÑAL' : 'PARA CONTINUAR. SE REQUIERE ASIGNACIÓN DE CRÉDITOS PARA MANTENER LA CONEXIÓN'}. 🗝️🛡️</>
                   ) : (
                     <>{isCompliance ? 'Secure Sync with' : 'CHAT W/'} <span className="text-[#ffea00]">{personaName}</span> {isCompliance ? 'Required to Maintain Signal Path' : 'TO CONTINUE. Allocation of Credits Required to Maintain Connection'}. 🗝️🛡️</>
                   )
                ) : (
                   isSpanish ? (
                     <>SE REQUIERE ASIGNACIÓN DE <span className="text-[#ffea00]">{isCompliance ? 'IDENTIDAD SEGURA' : 'CRÉDITOS DEL SISTEMA'}</span> PARA ACCEDER AL ENLACE SEGURO DEL ARCHIVO. 🛡️🛰️</>
                   ) : (
                     <>Allocation of <span className="text-[#ffea00]">{isCompliance ? 'Secure Identity' : 'System Credits'}</span> Required to Access Secure Archive Uplink. 🛡️🛰️</>
                   )
                )}
              </div>

              <div className="w-full space-y-4 pb-8">
                <div className="space-y-2">
                   <div className="flex items-center gap-2 px-2">
                      <div className="h-[1px] flex-1 bg-[#00fff2]/20" />
                      <span className="text-[7px] font-black text-[#00fff2] tracking-[0.3em] uppercase italic">
                          {isCompliance ? 'PATH ALPHA: SECURE LINK' : 'PATH ALPHA: FREE ACCESS'}
                      </span>
                      <div className="h-[1px] flex-1 bg-[#00fff2]/20" />
                   </div>
                  <button 
                    onClick={() => setShowQuests(true)}
                    className="w-full h-18 rounded-2xl bg-[#00fff2] text-black text-[11px] font-black uppercase tracking-[0.3em] font-syncopate italic hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(0,255,242,0.4)] flex flex-col items-center justify-center group animate-pulse"
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={16} fill="currentColor" className="group-hover:rotate-12 transition-transform" />
                      {isCompliance ? (isSpanish ? 'ESTABLECER ENLACE' : 'ESTABLISH SECURE LINK') : (isSpanish ? 'GANA CRÉDITOS' : 'EARN FREE CREDITS')}
                    </div>
                    <span className="text-[8px] opacity-70 tracking-[0.2em] mt-1 uppercase font-black">
                      {isCompliance ? (isSpanish ? 'PROTOCOLO DE 60 SEGUNDOS' : '60-SECOND PROTOCOL CLEARANCE') : (isSpanish ? 'MISIÓN DE 60 SEGUNDOS' : '60-SECOND QUICK MISSION')}
                    </span>
                  </button>
                </div>

                <div className="space-y-2 opacity-50 hover:opacity-100 transition-opacity">
                   <div className="flex items-center gap-2 px-2">
                      <div className="h-[1px] flex-1 bg-white/10" />
                      <span className="text-[7px] font-black text-white/30 tracking-[0.3em] uppercase italic">PATH BETA: INSTANT</span>
                      <div className="h-[1px] flex-1 bg-white/10" />
                   </div>
                  <button 
                    onClick={() => { onClose(); onOpenTopUp(); }}
                    className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                  >
                    <Diamond size={12} fill="currentColor" />
                    {isCompliance ? (isSpanish ? 'CLEARANCE INSTANTÁNEO' : 'INSTANT CLEARANCE') : (isSpanish ? 'COMPRAR AHORA' : 'BUY CREDITS INSTANT')}
                  </button>
                </div>
                 
                <button 
                  onClick={onClose}
                  className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-[0.2em] hover:text-white transition-all shadow-md mt-4"
                >
                  {isSpanish ? 'VOLVER' : 'DISMISS UPLINK'}
                </button>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-center gap-2 opacity-20">
                <AlertCircle size={10} />
                <span className="text-[7px] font-black uppercase tracking-widest italic leading-tight">
                  {isSpanish 
                    ? 'Centro de Medios Estratégicos Soberano // Interfaz Segura' 
                    : 'Sovereign Strategic Media Hub // Secure Interface'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
