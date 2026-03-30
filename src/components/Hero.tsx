'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ChevronDown, Radio } from 'lucide-react';
import Image from 'next/image';
import { useUser } from './providers/UserProvider';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const { login } = useUser();

  return (
    <section ref={containerRef} className="relative h-[25vh] w-full flex items-center justify-center overflow-hidden bg-obsidian border-b border-white/5">
      {/* Background Parallax */}
      <motion.div 
        style={{ y: y1, opacity, scale }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-obsidian via-obsidian-light to-obsidian" />
        <div className="absolute top-[-50%] left-[-10%] w-[40%] h-[150%] bg-neon-pink/5 rounded-full blur-[100px] animate-pulse-slow" />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 w-full max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2 bg-red-600/20 text-red-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-red-500/20 animate-pulse">
                <Radio size={10} fill="currentColor" />
                Live Now: 12.4k+
            </div>
            <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-5xl md:text-7xl font-outfit font-black tracking-tighter uppercase italic"
            >
                MI <span className="text-gradient-pink">AMOR</span>
            </motion.h1>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => login()}
                className="px-8 py-4 rounded-xl bg-white text-black font-outfit font-black uppercase tracking-widest text-[10px]"
            >
                Join Club
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl glass border border-white/20 text-white font-outfit font-bold uppercase tracking-widest text-[10px]"
            >
                Streams
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}


