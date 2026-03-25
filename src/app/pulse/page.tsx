'use client';

import { useState, useEffect } from 'react';
import { Activity, Brain, Database, Speaker, Terminal, Zap } from 'lucide-react';

// STYLED FOR GASP PULSE (HIGH STAKES DIAGNOSTICS)
export default function PulseCheckDashboard() {
  const [nodes, setNodes] = useState([
    { id: 'BRAIN_SYNC', label: 'Neural Connection (Gemini)', status: 'testing', icon: Brain },
    { id: 'GASP_VAULT', label: 'Identity Substrate (Supabase)', status: 'testing', icon: Database },
    { id: 'VOX_CHANNEL', label: 'Atmospheric Vocal Hub (ElevenLabs)', status: 'testing', icon: Speaker },
    { id: 'NEXUS_DEPLOY', label: 'Circuit Resonance (Railway)', status: 'testing', icon: Activity },
  ]);

  useEffect(() => {
    async function checkNodes() {
      // 1. Check Brain (Simple fetch to /api/chat/status if exists, or just simulate)
      // Check GASP_VAULT
      try {
        const res = await fetch('/api/pulse');
        const data = await res.json();
        
        setNodes(prev => prev.map(n => {
           if (n.id === 'GASP_VAULT') return { ...n, status: data.vault ? 'online' : 'offline' };
           if (n.id === 'BRAIN_SYNC') return { ...n, status: data.brain ? 'online' : 'offline' };
           if (n.id === 'VOX_CHANNEL') return { ...n, status: data.vox ? 'online' : 'offline' };
           if (n.id === 'NEXUS_DEPLOY') return { ...n, status: 'online' }; // We are here
           return n;
        }));
      } catch (e) {
        setNodes(prev => prev.map(n => ({ ...n, status: 'offline' })));
      }
    }
    checkNodes();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-syncopate p-12 md:p-32 flex flex-col items-center">
       <div className="max-w-4xl w-full">
          <div className="flex items-center gap-6 mb-16 animate-pulse">
             <div className="w-12 h-12 rounded-full bg-[#ff00ff] shadow-[0_0_30px_#ff00ff]" />
             <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">System Pulse Check <span className="text-white/20">v2.1</span></h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {nodes.map((node) => (
                <div key={node.id} className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col gap-6 relative overflow-hidden group hover:border-[#ff00ff]/40 transition-all">
                   <div className="flex items-center justify-between relative z-10">
                      <node.icon className={`text-white/20 group-hover:text-white transition-all`} size={48} />
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                         node.status === 'online' ? 'bg-[#00f0ff] text-black shadow-[0_0_20px_#00f0ff]' 
                         : node.status === 'testing' ? 'bg-yellow-500 text-black animate-pulse'
                         : 'bg-red-500 text-white shadow-[0_0_20px_#ef4444]'
                      }`}>
                         {node.status}
                      </div>
                   </div>
                   <div className="relative z-10">
                      <h4 className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black">{node.id}</h4>
                      <p className="text-xl md:text-2xl font-black uppercase mt-1 tracking-tight">{node.label}</p>
                   </div>
                   <div className={`absolute bottom-0 left-0 h-1 bg-[#ff00ff] shadow-[0_0_10px_#ff00ff] transition-all duration-1000 ${node.status === 'online' ? 'w-full' : 'w-0'}`} />
                </div>
             ))}
          </div>

          <div className="mt-20 p-8 border border-white/5 rounded-[2rem] bg-white/[0.01] flex items-center justify-between opacity-40">
             <div className="flex items-center gap-4 uppercase font-black tracking-widest text-[10px]">
                <Terminal size={16} />
                <span>Diagnostics Session 0X22-PULSE</span>
             </div>
             <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-75" />
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-150" />
             </div>
          </div>
       </div>
    </div>
  );
}



