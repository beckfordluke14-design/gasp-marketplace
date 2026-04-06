'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2, Download } from 'lucide-react';
import BrandingOverlay from '../ui/BrandingOverlay';

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  items: Array<{ url: string; caption?: string }>;
  activeIndex: number;
  onNavigate?: (index: number) => void;
}

/**
 * 💎 SOVEREIGN MEDIA LIGHTBOX v11.0 
 * High-fidelity, zoomable, slidable media viewer with 100% Bilingual Sync (EN/ES).
 * Enhanced with premium zoom, improved slide navigation, and brand-locked repeating watermarks.
 */
export default function MediaLightbox({
  isOpen,
  onClose,
  items,
  activeIndex: initialIndex,
  onNavigate
}: MediaLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 🌍 GLOBAL LOCALE STATE
  const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';

  useEffect(() => {
    setActiveIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, isOpen]);

  const handleNext = useCallback((e?: any) => {
    if (e) e.stopPropagation();
    setZoom(1);
    const next = (activeIndex + 1) % items.length;
    setActiveIndex(next);
    onNavigate?.(next);
  }, [activeIndex, items.length, onNavigate]);

  const handlePrev = useCallback((e?: any) => {
    if (e) e.stopPropagation();
    setZoom(1);
    const prev = (activeIndex - 1 + items.length) % items.length;
    setActiveIndex(prev);
    onNavigate?.(prev);
  }, [activeIndex, items.length, onNavigate]);

  const toggleZoom = (e: any) => {
    e.stopPropagation();
    setZoom((prev) => (prev === 1 ? 2.5 : 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen) return null;

  const currentItem = items[activeIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-4 lg:p-10 select-none touch-none"
        onClick={() => { onClose(); setZoom(1); }}
      >
        {/* 🏔️ TOP BAR */}
        <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-[11000] pointer-events-none">
           <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">
                {isSpanish ? 'Bóveda del Sindicato' : 'Syndicate Vault'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black text-[#ff00ff] uppercase tracking-widest">{activeIndex + 1} / {items.length} {isSpanish ? 'NODOS' : 'NODES'}</span>
                {zoom > 1 && (
                  <span className="text-[8px] font-black text-[#ffea00] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#ffea00]/10 border border-[#ffea00]/20 animate-pulse">
                    {isSpanish ? 'ZOOM ACTIVO' : 'ZOOM ACTIVE'}
                  </span>
                )}
              </div>
           </div>
           
           <div className="flex items-center gap-2 pointer-events-auto">
              <button 
                onClick={toggleZoom}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                {zoom > 1 ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="w-12 h-12 rounded-2xl bg-[#ff00ff]/20 border border-[#ff00ff]/30 flex items-center justify-center text-[#ff00ff] hover:bg-[#ff00ff]/30 transition-all active:scale-95 ml-2"
              >
                <X size={24} />
              </button>
           </div>
        </div>

        {/* 🕹️ NAVIGATION CONTROLS */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 lg:px-12 z-[11000] pointer-events-none">
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
                 drag={zoom === 1 ? "x" : true}
                 dragConstraints={zoom === 1 ? { left: 0, right: 0 } : { left: -500, right: 500, top: -500, bottom: 500 }}
                 dragElastic={0.2}
                 onDragEnd={(_, info) => {
                    if (zoom === 1) {
                      if (info.offset.x > 100) handlePrev();
                      else if (info.offset.x < -100) handleNext();
                    }
                 }}
                 initial={{ opacity: 0, x: 100 }}
                 animate={{ opacity: 1, x: 0, scale: zoom }}
                 exit={{ opacity: 0, x: -100 }}
                 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                 className="relative max-w-[95vw] max-h-[85vh] flex items-center justify-center cursor-move"
                 onClick={(e) => e.stopPropagation()}
                 onDoubleClick={toggleZoom}
               >
                  <img 
                    src={currentItem?.url} 
                    alt="Secure Data"
                    onContextMenu={(e) => e.preventDefault()}
                    className="rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] object-contain max-w-[95vw] max-h-[80vh] select-none pointer-events-none border border-white/10"
                  />

                  {/* 🛡️ REPEATING BRAND WATERMARK (Leaked Marketing Engine) */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-overlay opacity-60 z-20">
                      {/* Giant Central Watermark */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-35deg] opacity-[0.15] select-none text-center">
                          <span className="text-[4rem] md:text-[6rem] font-black italic tracking-[0.1em] text-white whitespace-nowrap drop-shadow-2xl">
                              FOUND ON GASP.FUN
                          </span>
                      </div>
                      
                      {/* Micro Grid */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-8 opacity-[0.2]">
                          {Array.from({ length: 24 }).map((_, i) => (
                              <div key={i} className="flex items-center justify-center p-4">
                                  <span className="text-[12px] md:text-sm font-black uppercase tracking-widest -rotate-12 text-white drop-shadow-lg">
                                      found on gasp.fun
                                  </span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* VISIBLE BADGE FOR SHARING */}
                  <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-30 pointer-events-none opacity-80">
                      <div className="px-5 py-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
                          <span className="text-[12px] font-black uppercase tracking-[0.2em] text-white/70 italic">
                              Found on <span className="text-[#00f0ff]">gasp.fun</span>
                          </span>
                      </div>
                  </div>

                  <BrandingOverlay className="opacity-40" />

                  {/* 🛡️ ANTI-DOWNLOAD MESH */}
                  <div 
                    className="absolute inset-0 z-10" 
                    onContextMenu={(e) => e.preventDefault()}
                  />
               </motion.div>
            </AnimatePresence>
         </div>

        {/* 📄 CAPTION HUB */}
        <div className="absolute bottom-12 inset-x-0 px-10 text-center pointer-events-none z-[11000]">
           <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4"
              >
                 <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.1em] text-white/40 italic flex items-center justify-center gap-2">
                    {currentItem?.caption || (isSpanish ? "Transferencia de Archivos Segura" : "Secure File Transfer") + " #"+activeIndex}
                 </p>
                 
                 <div className="pointer-events-auto">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(currentItem?.url, '_blank');
                      }}
                      className="px-6 py-2.5 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2"
                    >
                      <Download size={14} />
                      {isSpanish ? 'DESCARGAR ORIGINAL' : 'DOWNLOAD ORIGINAL'}
                    </button>
                 </div>
              </motion.div>
           </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

