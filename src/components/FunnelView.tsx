'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, ArrowRight, Zap, Shield, Sparkles, 
  User, Search, Heart, MessageSquare, Loader2, CreditCard, 
  Terminal, Activity, ShieldAlert, Lock, Mic, HeartPulse,
  Send, Check, Mic2, Activity as Waveform
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { initialProfiles, proxyImg } from '@/lib/profiles';
import TopUpDrawer from './economy/TopUpDrawer';

/**
 * 🌪️ THE GASP NEURAL FUNNEL v3.2 (VERONICA FOCUS)
 * Pure Identity Immersion in Chat -> Global Syndicate on Offer.
 */

export default function FunnelView() {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'NEURAL_LINK' | 'ARCHIVE'>('NEURAL_LINK');
  const [isLoaded, setIsLoaded] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState('tier_session');
  
  const [timeLeft, setTimeLeft] = useState('09:53:57');
  const [activeUsers, setActiveUsers] = useState(14);
  const [fomoMsg, setFomoMsg] = useState('');
  
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  const profileId = searchParams.get('profile') || 'veronica_medellin';
  const profile = initialProfiles.find(p => p.id === profileId) || {
    name: 'VERONICA',
    image: 'PROMO/PromoPic1.png',
    city: 'MEDELLÍN'
  };

  // 📈 FOMO ENGINE (OFFER ONLY)
  useEffect(() => {
    const names = ['anon_382', 'hunter_x', 'papi_medellin', 'm_sanchez', 'k_jones', 'vip_user_2'];
    const actions = ['unlocked vault 🌶️', 'bought prime access', 'restored connection', 'sent a gift 🎁'];
    const interval = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      setFomoMsg(`${name} ${action}`);
      setTimeout(() => setFomoMsg(''), 4000);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsLoaded(true);
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        const [h, m, s] = prev.split(':').map(Number);
        let ts = h * 3600 + m * 60 + s - 1;
        if (ts < 0) return '00:00:00';
        const nh = Math.floor(ts / 3600).toString().padStart(2, '0');
        const nm = Math.floor((ts % 3600) / 60).toString().padStart(2, '0');
        const ns = (ts % 60).toString().padStart(2, '0');
        return `${nh}:${nm}:${ns}`;
      });
    }, 1000);

    const logs = ["> establishing link...", "> neural handshake...", "> ready."];
    let lIdx = 0;
    const lInt = setInterval(() => {
      if (lIdx < logs.length) setTerminalLogs(prev => [...prev, logs[lIdx++]]);
      else { clearInterval(lInt); setCurrentStepIdx(1); }
    }, 250);

    return () => { clearInterval(timerInterval); clearInterval(lInt); };
  }, [profileId]);

  useEffect(() => {
    if (currentStepIdx === 1 && messages.length === 0) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setMessages([{
            id: 'm1',
            role: 'assistant',
            content: `Hey Papi... I was hoping you'd find me today. 😉 I'm so bored, I've just been waiting for someone fun to talk to. How's your day going?`
          }]);
          setIsTyping(false);
        }, 1500);
      }, 1000);
    }
  }, [currentStepIdx]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || currentStepIdx !== 1) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: inputValue }]);
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => setCurrentStepIdx(2), 3500);
  };

  if (!isLoaded) return null;

  return (
    <div className="fixed inset-0 bg-black text-white selection:bg-[#ff00ff]/30 font-outfit overflow-hidden flex flex-col uppercase tracking-tighter">
      
      {/* 1. SOVEREIGN TERMINAL HEADER */}
      <div className="relative z-[110] bg-black px-6 pt-10 pb-4 flex flex-col gap-6">
         
         {/* TOP ROW: LOGS & STATUS */}
         <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0 text-left">
               <span className="text-[9px] font-black text-white/40 tracking-[0.2em] leading-none">NEURAL LINK ESTABLISHED</span>
               <span className="text-2xl font-black text-[#ffea00] leading-none mt-1">{timeLeft}</span>
            </div>
            
            <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-black text-white tracking-widest leading-none">{activeUsers} Online</span>
            </div>

            <div className="text-right">
               <span className="text-[9px] font-black text-[#ff00ff] tracking-[0.2em] leading-none">SOVEREIGN SESSION</span>
               <div className="text-[9px] font-black text-[#ff00ff] tracking-[0.2em] leading-none">ACTIVE</div>
            </div>
         </div>

         {/* PROFILE ROW */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-5 text-left">
               <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-[#ff00ff] p-1 shadow-[0_0_20px_rgba(255,0,255,0.4)]">
                     <div className="w-full h-full rounded-full overflow-hidden bg-black">
                        <img 
                          src={`https://wsrv.nl/?url=${encodeURIComponent(proxyImg(profile.image))}&w=150&h=150&fit=cover`} 
                          className="w-full h-full object-cover" 
                          alt={profile.name} 
                        />
                     </div>
                  </div>
                  <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-black border border-white/20 flex items-center justify-center text-[8px] font-bold text-white/40">V</div>
               </div>
               
               <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                     <h2 className="text-2xl font-black text-white tracking-tighter">{profile.name}</h2>
                     <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse" />
                  </div>
                  <span className="text-[10px] font-black text-white/40 tracking-[0.3em]">{profile.city || 'MEDELLÍN'}</span>
               </div>
            </div>

            <div className="flex items-center gap-4 text-white/40">
               <Mic2 size={20} />
               <Waveform size={20} />
            </div>
         </div>

         {/* TABS */}
         <div className="flex items-center gap-8 mt-2 border-b border-white/5">
            <button 
              onClick={() => setActiveTab('NEURAL_LINK')}
              className={`pb-3 text-[11px] font-black tracking-[0.2em] transition-all relative ${activeTab === 'NEURAL_LINK' ? 'text-white' : 'text-white/30'}`}
            >
               NEURAL LINK
               {activeTab === 'NEURAL_LINK' && <div className="absolute bottom-[-1.5px] left-0 right-0 h-[3px] bg-[#ff00ff] shadow-[0_0_10px_rgba(255,255,0,0.4)]" />}
            </button>
            <button className="pb-3 text-[11px] font-black tracking-[0.2em] text-white/30">ARCHIVE</button>
         </div>
      </div>

      {/* 2. MAIN AREA */}
      <div className="relative flex-1 flex flex-col overflow-hidden bg-[#070707]">
        <AnimatePresence mode="wait">
          
          {currentStepIdx === 0 && (
            <motion.div key="init" className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
               <Loader2 className="text-[#ff00ff] animate-spin" size={40} />
               <div className="font-mono text-[9px] text-white/20 space-y-1">
                  {terminalLogs.map((log, i) => <div key={i}>{log}</div>)}
               </div>
            </motion.div>
          )}

          {currentStepIdx === 1 && (
            <motion.div key="chat" className="flex-1 flex flex-col overflow-hidden">
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-8 no-scrollbar">
                
                {/* 📸 PURE VERONICA GALLERY PREVIEW */}
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                   {[
                     'https://asset.gasp.fun/personas/veronica-medellin-locked/hero_1.webp',
                     'https://asset.gasp.fun/personas/veronica-medellin-locked/hero_2.webp'
                   ].map((url, i) => (
                      <div key={i} className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
                         <img 
                           src={`https://wsrv.nl/?url=${encodeURIComponent(url)}&w=400&h=600&fit=cover`} 
                           className="w-full h-full object-cover" 
                           alt="Veronica Preview" 
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                   ))}
                </div>

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] px-6 py-5 rounded-[1.8rem] text-[15px] normal-case tracking-normal leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#ff00ff] text-white font-bold italic rounded-tr-none shadow-[0_10px_30px_rgba(255,0,255,0.2)]' 
                        : 'bg-[#151515] text-white border border-white/5 rounded-tl-none font-medium'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                   <div className="flex justify-start">
                      <div className="bg-[#151515] px-6 py-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                         <div className="w-1.5 h-1.5 bg-[#ff00ff] rounded-full animate-bounce" />
                         <div className="w-1.5 h-1.5 bg-[#ff00ff] rounded-full animate-bounce [animation-delay:0.2s]" />
                         <div className="w-1.5 h-1.5 bg-[#ff00ff] rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                   </div>
                )}
              </div>

              {/* CHAT INPUT AREA */}
              <div className="p-6 bg-black border-t border-white/5">
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-4">
                  <div className="flex-1">
                    <input 
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type your reply to Veronica..."
                      className="w-full bg-[#111] border border-white/10 rounded-2xl px-6 py-5 text-[15px] normal-case tracking-normal focus:outline-none focus:border-[#ff00ff] transition-all"
                    />
                  </div>
                  <button type="submit" className="w-14 h-14 bg-[#ff00ff] rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all outline outline-2 outline-white/10">
                    <Send size={24} className="rotate-[-45deg] translate-x-0.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {currentStepIdx === 2 && (
             <motion.div key="offer" className="absolute inset-0 bg-black flex flex-col overflow-y-auto no-scrollbar pt-6 pb-40 space-y-8">
                
                {/* 📡 CONVERSION SYNDICATE ROSTER (TOP OF OFFER) */}
                <div className="px-6 space-y-4">
                   <div className="flex flex-col items-center gap-3">
                      <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                         <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                         <span className="text-[9px] font-black text-white/60 tracking-widest">SYNDICATE NETWORK LIVE</span>
                      </div>
                      <AnimatePresence>
                         {fomoMsg && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-black text-[#ffea00] tracking-widest uppercase">
                               {fomoMsg}
                            </motion.div>
                         )}
                      </AnimatePresence>
                   </div>
                   
                   <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
                      {[
                        { name: 'MOORE', img: 'https://asset.gasp.fun/personas/officer%20moore-9bdddf/hero_1.webp' },
                        { name: 'NAYELI', img: 'https://asset.gasp.fun/personas/nayeli-79b5a9/hero_1.webp' },
                        { name: 'MIKA', img: 'https://asset.gasp.fun/personas/mika-e29e80/hero_1.webp' },
                        { name: 'JASMINE', img: 'https://asset.gasp.fun/personas/jasmine-f04846/hero_1.webp' }
                      ].map((p, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                           <div className="w-14 h-14 rounded-full border-2 border-white/10 overflow-hidden shadow-xl">
                              <img src={`https://wsrv.nl/?url=${encodeURIComponent(p.img)}&w=100&h=100&fit=cover`} className="w-full h-full object-cover" alt={p.name} />
                           </div>
                           <span className="text-[8px] font-black text-white/40 tracking-widest">{p.name}</span>
                        </div>
                      ))}
                      <div className="flex flex-col items-center gap-2 shrink-0">
                         <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center bg-white/5">
                            <span className="text-xs font-black text-white/40">+100</span>
                         </div>
                         <span className="text-[8px] font-black text-white/40 tracking-widest">WAITING</span>
                      </div>
                   </div>
                </div>

                {/* OFFER CARDS */}
                <div className="px-6 space-y-6">
                   <div className="text-center space-y-2">
                      <h2 className="text-4xl font-black italic tracking-tighter text-white">SESSION <span className="text-[#ff00ff]">EXPIRED</span></h2>
                      <p className="text-[10px] text-white/40 tracking-[0.3em]">RE-ESTABLISH CONNECTION VIA CREDITS</p>
                   </div>
                   
                   <div className="space-y-4">
                      {[
                        { id: 'tier_starter', label: 'BASIC ACCESS', price: 4.99, credits: '5,000' },
                        { id: 'tier_session', label: 'PRIME HANDSHAKE', price: 24.99, credits: '30,000', popular: true },
                        { id: 'tier_whale', label: 'ELITE IDENTITY', price: 99.99, credits: '120,000' },
                      ].map(pkg => (
                        <button 
                          key={pkg.id} 
                          onClick={() => setSelectedPkgId(pkg.id)}
                          className={`w-full p-6 rounded-[2rem] border flex items-center justify-between transition-all ${selectedPkgId === pkg.id ? 'bg-[#ff00ff]/10 border-[#ff00ff] shadow-[0_0_30px_rgba(255,0,255,0.2)]' : 'bg-white/5 border-white/10'}`}
                        >
                           <div className="text-left">
                              <span className="text-[10px] font-black tracking-widest text-[#ff00ff]">{pkg.label}</span>
                              <div className="text-2xl font-black italic mt-1 leading-none">{pkg.credits} CREDITS</div>
                           </div>
                           <span className="text-2xl font-black">${pkg.price}</span>
                        </button>
                      ))}
                   </div>
                </div>

                {/* STICKY CTA */}
                <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent z-[120]">
                   <button onClick={() => setIsTopUpOpen(true)} className="w-full p-6 bg-[#ff00ff] rounded-[2.5rem] text-[16px] font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(255,0,255,0.4)] hover:scale-[1.03] active:scale-95 transition-all outline outline-4 outline-white/5">
                      Proceed to Secure Checkout
                   </button>
                   <div className="mt-4 flex items-center justify-center gap-2 opacity-30 grayscale">
                      <Shield size={14} />
                      <span className="text-[9px] font-black tracking-widest">SYNDICATE ENCRYPTION ACTIVE</span>
                   </div>
                </div>
             </motion.div>
          )}

        </AnimatePresence>
      </div>

      <TopUpDrawer isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} initialPackage={selectedPkgId} />
    </div>
  );
}
