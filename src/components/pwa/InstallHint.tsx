'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Share, ExternalLink, X } from 'lucide-react';

export default function InstallHint() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Detect if we are on a mobile device and NOT already in standalone mode
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    if (isIOS && !isStandalone) {
      // Show hint after a small delay to let the initial layout settle
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-12 left-4 right-4 z-[99999] md:hidden"
      >
        <div className="bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-[#ff00ff]">
                <Smartphone size={20} />
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">System Alert</h4>
                <p className="text-[11px] font-black uppercase tracking-widest text-white">Full Immersion Required</p>
              </div>
            </div>
            <button onClick={() => setIsVisible(false)} className="p-2 text-white/20 hover:text-white transition-colors">
               <X size={16} />
            </button>
          </div>

          <p className="text-[10px] text-white/60 leading-relaxed uppercase tracking-widest">
            For the intended shared reality experience, tap <span className="inline-flex items-center align-middle bg-white/10 p-1 rounded-lg mx-1"><Share size={12} className="text-white" /></span> and then <span className="text-white font-black underline underline-offset-4">'Add to Home Screen'</span>.
          </p>

          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}



