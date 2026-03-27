"use client";
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { 
  Zap, 
  Sparkles, 
  Film, 
  Lock, 
  ChevronRight, 
  Activity, 
  Terminal,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RemoteDashboard() {
  const [vision, setVision] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [videoMode, setVideoMode] = useState<'none' | 'half' | 'each'>('none');
  const [vaultOnly, setVaultOnly] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'success' | 'err'}[]>([
    { msg: "Remote Neural Link Established. Ready for command.", type: 'info' }
  ]);
  const [deployedPersonas, setDeployedPersonas] = useState<any[]>([]);

  const addLog = (msg: string, type: 'info' | 'success' | 'err' = 'info') => {
    setLogs(prev => [{ msg, type }, ...prev].slice(0, 50));
  };

  const handleEnhance = async () => {
    if (!vision) return;
    setIsEnhancing(true);
    addLog("[Brain] Enhancing creative vision via Gemini-Vision-Engine...");
    try {
      const res = await fetch('/api/factory/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: vision })
      });
      const data = await res.json();
      if (data.enhanced) {
        setVision(data.enhanced);
        addLog("[Brain] Vision Synchronized and Optimized.", 'success');
      }
    } catch (e) {
      addLog("[Brain] Enhancement Interrupted.", 'err');
    }
    setIsEnhancing(false);
  };

  const handleDeploy = async () => {
    if (!vision) return;
    setIsDeploying(true);
    addLog(`[Syndicate] Initiating Deployment Sequence: ${vaultOnly ? 'VAULT-ONLY' : 'MASS-GENESIS'}...`);
    
    try {
      const res = await fetch('/api/factory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vision_prompt: vision,
          video_mode: videoMode,
          vault_only: vaultOnly
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        addLog(`[Syndicate] Cluster Deployed. ${data.count} nodes live.`, 'success');
        setDeployedPersonas(data.personas || []);
      } else {
        addLog("[Syndicate] Deployment Blocked by Mainframe.", 'err');
      }
    } catch (e) {
      addLog("[Syndicate] Critical Deployment Failure.", 'err');
    }
    setIsDeploying(false);
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white font-outfit selection:bg-[#ff00ff] overflow-hidden">
      {/* GLOW BACKGROUND EFFECTS */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ff00ff]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00f0ff]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* HEADER */}
      <header className="relative z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl h-20">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-syncopate font-black italic tracking-tighter uppercase">Remote Dashboard</span>
            <span className="text-[9px] font-black tracking-[0.4em] text-[#ff00ff] uppercase mt-0.5">Syndicate v21.1 Control Link</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Neural Pulse Active</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        
        {/* LEFT: INPUT COMMAND CENTER */}
        <div className="lg:col-span-7 space-y-10">
          <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 space-y-8 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap size={120} className="text-[#ff00ff]" />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 block">Creative Vision Input</label>
              <div className="relative">
                <textarea 
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  className="w-full h-48 bg-black/40 border border-white/10 rounded-3xl p-8 text-lg font-medium outline-none focus:border-[#ff00ff]/50 focus:ring-4 focus:ring-[#ff00ff]/5 transition-all resize-none placeholder:text-white/10"
                  placeholder="Describe your Syndicate Wave architecture... (e.g. Island Heat, Blasian beauties, sunset lighting)"
                />
                <button 
                  onClick={handleEnhance}
                  disabled={isEnhancing || !vision}
                  className="absolute bottom-6 right-6 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl flex items-center gap-3 transition-all disabled:opacity-30 group"
                >
                  <Sparkles size={16} className={isEnhancing ? 'animate-spin' : 'group-hover:text-[#ff00ff] transition-colors'} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Enhance Vision</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* VIDEO CONFIG */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Film size={16} className="text-[#00f0ff]" />
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Motion Dispatch</label>
                </div>
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl">
                  {['none', 'half', 'each'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setVideoMode(mode as any)}
                      className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${videoMode === mode ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-white/20 hover:text-white/40'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* MODE CONFIG */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Layers size={16} className="text-[#ffea00]" />
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Deployment Logic</label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVaultOnly(false)}
                    className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${!vaultOnly ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-white/20 hover:border-white/10'}`}
                  >
                    Standard Node
                  </button>
                  <button
                    onClick={() => setVaultOnly(true)}
                    className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${vaultOnly ? 'bg-red-500/20 border-red-500/30 text-white' : 'bg-transparent border-white/5 text-white/20 hover:border-white/10'}`}
                  >
                    Vault-Only (2G)
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleDeploy}
              disabled={isDeploying || !vision}
              className={`w-full h-20 rounded-3xl font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-4 transition-all overflow-hidden relative ${isDeploying ? 'bg-white/5 text-white/20 cursor-wait' : 'bg-[#ff00ff] text-white hover:scale-[1.02] shadow-[0_20px_50px_rgba(255,0,255,0.3)]'}`}
            >
              {isDeploying ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  <span>Deploying Cluster...</span>
                </>
              ) : (
                <>
                  <span>Deploy Syndicate Wave</span>
                  <ChevronRight size={20} />
                </>
              )}
              {isDeploying && (
                <motion.div 
                  className="absolute bottom-0 left-0 h-1 bg-white/40"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 15, ease: "linear" }}
                />
              )}
            </button>
          </section>

          {/* SYSTEM TELEMETRY */}
          <div className="bg-black/60 border border-white/5 rounded-[2rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal size={14} className="text-[#00f0ff]" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Mainframe Telemetry</h3>
              </div>
              <span className="text-[8px] font-mono text-white/20">V21.1_STABLE_LINK</span>
            </div>
            <div className="h-[200px] overflow-y-auto font-mono space-y-2 no-scrollbar">
              <AnimatePresence initial={false}>
                {logs.map((log, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-[10px] flex gap-3 ${log.type === 'success' ? 'text-green-400' : log.type === 'err' ? 'text-red-400' : 'text-white/40'}`}
                  >
                    <span className="shrink-0 opacity-20">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                    <span>{log.msg}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT: LIVE FEED / DEPLOYED NODES */}
        <div className="lg:col-span-5 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-syncopate font-black uppercase tracking-[0.3em] text-[#ff00ff]">Active Deployments</h3>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black text-white/40 uppercase">
              {deployedPersonas.length} Clusters Live
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {deployedPersonas.length === 0 ? (
              <div className="aspect-square bg-white/5 border border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-white/10 group hover:border-[#ff00ff]/20 transition-all">
                <Activity size={48} className="animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">Awaiting Wave Genesis</p>
              </div>
            ) : (
              deployedPersonas.map((p, idx) => (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-6 group hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="w-20 h-20 rounded-2xl bg-black border border-white/10 overflow-hidden relative border-2 border-[#ff00ff]/30 shadow-lg group-hover:scale-105 transition-transform">
                     {/* Placeholder for real images once synced */}
                     <div className="absolute inset-0 bg-gradient-to-br from-[#ff00ff]/20 to-[#00f0ff]/20 animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-syncopate font-bold uppercase tracking-tighter">{p.name}</h4>
                      <CheckCircle2 size={14} className="text-green-500" />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{p.domain || 'Node Sycned'}</p>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-black/40 rounded-md text-[7px] font-black text-[#ffea00] uppercase">1 Ad</span>
                      <span className="px-2 py-0.5 bg-black/40 rounded-md text-[7px] font-black text-[#00f0ff] uppercase">3 Vault</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* QUICK ACTIONS */}
          <div className="p-8 bg-gradient-to-br from-[#ff00ff]/5 to-[#00f0ff]/5 border border-white/5 rounded-[2.5rem] space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Reference Engine</h3>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Paste Reference Image URL..." 
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-[10px] font-mono outline-none focus:border-[#ff00ff] transition-all"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
            <p className="text-[8px] text-white/20 uppercase font-black tracking-widest leading-relaxed">
              Injecting a reference URL forces the Vision Engine to base all biometric data on the target source.
            </p>
          </div>
        </div>

      </main>

      {/* FOOTER STATS */}
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-black/80 backdrop-blur-md border-t border-white/5 z-50">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] text-white/20">
          <div className="flex gap-8">
            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-green-500" /> API: 200 OK</span>
            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[#ff00ff]" /> Grok-Motion: READY</span>
            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[#00f0ff]" /> Gemini-Vision: ONLINE</span>
          </div>
          <div className="flex gap-8">
             <span>Syndicate Cluster v21.1</span>
             <span className="text-[#ffea00]">Locked & Loaded</span>
          </div>
        </div>
      </footer>
    </div>
  );
}



