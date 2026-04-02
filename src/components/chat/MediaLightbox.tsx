'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  items: Array<{ url: string; caption?: string }>;
  activeIndex: number;
  onNavigate?: (index: number) => void;
}

/**
 * 💎 SOVEREIGN MEDIA LIGHTBOX v9.0 // MULTI-LOCALE VISUAL HUB
 * High-fidelity, zoomable, slidable media viewer with 100% Bilingual Sync (EN/ES).
 */
export default function MediaLightbox({
  isOpen,
  onClose,
  items,
  activeIndex: initialIndex,
  onNavigate
}: MediaLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);

  // 🌍 GLOBAL LOCALE STATE
  const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  const handleNext = (e: any) => {
    e.stopPropagation();
    setScale(1);
    const next = (activeIndex + 1) % items.length;
    setActiveIndex(next);
    onNavigate?.(next);
  };

  const handlePrev = (e: any) => {
    e.stopPropagation();
    setScale(1);
    const prev = (activeIndex - 1 + items.length) % items.length;
    setActiveIndex(prev);
    onNavigate?.(prev);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-4 lg:p-10 select-none"
        onClick={() => { onClose(); setScale(1); }}
      >
        {/* 🏔️ TOP BAR */}
        <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-10 pointer-events-none">
           <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">
                {isSpanish ? 'Bóveda del Sindicato' : 'Syndicate Vault'}
              </span>
              <span className="text-[8px] font-black text-[#ff00ff] uppercase tracking-widest">{activeIndex + 1} / {items.length} {isSpanish ? 'NODOS' : 'NODES'}</span>
           </div>
           <button 
             onClick={onClose}
             className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all pointer-events-auto active:scale-95"
           >
              <X size={20} />
           </button>
        </div>

        {/* 🕹️ NAVIGATION CONTROLS */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 lg:px-12 z-20 pointer-events-none">
           <button 
             onClick={handlePrev}
             className="w-14 h-14 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-white/20 hover:text-white pointer-events-auto transition-all backdrop-blur-3xl group"
           >
              <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
           </button>
           <button 
             onClick={handleNext}
             className="w-14 h-14 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-white/20 hover:text-white pointer-events-auto transition-all backdrop-blur-3xl group"
           >
              <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </div>

         {/* 🎞️ MEDIA CONTAINER */}
         <div className="relative w-full h-full flex items-center justify-center p-4 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
               <motion.div
                 key={activeIndex}
                 drag="x"
                 dragConstraints={{ left: 0, right: 0 }}
                 dragElastic={0.2}
                 onDragEnd={(_, info) => {
                    if (info.offset.x > 100) handlePrev(new Event('click'));
                    else if (info.offset.x < -100) handleNext(new Event('click'));
                 }}
                 initial={{ opacity: 0, x: 100 }}
                 animate={{ opacity: 1, x: 0, scale }}
                 exit={{ opacity: 0, x: -100 }}
                 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                 className="relative max-w-[95vw] max-h-[85vh] cursor-zoom-in flex items-center justify-center"
                 onClick={(e) => {
                    e.stopPropagation();
                    if (scale === 1) setScale(2.5);
                    else setScale(1);
                 }}
               >
                  <img 
                    src={items[activeIndex]?.url} 
                    alt="Secure Data"
                    onContextMenu={(e) => e.preventDefault()}
                    className="rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] object-contain max-w-[95vw] max-h-[80vh] select-none pointer-events-none"
                  />

                  {/* 🛡️ SOVEREIGN WATERMARK */}
                  <div className="absolute inset-x-0 bottom-12 flex justify-center pointer-events-none select-none opacity-40">
                     <span className="text-[14px] md:text-[24px] font-black uppercase tracking-[0.6em] text-white/60 italic drop-shadow-2xl font-syncopate">
                        GASP.FUN
                     </span>
                  </div>

                  {/* 🛡️ ANTI-DOWNLOAD MESH */}
                  <div 
                    className="absolute inset-0 z-10" 
                    onContextMenu={(e) => e.preventDefault()}
                  />

                  {scale > 1 && (
                     <div className="absolute top-6 right-6 px-4 py-1.5 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full text-[9px] text-[#ffea00] font-black uppercase tracking-[0.2em]">
                        {isSpanish ? 'Sincronización Activa • Toque para Reiniciar' : 'Active Sync • Tap to Reset'}
                     </div>
                  )}
               </motion.div>
            </AnimatePresence>
         </div>

        {/* 📄 CAPTION HUB */}
        <div className="absolute bottom-12 inset-x-0 px-10 text-center pointer-events-none">
           <AnimatePresence mode="wait">
              <motion.p
                key={activeIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] md:text-xs font-black uppercase tracking-[0.1em] text-white/40 italic flex items-center justify-center gap-2"
              >
                 {items[activeIndex]?.caption || (isSpanish ? "Transferencia de Archivos Segura" : "Secure File Transfer") + " #"+activeIndex}
              </motion.p>
           </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
