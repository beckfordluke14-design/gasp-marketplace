'use client';

import { motion } from 'framer-motion';

/**
 * GASP GLITCH TEXT
 * High-fidelity cyber-glitch effect that triggers once per view.
 * Lightweight & performance-optimized.
 */
export default function GlitchText({ text, className }: { text: string; className?: string }) {
  return (
    <motion.span
      className={`relative inline-block ${className}`}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-50px" }}
    >
      {/* Base Layer */}
      <motion.span 
        className="relative z-10"
        variants={{
          initial: { scale: 0.9, opacity: 0 },
          animate: { 
            scale: [0.9, 1.05, 1],
            opacity: 1,
            transition: { 
              duration: 0.4,
              times: [0, 0.7, 1],
              ease: "easeOut"
            }
          }
        }}
      >
        {text}
      </motion.span>
      
      {/* Magenta Shift Layer */}
      <motion.span
        variants={{
          initial: { opacity: 0, x: 0 },
          animate: {
            opacity: [0, 1, 0.7, 1, 0],
            x: [0, -3, 3, -2, 0],
            transition: { duration: 0.5, times: [0, 0.2, 0.4, 0.6, 1] }
          }
        }}
        className="absolute inset-0 z-0 text-[#ff00ff] pointer-events-none select-none"
        aria-hidden="true"
      >
        {text}
      </motion.span>

      {/* Cyan Shift Layer */}
      <motion.span
        variants={{
          initial: { opacity: 0, x: 0 },
          animate: {
            opacity: [0, 1, 0.8, 1, 0],
            x: [0, 3, -3, 2, 0],
            transition: { duration: 0.5, delay: 0.1, times: [0, 0.2, 0.4, 0.6, 1] }
          }
        }}
        className="absolute inset-0 z-0 text-[#00f0ff] pointer-events-none select-none"
        aria-hidden="true"
      >
        {text}
      </motion.span>

      {/* Horizontal Slice Layer */}
      <motion.span
        variants={{
          initial: { opacity: 0, scaleY: 1 },
          animate: {
            opacity: [0, 0.5, 0],
            scaleY: [1, 1.2, 1],
            transition: { duration: 0.2, delay: 0.1 }
          }
        }}
        className="absolute inset-0 z-0 bg-white/20 blur-sm pointer-events-none select-none"
        aria-hidden="true"
      />
    </motion.span>
  );
}
