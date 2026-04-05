'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize2, Minimize2 } from 'lucide-react';
import Image from 'next/image';
import BrandingOverlay from './ui/BrandingOverlay';

interface VaultLightboxProps {
  items: any[];
  initialIndex: number;
  onClose: () => void;
}

/**
 * 💎 VAULT LIGHTBOX: SOVEREIGN ASSET VIEWER
 * Features: High-fidelity zoom, multi-axis slide navigation, and brand-locked watermarking.
 */
const VaultLightbox: React.FC<VaultLightboxProps> = ({ items, initialIndex, onClose }) => {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Drag-to-Slide Logic
  const x = useMotionValue(0);
  const backgroundOpacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  const handlePrev = useCallback(() => {
    setIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    setZoom(1);
  }, [items.length]);

  const handleNext = useCallback(() => {
    setIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    setZoom(1);
  }, [items.length]);

  const toggleZoom = () => {
    setZoom((prev) => (prev === 1 ? 2.5 : 1));
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onClose();
  }, [handlePrev, handleNext, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [handleKeyDown]);

  const currentItem = items[index];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl touch-none select-none"
      style={{ opacity: backgroundOpacity }}
    >
      {/* ── TOP HUB ── */}
      <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-50">
        <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ffea00] italic">Sovereign Vault</span>
            <div className="flex items-center gap-3">
                <span className="text-sm font-syncopate font-black uppercase italic tracking-tighter text-white/90">
                    {currentItem?.personas?.name || 'Asset Node'}
                </span>
                <span className="text-[8px] px-2 py-0.5 rounded-full bg-white/10 text-white/40 font-mono">
                    {index + 1} / {items.length}
                </span>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <button 
              onClick={toggleZoom}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              {zoom > 1 ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
            </button>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90 hidden md:flex"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-[#ff00ff]/20 border border-[#ff00ff]/30 flex items-center justify-center text-[#ff00ff] hover:bg-[#ff00ff]/30 transition-all active:scale-90 ml-4"
            >
              <X size={24} />
            </button>
        </div>
      </div>

      {/* ── MAIN VIEWER NODE ── */}
      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12 overflow-hidden">
         <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              drag={zoom === 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -100) handleNext();
                if (info.offset.x > 100) handlePrev();
              }}
              className="relative w-full h-full flex items-center justify-center"
            >
                <div className="relative w-full h-full md:max-w-4xl md:max-h-[80vh] aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5">
                    <motion.div 
                        animate={{ scale: zoom }}
                        drag={zoom > 1}
                        dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
                        className="w-full h-full relative"
                    >
                        <Image 
                          src={currentItem.content_url} 
                          alt="" 
                          fill 
                          unoptimized 
                          className="object-contain pointer-events-none" 
                        />
                        
                        {/* 🔒 BRAND WATERMARK OVERLAY */}
                        <BrandingOverlay showRepeating className="opacity-40" />
                    </motion.div>
                </div>
            </motion.div>

         </AnimatePresence>

         {/* ── NAVIGATION TRIGGERS ── */}
         <div className="absolute inset-y-0 left-0 w-1/4 hidden md:flex items-center justify-start pl-8 z-40 group cursor-pointer" onClick={handlePrev}>
            <div className="w-16 h-16 rounded-full bg-white/0 border border-white/0 group-hover:bg-white/5 group-hover:border-white/10 flex items-center justify-center text-white/0 group-hover:text-white/60 transition-all">
                <ChevronLeft size={32} />
            </div>
         </div>
         <div className="absolute inset-y-0 right-0 w-1/4 hidden md:flex items-center justify-end pr-8 z-40 group cursor-pointer" onClick={handleNext}>
            <div className="w-16 h-16 rounded-full bg-white/0 border border-white/0 group-hover:bg-white/5 group-hover:border-white/10 flex items-center justify-center text-white/0 group-hover:text-white/60 transition-all">
                <ChevronRight size={32} />
            </div>
         </div>
      </div>

      {/* ── BOTTOM INFO HUB ── */}
      <div className="absolute bottom-0 inset-x-0 p-8 flex flex-col md:flex-row items-center justify-between z-50 bg-gradient-to-t from-black to-transparent">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20">
                  <img src={currentItem?.personas?.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-[#ffea00] tracking-widest italic">Authentic Asset</span>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Verified Secure Transmission</p>
              </div>
          </div>

          <button 
            onClick={() => window.open(currentItem.content_url, '_blank')}
            className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
          >
            <Download size={16} />
            Download Original
          </button>
      </div>

      {/* Mobile Swipe Indicators */}
      <div className="absolute bottom-32 inset-x-0 flex justify-center gap-2 md:hidden">
          {items.map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-[#ff00ff] w-4' : 'bg-white/20'}`} 
              />
          ))}
      </div>
    </motion.div>
  );
};

export default VaultLightbox;
