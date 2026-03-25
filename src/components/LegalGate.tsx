'use client';

import { useState, useEffect } from 'react';

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

        <div className="space-y-1 relative z-10 w-full">
           <p className="text-[9px] text-[#00f0ff] uppercase tracking-[0.3em] font-black animate-pulse shadow-[#00f0ff]">Classified Access</p>
           <h2 className="text-white font-syncopate font-black uppercase italic tracking-tighter text-3xl md:text-4xl drop-shadow-lg">
             VIP Pass
           </h2>
           <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pt-4" />
        </div>
        
        <p className="text-white/70 font-outfit text-xs md:text-sm leading-relaxed relative z-10 pt-2">
          This is an <span className="text-white font-bold tracking-wide">18+ Hyper-realistic AI Experience.</span> By entering, you confirm you are 18 years or older and agree to the Terms of Service provided by AllTheseFlows LLC. You acknowledge that all personas, media, and interactions on this platform are synthetic assets generated for entertainment.
        </p>

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


