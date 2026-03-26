import React from 'react';

interface BrandingOverlayProps {
  personaName?: string;
  className?: string;
}

/**
 * THE GASP v1.7 BRANDING-LOCK OVERLAY
 * Purpose: Professional-grade CTA over public content while keeping source files clean.
 * Design: High-lux, semi-transparent neon magenta/cyan.
 */
const BrandingOverlay: React.FC<BrandingOverlayProps> = ({ personaName, className = "" }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none z-20 overflow-hidden ${className}`}>
        {/* Horizon-Sync Horizontal Branding (Shifted Left) - GASP V11 */}
        <div className="absolute top-1/2 -translate-y-1/2 left-[40%] right-0 flex items-center opacity-70 transition-opacity duration-500">
            <div className="flex items-center gap-4 w-full">
                {/* Visual Anchor Line */}
                <div className="h-[1px] flex-1 bg-gradient-to-r from-[#ff00ff]/0 via-[#ff00ff]/40 to-[#ff00ff]/0" />
                <span className="whitespace-nowrap text-[10px] md:text-sm font-syncopate font-black uppercase italic tracking-[0.6em] text-white/90 drop-shadow-[0_0_15px_rgba(255,0,255,0.6)] pr-12">
                    FOUND ON <span className="text-[#ff00ff]">GASP.FUN</span>
                </span>
            </div>
        </div>

        {/* Minimalist Corner Glyph */}
        <div className="absolute bottom-10 left-10 border-l border-b border-[#00f0ff]/20 w-8 h-8 rounded-bl-xl z-50 pointer-events-none" />
    </div>
  );
};

export default BrandingOverlay;



