'use client';

import { useState } from 'react';
import { Gift, X, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileAvatar from '../profile/ProfileAvatar';
import BrandingOverlay from '../ui/BrandingOverlay';

interface FreebieImageBubbleProps {
  imageUrl:     string;
  profileImage?: string;
  profileName?: string;
  caption?:     string;
}

/**
 * FREEBIE IMAGE BUBBLE
 * Small gift thumbnail in chat → taps to full lightbox with zoom.
 * The profile gifted this image — it's free, no unlock required.
 */
export default function FreebieImageBubble({
  imageUrl,
  profileImage,
  profileName,
  caption,
}: FreebieImageBubbleProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [scale, setScale] = useState(1);

  return (
    <>
      {/* ── THUMBNAIL CHAT BUBBLE ── */}
      <div className="flex items-end gap-2 mt-1">
        {profileImage && (
          <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20 shrink-0 mb-1">
            <ProfileAvatar src={profileImage} alt={profileName || ''} />
          </div>
        )}

        <button
          onClick={() => setLightboxOpen(true)}
          className="group relative w-24 h-32 rounded-2xl overflow-hidden border border-[#ff00ff]/30 shadow-[0_0_20px_rgba(255,0,255,0.15)] hover:shadow-[0_0_30px_rgba(255,0,255,0.3)] transition-all active:scale-95"
        >
          {/* thumbnail image */}
          <img
            src={imageUrl}
            alt="Gift"
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none pointer-events-none"
          />

          {/* 🛡️ ANTI-DOWNLOAD SHIELD */}
          <div className="absolute inset-0 z-10 bg-transparent" />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Gift badge */}
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-[#ff00ff]/80 rounded-full backdrop-blur-sm">
            <Gift size={8} className="text-white" />
            <span className="text-[7px] font-black text-white uppercase tracking-widest">Free</span>
          </div>

          {/* Tap hint */}
          <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={10} className="text-white" />
            <span className="text-[7px] text-white font-black uppercase tracking-widest">View</span>
          </div>
        </button>
      </div>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center"
            onClick={() => { setLightboxOpen(false); setScale(1); }}
          >
            {/* Header */}
            <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#ff00ff]/20 border border-[#ff00ff]/30 rounded-full">
                <Gift size={12} className="text-[#ff00ff]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[#ff00ff]">
                  Gifted by {profileName || 'her'}
                </span>
              </div>
              <button
                onClick={() => { setLightboxOpen(false); setScale(1); }}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Image (tappable to zoom) */}
            <motion.div
              onClick={(e) => {
                e.stopPropagation();
                setScale(prev => prev === 1 ? 2.5 : 1);
              }}
              animate={{ scale }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative max-w-[95vw] max-h-[85vh] cursor-zoom-in group/media"
            >
              <img
                src={imageUrl}
                alt="Secure Asset"
                onContextMenu={(e) => e.preventDefault()}
                className="rounded-3xl object-contain max-w-[95vw] max-h-[85vh] shadow-[0_0_60px_rgba(255,0,255,0.2)] select-none pointer-events-none"
              />
              
              {/* 🛡️ SOVEREIGN WATERMARK SYSTEM (Internal Only) */}
              {!imageUrl.includes('http') || imageUrl.includes('asset.gasp.fun') || !imageUrl.includes('.') ? (
                <BrandingOverlay showRepeating={true} className="opacity-80" />
              ) : null}

              {/* 🛡️ ANTI-DOWNLOAD MESH */}
              <div 
                className="absolute inset-0 z-30" 
                onContextMenu={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  setScale(prev => prev === 1 ? 2.5 : 1);
                }}
              />

              {scale > 1 && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full text-[8px] text-[#ffea00] font-black uppercase tracking-widest z-40">
                   active zoom • tap to reset
                </div>
              )}
            </motion.div>

            {/* Caption */}
            {caption && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-8 text-center text-xs text-white/40 max-w-xs px-4"
              >
                {caption}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
