'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { VISION_LIBRARY, type VisualCategory } from '@/config/vision';
import { Camera, Zap, Film, Lock, Layers, Info, CheckCircle2, X } from 'lucide-react';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

export default function LiveStudioDeck({ persona, onClose }: { persona: any, onClose: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState<VisualCategory>('STREET_FLASH_CANDID');
  const [customClothing, setCustomClothing] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [logs, setLogs] = useState<string[]>(['[system] VisionEngine modules standing by...']);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);

  // Poll DB specifically for the new post or vault item
  useEffect(() => {
    if (!isRendering || finalVideoUrl) return;
    
    const channel = supabase
      .channel('video_gen_track')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'video_jobs' }, payload => {
          if (payload.new.persona_id === persona.id && payload.new.status === 'completed') {
             setLogs(prev => [...prev, '[grok_return] RENDER COMPLETE. Syncing Vault...']);
             // In production, we'd fetch the latest media_vault item here
             setIsRendering(false);
          }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isRendering, persona.id, finalVideoUrl]);

  const handleDispatch = async () => {
     setIsRendering(true);
     setLogs([
       '[stage_1] INITIALIZING IMAGE BRIDGE...', 
       `[engine] applying ${selectedCategory} technicals...`,
       `[optics] ${VISION_LIBRARY[selectedCategory].camera}`
     ]);

     try {
       const res = await fetch('/api/factory/generate', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ 
             personaId: persona.id, 
             categoryId: selectedCategory,
             customClothing: customClothing
           })
       });
       
       if (!res.ok) throw new Error('Generation bridge failed.');
       
       setLogs(p => [...p, '[stage_2] DISPATCHED TO GROK CLUSTER.', '[pulse] rendering motion vectors...']);
     } catch (e: any) {
        setLogs(p => [...p, '[error] Dispatch failed => ' + e.message]);
        setIsRendering(false);
     }
  };

  const categoryData = VISION_LIBRARY[selectedCategory];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-[#050505] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,1)] flex flex-col md:flex-row h-[90vh] md:h-auto">
        
        {/* LEFT: CONTROLS & PARAMS */}
        <div className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto no-scrollbar border-r border-white/5">
            <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-[#ff00ff] font-syncopate font-black uppercase tracking-widest text-sm md:text-lg italic">Live Vision Deck</h3>
                  <p className="text-[9px] text-white/20 uppercase tracking-[0.4em] font-black mt-1">Multi-Stage Synthesis Engine</p>
               </div>
               <button onClick={() => setShowHowTo(!showHowTo)} className="p-2 rounded-full bg-white/5 text-white/40 hover:text-[#00f0ff] transition-all">
                  <Info size={18} />
               </button>
            </div>

            {showHowTo && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#00f0ff]/10 border border-[#00f0ff]/30 p-4 rounded-2xl text-[10px] space-y-2 text-[#00f0ff]/80 font-bold leading-relaxed uppercase tracking-wider">
                 <p>• Select a Category: This injects hard camera physics (Leica/Hasselblad) and lighting into the AI.</p>
                 <p>• Tier Pricing: Deep Vault ($30), Story ($7.50), Feed ($0).</p>
                 <p>• Clothing: Add specific items (e.g. 'Red Latex Dress') to override the category's default.</p>
              </motion.div>
            )}

            <div className="space-y-4">
               <label className="text-[10px] uppercase font-black tracking-widest text-white/30 flex items-center gap-2">
                  <Layers size={12} /> Target Visual Category
               </label>
               <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(VISION_LIBRARY) as VisualCategory[]).map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-left transition-all border ${selectedCategory === cat ? 'bg-[#ff00ff] text-black border-[#ff00ff] shadow-[0_0_20px_#ff00ff44]' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'}`}
                    >
                       {cat.replace(/_/g, ' ')}
                       <div className="text-[7px] opacity-60 mt-0.5">{VISION_LIBRARY[cat].tier.replace('_', ' ')}</div>
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] uppercase font-black tracking-widest text-white/30 flex items-center gap-2">
                  <Zap size={12} /> Clothing Injection (Modular)
               </label>
               <input 
                  type="text"
                  value={customClothing}
                  onChange={(e) => setCustomClothing(e.target.value)}
                  placeholder={`Default: ${categoryData.default_clothing}`}
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white/90 outline-none focus:border-[#ffea00]/40 transition-all font-outfit"
               />
               <p className="text-[8px] text-white/20 uppercase font-bold text-center">Leave blank to use the category's default high-status outfit.</p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
               <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#00f0ff]">
                  <Camera size={12} /> Technical Anchors Locked
               </div>
               <div className="space-y-1.5 text-[10px] font-medium text-white/60 font-outfit lowercase italic">
                  <p><span className="text-white/20 uppercase not-italic font-black text-[8px] mr-2">Optics:</span> {categoryData.camera}</p>
                  <p><span className="text-white/20 uppercase not-italic font-black text-[8px] mr-2">Lighting:</span> {categoryData.lighting}</p>
                  <p><span className="text-white/20 uppercase not-italic font-black text-[8px] mr-2">Pose:</span> {categoryData.pose}</p>
               </div>
            </div>
        </div>

        {/* RIGHT: PREVIEW & TELEMETRY */}
        <div className="w-full md:w-[380px] bg-black p-6 md:p-10 flex flex-col justify-between border-l border-white/5">
            <div className="space-y-6">
               <div className="aspect-[3/4] bg-white/5 rounded-3xl overflow-hidden relative border border-white/10 group">
                  <Image src={persona.seed_image_url || persona.image} alt="" fill unoptimized className={`object-cover ${isRendering ? 'blur-xl animate-pulse grayscale' : ''}`} />
                  {isRendering && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm z-10">
                        <Film className="w-10 h-10 text-[#00f0ff] animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00f0ff]">Rendering...</span>
                     </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-6 inset-x-6 flex items-center gap-3">
                     <span className="px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-black uppercase text-[#ffea00] border border-[#ffea00]/30 shadow-lg">Source: Gemini 3.1</span>
                     {isRendering && <span className="px-3 py-1 bg-[#ff00ff] rounded-lg text-[10px] font-black uppercase text-black animate-bounce shadow-xl">Grok Active</span>}
                  </div>
               </div>

               <div className="bg-white/5 border border-white/10 rounded-2xl p-4 font-mono text-[9px] h-32 overflow-y-auto no-scrollbar space-y-1">
                  {logs.slice(-6).map((log, i) => (
                    <div key={i} className={`flex gap-2 ${log.includes('error') ? 'text-red-500' : 'text-white/40'}`}>
                       <span className="text-white/10">{i + 1}</span> {log}
                    </div>
                  ))}
               </div>
            </div>

            <div className="pt-8">
               <button 
                  onClick={handleDispatch}
                  disabled={isRendering}
                  className="w-full py-5 bg-[#ffea00] text-black font-syncopate font-black uppercase italic tracking-widest text-xs rounded-2xl hover:scale-[1.03] transition-all shadow-[0_0_30px_rgba(255,234,0,0.3)] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
               >
                  {isRendering ? 'Processing Neural Pulse...' : 'Initialize Render'}
                  {!isRendering && <CheckCircle2 size={18} />}
               </button>
            </div>
        </div>

        <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-white transition-all z-20"><X size={24} /></button>
      </div>
    </div>
  );
}



