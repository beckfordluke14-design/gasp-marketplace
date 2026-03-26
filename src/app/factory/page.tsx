"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Plus, Zap, Activity, Trash2, Clock, MapPin, UserPlus, Mic, Film, ImageIcon, Lock, Music, Disc, RefreshCcw, LayoutDashboard, Settings } from 'lucide-react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Persona, initialPersonas } from '@/lib/profiles';
import LiveStudioDeck from './components/LiveStudioDeck';
import AutopilotPanel from './components/AutopilotPanel';
import MarketerPanel from './components/MarketerPanel';

export default function FactoryPage() {
  const [vibe, setVibe] = useState('');
  const [agencyTarget, setAgencyTarget] = useState('independent');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dbPersonas, setDbPersonas] = useState<Persona[]>([]);
  const [dbPosts, setDbPosts] = useState<any[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [logs, setLogs] = useState<string[]>(["[Neural Engine] Ready for Deployment."]);
  const [studioMode, setStudioMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'studio' | 'autopilot' | 'marketer'>('studio');
  const [grokDeckPersona, setGrokDeckPersona] = useState<Persona | null>(null);
  
  // Studio State
  const [wordBank, setWordBank] = useState('');
  const [isMeshing, setIsMeshing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [vaultPrice, setVaultPrice] = useState(150);
  const [manualMediaUrl, setManualMediaUrl] = useState('');

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 50));

  const fetchFactoryData = async () => {
    try {
      const pRes = await fetch('/api/admin/persona');
      if (pRes.ok) {
        const data = await pRes.json();
        setDbPersonas(data);
      }
      const fRes = await fetch('/api/admin/feed');
      if (fRes.ok) {
        const data = await fRes.json();
        setDbPosts(data);
      }
    } catch (e) { console.error('Factory sync error:', e); }
  };

  useEffect(() => { fetchFactoryData(); }, []);

  const handleGenerate = async () => {
    if (!vibe) return;
    setIsGenerating(true);
    setProgress(10);
    addLog(`[Brain] Synchronizing Vision: ${vibe.toLowerCase()}`);
    
    try {
        const res = await fetch('/api/factory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vibe_hint: vibe, agency_id: agencyTarget })
        });
        setProgress(100);
        if (res.ok) {
            const newP = await res.json();
            addLog(`[Brain] Node '${newP.name}' Birth Successful.`);
            fetchFactoryData();
            setSelectedPersona(newP);
            setStudioMode(true);
        } else {
            addLog(`[Brain] Error: Deployment Blocked.`);
        }
    } catch (e) { addLog(`[Brain] Critical Failure.`); }
    setIsGenerating(false);
  };

  const handleMeshSmarter = async () => {
    if (!selectedPersona || !wordBank) return;
    setIsMeshing(true);
    addLog(`[Neural Mesh] Injecting Word Bank into ${selectedPersona.name}...`);
    try {
        const res = await fetch('/api/factory', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ persona_id: selectedPersona.id, new_words: wordBank })
        });
        if (res.ok) {
            addLog(`[Neural Mesh] Sub-millisecond Sync Complete.`);
            setWordBank('');
            fetchFactoryData();
        }
    } catch (e) { addLog(`[Neural Mesh] Sync Interrupted.`); }
    setIsMeshing(false);
  };

  const handleBuildContent = async (type: string) => {
    if (!selectedPersona) return;
    addLog(`[Studio] Building ${type} node for ${selectedPersona.name}...`);
    try {
        const res = await fetch('/api/admin/star', {
            method: 'POST',
            body: JSON.stringify({ 
                personaId: selectedPersona.id, 
                type: (type === 'vault' || type === 'vault_batch') ? 'image' : type,
                isVault: type === 'vault' || type === 'vault_batch',
                customPrompt: customPrompt,
                videoUrl: manualMediaUrl,
                imageUrl: manualMediaUrl,
                newState: true // is_burner/featured
            })
        });
        if (res.ok) {
            addLog(`[Studio] Node Live.`);
            setCustomPrompt('');
            setManualMediaUrl('');
            fetchFactoryData();
        }
    } catch (e) { addLog(`[Studio] Build Failed.`); }
  };

  const handleBuildVideo = () => handleBuildContent('video');

  const handleDeletePersona = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}?`)) return;
    try {
        await fetch('/api/factory', { method: 'DELETE', body: JSON.stringify({ id }) });
        fetchFactoryData();
        if (selectedPersona?.id === id) setSelectedPersona(null);
    } catch (e) { console.error(e); }
  };

  const handleDeletePost = async (id: string) => {
    try {
        await fetch('/api/factory', { method: 'DELETE', body: JSON.stringify({ id, type: 'post' }) });
        fetchFactoryData();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white font-outfit selection:bg-[#ff00ff] selection:text-white">
      {/* HEADER: COMMAND CENTER (System 5) */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-[#020202]/80 backdrop-blur-2xl border-b border-white/5 h-20 md:h-24">
         <div className="max-w-[1600px] mx-auto h-full px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-8 md:gap-16">
               <div className="flex flex-col">
                  <span className="text-xl md:text-2xl font-syncopate font-black italic tracking-tighter uppercase leading-none">Gasp Factory</span>
                  <span className="text-[8px] md:text-[10px] font-black tracking-[0.5em] text-[#ff00ff] uppercase mt-1">Syndicate v16.0 Neural Hub</span>
               </div>
               
               <nav className="hidden md:flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
                  {['studio', 'autopilot', 'marketer'].map((tab) => (
                     <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}>{tab}</button>
                  ))}
               </nav>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="hidden lg:flex items-center gap-6 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex flex-col items-end">
                     <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Syndicate Pulse</span>
                     <span className="text-[10px] font-syncopate font-black text-green-500 italic">2.4ms • Synced</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] animate-pulse" />
               </div>
               <button onClick={() => window.location.href = '/'} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                  <Activity size={20} className="text-white/40 group-hover:text-white transition-colors" />
               </button>
            </div>
         </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-8 pt-28 md:pt-40 pb-32">
         {activeTab === 'autopilot' ? (
           <AutopilotPanel />
         ) : activeTab === 'marketer' ? (
           <MarketerPanel onBirth={() => fetchFactoryData()} />
         ) : (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16">
             {/* LEFT: TELEMETRY & INPUT */}
             <div className="lg:col-span-4 space-y-8 md:y-12">
                 <div className="bg-white/5 border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 space-y-6 md:space-y-8 shadow-2xl">
                   <div className="space-y-2">
                      <h2 className="text-lg md:text-xl font-syncopate font-bold italic tracking-tighter uppercase leading-none">Syndicate Architect</h2>
                      <p className="text-white/20 text-[8px] md:text-[10px] uppercase tracking-widest">Deploy standard nodes or mass-genesis.</p>
                   </div>
                   
                   {/* BATCH SCHEDULER */}
                   <div className="bg-black/40 border border-[#ffea00]/20 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                         <span className="text-[8px] font-black uppercase text-[#ffea00] tracking-widest">Deployment Schedule</span>
                         <Clock size={12} className="text-[#ffea00]" />
                      </div>
                      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                         {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="min-w-[45px] h-12 bg-white/5 border border-white/5 rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer hover:bg-[#ffea00]/10 transition-all group">
                               <span className="text-[7px] text-white/40 uppercase font-black">{day}</span>
                               <span className="text-[6px] text-[#ffea00] group-hover:block hidden">Plan</span>
                            </div>
                         ))}
                      </div>
                   </div>

                  <div className="flex items-center justify-between mb-2 gap-4">
                     <p className="text-white/40 text-[9px] uppercase tracking-widest whitespace-nowrap">Agency Tag</p>
                     <input 
                         type="text"
                         value={agencyTarget} 
                         onChange={(e) => setAgencyTarget(e.target.value)} 
                         className="w-full bg-black/50 border border-white/10 rounded-lg text-[9px] uppercase tracking-widest text-[#ffea00] py-1.5 px-3 outline-none focus:border-[#ffea00]/50 transition-all font-mono"
                         placeholder="mi-amor-independent"
                     />
                  </div>
                  
                  <textarea 
                     value={vibe} onChange={(e) => setVibe(e.target.value)}
                     className="w-full h-32 md:h-40 bg-black/40 border border-white/10 rounded-2xl p-4 md:p-6 text-xs md:text-sm outline-none focus:border-[#ff00ff]/50 transition-all resize-none text-white/90 font-outfit"
                     placeholder="i.e: l.a. model, toxic energy, loves crystals, street fashion, 21yo..." 
                  />

                  {/* DEPLOYMENT STRATEGY */}
                  <div className="grid grid-cols-2 gap-3">
                     <button className="h-12 bg-[#ff00ff]/5 border border-[#ff00ff]/20 rounded-xl flex items-center justify-center gap-2 group hover:bg-[#ff00ff]/10 transition-all">
                        <UserPlus size={14} className="text-[#ff00ff]" />
                        <span className="text-[8px] font-black uppercase text-white/60">Standard (1+3)</span>
                     </button>
                     <button disabled className="h-12 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center gap-2 opacity-30 cursor-not-allowed">
                        <Film size={14} className="text-[#ffea00]" />
                        <span className="text-[8px] font-black uppercase text-white/40">Hero Video</span>
                     </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                     <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating} 
                        className={`h-14 rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all ${isGenerating ? 'bg-white/5 text-white/20' : 'bg-[#ff00ff] text-white hover:scale-105 shadow-[0_10px_30px_#ff00ff33]'}`}
                     >
                        {isGenerating ? 'Birth Pulse...' : 'Birth Node'}
                        {!isGenerating && <Plus size={14} />}
                     </button>
                     <button 
                        onClick={async () => {
                           if (!vibe) return;
                           setIsGenerating(true);
                           addLog(`[Brain] Initiating Mass Genesis for: ${vibe.toLowerCase()}`);
                           const res = await fetch('/api/factory', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ vision_prompt: vibe, agency_id: agencyTarget })
                           });
                           if (res.ok) {
                              addLog(`[Brain] Mass Genesis SUCCESS.`);
                              fetchFactoryData();
                           }
                           setIsGenerating(false);
                        }} 
                        disabled={isGenerating} 
                        className={`h-14 rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all ${isGenerating ? 'bg-white/5 text-white/20' : 'bg-red-600 text-white hover:scale-105 shadow-[0_10px_30px_#ef444433]'}`}
                     >
                        {isGenerating ? 'Mass Pulse...' : 'Mass Genesis'}
                        {!isGenerating && <Zap size={14} fill="white" />}
                     </button>
                  </div>
                </div>

                <div className="bg-black border border-white/5 rounded-[2rem] p-6 md:p-8 space-y-4 shadow-inner">
                   <h3 className="text-[8px] md:text-[10px] uppercase font-black tracking-widest text-white/20">Neural Logs</h3>
                   <div className="space-y-1.5 font-mono h-32 md:h-40 overflow-y-auto no-scrollbar scroll-smooth">
                      {logs.map((log, i) => (
                         <p key={i} className={`text-[8px] md:text-[10px] lowercase truncate ${log.includes('error') ? 'text-red-500' : 'text-white/40'}`}>{log}</p>
                      ))}
                   </div>
                </div>
             </div>

             {/* MIDDLE: PREVIEW */}
             <div className="lg:col-span-5 relative">
               <AnimatePresence mode="wait">
               {studioMode && selectedPersona ? (
                  <motion.div key={selectedPersona.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#050505] border border-white/10 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 space-y-8 md:space-y-10 shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden">
                     <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden relative border-2 border-[#ff00ff] shadow-[0_0_30px_rgba(255,0,255,0.3)]">
                           <Image src={selectedPersona.seed_image_url || selectedPersona.image} alt="" fill unoptimized className="object-cover" />
                        </div>
                        <div className="space-y-1">
                           <h2 className="text-2xl md:text-3xl font-syncopate font-black uppercase italic tracking-tighter leading-none">{selectedPersona.name}</h2>
                           <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#00f0ff]">{selectedPersona.city} • {selectedPersona.age}yo</p>
                        </div>
                     </div>

                     <div className="space-y-4 pt-6 md:pt-8 border-t border-white/5">
                        <div className="flex items-center justify-between">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ffea00]">Neural Word Bank</h3>
                           <button onClick={handleMeshSmarter} disabled={isMeshing || !wordBank} className="px-4 py-2 bg-[#ffea00] text-black rounded-xl text-[8px] font-black uppercase flex items-center gap-2">
                               {isMeshing ? 'Meshing...' : 'Mesh Smarter'}
                               <RefreshCcw size={10} className={isMeshing ? 'animate-spin' : ''} />
                           </button>
                        </div>
                        <input value={wordBank} onChange={(e) => setWordBank(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-[11px] text-white/80" placeholder="Inject slang..." />
                     </div>

                     <div className="space-y-4 pt-6 border-t border-white/5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00f0ff]">Scene Injection</h3>
                        <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} className="w-full h-24 bg-white/5 border border-white/5 rounded-2xl p-4 text-[11px] text-white/90 resize-none font-outfit" placeholder="Describe the scene..." />
                        <input value={manualMediaUrl} onChange={(e) => setManualMediaUrl(e.target.value)} placeholder="Manual URL Override..." className="w-full bg-black border border-white/10 rounded-xl p-3 text-[9px] text-white/70" />
                     </div>

                     <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                        <button onClick={() => handleBuildContent('image')} className="p-4 bg-white/5 rounded-2xl flex flex-col items-center gap-2">
                           <ImageIcon size={20} className="text-white/40" />
                           <span className="text-[9px] font-black uppercase text-white/40">Feed Post</span>
                        </button>
                        <button onClick={() => handleBuildContent('vault')} className="p-4 bg-[#ff00ff]/10 rounded-2xl flex flex-col items-center gap-2 border border-[#ff00ff]/20">
                           <Lock size={20} className="text-[#ff00ff]" />
                           <span className="text-[9px] font-black uppercase text-[#ff00ff]">Vault Drops</span>
                        </button>
                     </div>

                     <button onClick={() => handleBuildContent('blitz')} className="w-full h-20 bg-gradient-to-r from-[#ff00ff]/20 to-[#00f0ff]/20 rounded-2xl border border-white/10 flex flex-col items-center justify-center">
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white">ONE-CLICK SYNC (ALL)</span>
                        <p className="text-[7px] font-black uppercase text-white/30 mt-2">Generate 5 Images + 3 Videos Instantly</p>
                     </button>
                  </motion.div>
               ) : (
                  <div className="aspect-[4/5] bg-white/5 border border-white/5 rounded-[3rem] flex flex-col items-center justify-center gap-6 text-white/10">
                     <Activity size={48} className="animate-pulse opacity-50" />
                     <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">Awaiting Selection</p>
                  </div>
               )}
               </AnimatePresence>
             </div>

             {/* RIGHT: DIRECTORY */}
             <div className="lg:col-span-3 space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-syncopate font-black uppercase tracking-[0.3em] text-[#ff00ff]">Portfolio</h3>
                  <span className="text-[8px] font-black text-white/20 uppercase">{dbPersonas.length} nodes</span>
               </div>
               <div className="space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar pb-32 font-mono">
                  {dbPersonas.map(p => (
                     <div key={p.id} onClick={() => { setSelectedPersona(p); setStudioMode(true); }} className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer ${selectedPersona?.id === p.id ? 'bg-[#ff00ff]/10 border-[#ff00ff]/30' : 'bg-white/5 border-white/5'}`}>
                        <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-white/10">
                           <Image src={p.seed_image_url || p.image} alt="" fill unoptimized className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-[10px] font-black uppercase truncate text-white/90">{p.name}</p>
                           <p className="text-[8px] text-white/20 tracking-widest truncate uppercase italic">{p.city}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeletePersona(p.id, p.name); }} className="p-2 text-red-400/40 hover:text-red-500">
                           <Trash2 size={14} />
                        </button>
                     </div>
                  ))}
               </div>
             </div>
           </div>
         )}
      </main>
      {grokDeckPersona && <LiveStudioDeck persona={grokDeckPersona} onClose={() => setGrokDeckPersona(null)} />}
    </div>
  );
}



