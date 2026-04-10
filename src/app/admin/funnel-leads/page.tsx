'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Users, MessageSquare, ChevronRight, Search, Zap, Shield, Eye } from 'lucide-react';

export default function FunnelLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [authKey, setAuthKey] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/admin/funnel-leads', {
        headers: { 'x-admin-key': authKey }
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
        setIsAuthorized(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchTranscript = async (id: string) => {
    setLoadingTranscript(true);
    try {
      const res = await fetch(`/api/admin/funnel-leads/${id}`, {
        headers: { 'x-admin-key': authKey }
      });
      const data = await res.json();
      if (data.success) {
        setTranscript(data.transcript);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTranscript(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      const interval = setInterval(fetchLeads, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthorized, authKey]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-8 rounded-[2rem] border border-white/10 backdrop-blur-xl">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-[#ff00ff]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="text-[#ff00ff]" size={32} />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Syndicate Intercept</h1>
            <p className="text-white/40 text-sm">Enter Master Override Key to access live leads.</p>
          </div>
          <div className="space-y-4">
            <input 
              type="password"
              placeholder="ADMIN_API_KEY"
              value={authKey}
              onChange={(e) => setAuthKey(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white font-mono placeholder:text-white/10 focus:border-[#ff00ff] focus:outline-none transition-all"
            />
            <button 
              onClick={fetchLeads}
              className="w-full bg-white text-black font-black uppercase py-4 rounded-xl hover:bg-[#ff00ff] hover:text-white transition-all tracking-widest"
            >
              Initialize Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-3rem)]">
        
        {/* 📟 LEAD STREAM */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Terminal size={20} className="text-green-500" />
              </div>
              <div>
                <h1 className="text-lg font-black uppercase tracking-tight">Active Ingress</h1>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-green-500/60 font-medium uppercase tracking-widest">Live Stream Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-zinc-900/30 rounded-[2rem] border border-white/5 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 bg-black/20">
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                  placeholder="Filter by Guest ID..." 
                  className="w-full bg-black/40 border border-white/5 rounded-full py-2 pl-10 pr-4 text-xs focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {leads.map((lead) => (
                <button
                  key={lead.user_id}
                  onClick={() => {
                    setSelectedLead(lead);
                    fetchTranscript(lead.user_id);
                  }}
                  className={`w-full p-5 rounded-2xl border transition-all text-left group relative overflow-hidden ${selectedLead?.user_id === lead.user_id ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono font-bold text-white/40 tracking-tighter">{lead.user_id}</span>
                    <span className="text-[9px] font-black uppercase text-[#ffea00] bg-[#ffea00]/10 px-2 py-0.5 rounded italic">From: {lead.attribution?.source || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-sm font-black uppercase tracking-tight">{lead.persona_name}</span>
                  </div>
                  <p className="text-xs text-white/50 line-clamp-1 italic">"{lead.last_message}"</p>
                  
                  <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={16} className="text-green-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 🛰️ TRANSCRIPT INTERCEPT */}
        <div className="lg:col-span-8 bg-zinc-900/20 rounded-[3rem] border border-white/5 overflow-hidden flex flex-col h-full">
          {selectedLead ? (
            <>
              <div className="p-8 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center">
                    <Eye size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Signal: {selectedLead.user_id}</h2>
                    <p className="text-xs text-white/40">Intercepting conversation with {selectedLead.persona_name}</p>
                  </div>
                </div>
                <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-[#ffea00] bg-[#ffea00]/10 px-4 py-2 rounded-full ring-1 ring-[#ffea00]/30 animate-pulse">
                  <Zap size={12} fill="#ffea00" />
                  Live Intercept Active
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.05),transparent)]">
                {loadingTranscript ? (
                   <div className="h-full flex items-center justify-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Decrypting Signal...</span>
                      </div>
                   </div>
                ) : (
                  transcript.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] space-y-2 ${msg.role === 'assistant' ? 'items-start' : 'items-end flex flex-col'}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20 px-2">
                           {msg.role === 'assistant' ? selectedLead.persona_name : 'Guest'}
                        </span>
                        <div className={`p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'assistant' ? 'bg-zinc-900/80 border border-white/10 rounded-tl-none' : 'bg-green-500 text-black font-medium rounded-tr-none'}`}>
                          {msg.content}
                        </div>
                        <span className="text-[8px] font-mono text-white/10 px-2">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center p-12 text-center">
              <div className="max-w-md space-y-4">
                 <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                    <MessageSquare size={32} className="text-white/20" />
                 </div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter">Standby for Signal</h2>
                 <p className="text-sm text-white/30">Select a Guest ID from the ingress stream to begin real-time intercept and decryption.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
