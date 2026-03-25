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
        {/* High-Lux Vertical Branding (Right Center) - GASP V9.5 */}
        <div className="absolute top-1/2 -translate-y-1/2 right-6 flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity duration-500 [writing-mode:vertical-rl] rotate-180">
            <span className="text-sm md:text-lg font-syncopate font-bold uppercase italic tracking-[0.4em] text-white/80 drop-shadow-[0_0_15px_rgba(255,0,255,0.4)]">
                {personaName ? `${personaName} | ` : ''}Found on <span className="text-[#ff00ff]">GASP.FUN</span> 📡
            </span>
            <div className="h-24 w-0.5 bg-gradient-to-t from-transparent via-[#ff00ff]/50 to-transparent mt-4" />
        </div>

        {/* Minimalist Corner Glyph */}
        <div className="absolute bottom-10 left-10 border-l border-b border-[#00f0ff]/20 w-8 h-8 rounded-bl-xl" />
    </div>
  );
};

export default BrandingOverlay;



