'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

export default function SyncGate() {
  const [agreed, setAgreed] = useState(true); // Default to true to hide while checking
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const hasAgreed = localStorage.getItem('gasp_sync_agreed');
    if (!hasAgreed) {
      setAgreed(false);
    }
  }, []);

  const handleAgree = async () => {
    try {
      await fetch('/api/consent', { method: 'POST' });
    } catch (e) {
      console.warn('[Gate] Consent log err.');
    }
    localStorage.setItem('gasp_sync_agreed', 'true');
    setAgreed(true);
  };

  if (!isClient) return null;

  return (
    <AnimatePresence>
      {!agreed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl overflow-hidden font-outfit"
        >
          {/* Neural Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#ff00ff]/10 via-transparent to-black pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00f0ff]/10 blur-[120px] rounded-full pointer-events-none" />

          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col items-center text-center space-y-8 relative z-10"
          >
            {/* Forbidden Icon */}
            <div className="w-20 h-20 rounded-[2rem] bg-black/40 border border-[#ffea00]/30 flex items-center justify-center shadow-[0_0_40px_rgba(255,234,0,0.15)]">
                <ShieldCheck size={40} className="text-[#ffea00]" />
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-syncopate font-black uppercase italic tracking-tighter text-white">
                Syndicate Access Hub
              </h1>
              <p className="text-[11px] text-white/40 uppercase font-black tracking-[0.2em] leading-relaxed px-4">
                You are entering a <span className="text-white">Premium Narrative Intelligence Node</span>. 
                Verify you are 18+ and agree to the 
                <Link href="/terms" target="_blank" className="text-[#00f0ff] uppercase italic hover:underline ml-1"> Narrative Terms</Link> 
              </p>
              <p className="text-[8px] text-white/20 uppercase font-black tracking-widest pt-2 px-6">
                 All personas and intel streams are <span className="text-white/40">Sovereign AI-generated</span>. 
              </p>
            </div>

            <button
               onClick={handleAgree}
               className="group w-full h-16 bg-[#00f0ff] text-black rounded-2xl font-syncopate font-black uppercase italic tracking-widest text-[11px] shadow-[0_10px_40px_rgba(0,240,255,0.2)] hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-3"
            >
               Authorize Uplink
               <Zap size={16} className="text-black group-hover:scale-125 transition-transform" />
            </button>

            <div className="flex flex-col gap-2 pt-2">
               <p className="text-[8px] text-white/20 uppercase font-black tracking-widest italic opacity-40">AllTheseFlows Strategic Media LLC</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
