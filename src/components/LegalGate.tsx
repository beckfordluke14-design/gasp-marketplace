'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LegalGate() {
  const [showGate, setShowGate] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasAccess = localStorage.getItem('gasp_access_granted');
    if (!hasAccess) {
      setShowGate(true);
    }
  }, []);

  if (!mounted || !showGate) return null;

  const handleEnter = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/consent', { method: 'POST' });
    } catch (e) {
      console.warn('[Gate] Non-fatal consent log err.');
    }
    localStorage.setItem('gasp_access_granted', 'true');
    setFadingOut(true);
    setTimeout(() => {
      setShowGate(false);
    }, 500); // Wait for the 500ms fade-out transition
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6 transition-all duration-700 ease-in-out ${fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'}`}
    >
      <div className="bg-black/50 backdrop-blur-3xl border-t border-[#ff00ff]/30 border-l border-white/10 border-r border-white/10 border-b border-black/50 rounded-[2rem] max-w-sm w-full p-8 md:p-10 shadow-[0_0_50px_rgba(255,0,255,0.15)] flex flex-col items-center text-center space-y-6 relative overflow-hidden">

        {/* Holographic VIP Glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-[#ff00ff]/10 via-transparent to-[#00f0ff]/10 opacity-50 pointer-events-none" />

        {/* 🧬 THE SYNDICATE SHIELD: DAO / MANAGED INTERFACE */}
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-xl font-syncopate font-black uppercase italic tracking-tighter text-white">Neural Uplink Interface</h2>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 italic">A Managed Service provided by AllTheseFlows Strategic Media LLC</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 space-y-10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-[#00f0ff]/5 to-transparent pointer-events-none" />

          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-4 text-[#ffea00]">
              <div className="p-3 bg-[#ffea00]/10 rounded-2xl border border-[#ffea00]/30 animate-pulse">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Protocol Guardian</h3>
                <p className="text-[10px] font-black tracking-widest text-[#ffea00]/60 uppercase">Node Access Verified</p>
              </div>
            </div>

            <div className="space-y-4 text-white/50 text-[11px] leading-relaxed font-bold italic text-left">
              <p>
                GASP.FUN is an <span className="text-white">Institutional Strategic Operations Terminal</span> providing an encrypted uplink for <span className="text-[#00f0ff]">Digital Asset Retrieval and Neural Signal Synchronization</span>. By entering the Interface, you acknowledge the service as a provider of strategic intelligence and media management.
              </p>
              <p>
                All interactions are subject to the <span className="text-white">Sovereign Data Protocol</span>. Access to restricted archival assets requires valid System Credits. Consumption of intelligence is at your own discretion.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-[8px] font-black uppercase text-white/30 tracking-widest relative z-10 pt-4 border-t border-white/5">
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Uplink</Link>
                <Link href="/privacy" className="hover:text-white transition-colors">Data Privacy Node</Link>
                <Link href="/contact" className="hover:text-white transition-colors">Support Interface</Link>
            </div>
          </div>
        </div>

        <button
          onClick={handleEnter}
          disabled={isLoading}
          className="w-full flex items-center justify-center relative z-10 py-4 mt-2 bg-gradient-to-r from-[#ff00ff] to-[#00f0ff] text-black font-syncopate font-black italic uppercase tracking-widest text-xs md:text-sm rounded-xl hover:scale-105 shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all duration-300 disabled:opacity-50 disabled:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-black animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-black animate-bounce delay-75" />
              <span className="w-2 h-2 rounded-full bg-black animate-bounce delay-150" />
            </span>
          ) : 'Accept & Enter'}
        </button>
      </div>
    </div>
  );
}
