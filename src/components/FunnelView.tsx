'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, ArrowRight, Zap, Shield, Sparkles, 
  User, Search, Heart, MessageSquare, Loader2, CreditCard, 
  Terminal, Activity, ShieldAlert, Lock, Mic, HeartPulse,
  Send, Check, Mic2, Activity as Waveform, ShoppingBag
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { initialProfiles, proxyImg } from '@/lib/profiles';
import TopUpDrawer from './economy/TopUpDrawer';

/**
 * 🌪️ THE GASP NEURAL FUNNEL v4.7 (ASSET PURGE)
 * Forced R2 Refresh | PROMO Ingress | No Placeholders.
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
  
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState('04:54');
  const [activeUsers] = useState(14);
  const [fomoMsg, setFomoMsg] = useState('');
  
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 🛡️ AD-AWARE INGRESS
  const profileIdFromUrl = searchParams.get('profile') || 'veronica_medellin';
  
  // 📸 VERIFIED R2 PROMO ASSETS (With Cache-Buster)
  const profile = {
    name: 'VERONICA',
    image: '/Promo/PromoPic1.png',
    city: 'MEDELLÍN',
    id: 'veronica_medellin'
  };

  const galleryImages = [
    '/Promo/PromoPic1.png',
    '/Promo/PromoPic2.webp'
  ];

  // 📈 ATTRIBUTION & IDENTITY 
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const attribution = {
      source: urlParams.get('utm_source') || urlParams.get('source') || document.referrer || 'Direct',
      campaign: urlParams.get('utm_campaign') || 'Organic',
      creative: urlParams.get('utm_content') || 'None'
    };
    localStorage.setItem('gasp_attribution', JSON.stringify(attribution));

    if (!localStorage.getItem('gasp_guest_id')) {
      const newId = 'GUEST_' + Math.random().toString(36).substring(2, 12).toUpperCase();
      localStorage.setItem('gasp_guest_id', newId);
    }
    
    setIsLoaded(true);
  }, []);

  // 📂 VAULT INGRESS: Fetch real items from database (Universal Sourcing)
  useEffect(() => {
    const fetchVault = async () => {
      setLoadingVault(true);
      try {
        const pid = profileIdFromUrl === 'veronica_medellin' ? 'veronica-medellin-locked' : profileIdFromUrl;
        const res = await fetch(`/api/vault/teasers?personaId=${pid}&userId=${localStorage.getItem('gasp_guest_id')}`);
        const data = await res.json();
        if (data.success) {
          setVaultItems(data.items || []);
        }
      } catch (err) {
        console.error('[Vault Loader Error]:', err);
      } finally {
        setLoadingVault(false);
      }
    };
    fetchVault();
  }, [profileIdFromUrl]);

  // 📈 FOMO ENGINE
  useEffect(() => {
    const names = ['anon_382', 'hunter_x', 'papi_medellin', 'm_sanchez', 'k_jones', 'vip_user_2'];
    const actions = ['unlocked vault 🌶️', 'bought prime access', 'restored connection', 'sent a gift 🎁'];
    const interval = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      setFomoMsg(`${name} ${action}`);
      setTimeout(() => setFomoMsg(''), 4000);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        const [m, s] = prev.split(':').map(Number);
        let total = m * 60 + s - 1;
        if (total < 0) return '00:00';
        const nm = Math.floor(total / 60).toString().padStart(2, '0');
        const ns = (total % 60).toString().padStart(2, '0');
        return `${nm}:${ns}`;
      });
    }, 1000);

    const logs = ["> establishing neural link...", "> bypass active.", "> identity confirmed."];
    let lIdx = 0;
    const lInt = setInterval(() => {
      if (lIdx < logs.length) setTerminalLogs(prev => [...prev, logs[lIdx++]]);
      else { if (currentStepIdx === 0) setCurrentStepIdx(1); }
    }, 250);
    return () => { clearInterval(timerInterval); clearInterval(lInt); };
  }, [currentStepIdx]);

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

    const userMsg = { id: Date.now().toString(), role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    const gid = localStorage.getItem('gasp_guest_id');

    (async () => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            userId: gid,
            personaId: profileIdFromUrl === 'veronica_medellin' ? 'veronica-medellin-locked' : profileIdFromUrl,
            isFunnel: true,
            source: 'traffic_stars_funnel'
          }),
        });

        if (res.status === 402) {
          setCurrentStepIdx(2);
          setIsTyping(false);
          return;
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('0:')) {
                try {
                  const text = JSON.parse(line.substring(2));
                  fullText += text;
                } catch (e) {}
              }
            }
          }
          if (fullText) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: fullText }]);
          }
        }
      } catch (err) {
        console.error('[Funnel neural error]:', err);
      } finally {
        setIsTyping(false);
        if (messages.length >= 2) {
          setTimeout(() => setCurrentStepIdx(2), 3500);
        }
      }
    })();
  };

  if (!isLoaded) return null;

  return (
    <div className="fixed inset-0 bg-black text-white selection:bg-[#ff00ff]/30 font-outfit overflow-hidden flex flex-col uppercase tracking-tighter">
      
      {/* 📹 BACKGROUND DEPTH */}
      <div className="absolute inset-0 z-0 opacity-40">
        <video autoPlay muted loop playsInline className={`w-full h-full object-cover transition-all duration-[3000ms] ${currentStepIdx === 0 ? 'blur-3xl scale-125' : 'blur-sm'}`} poster={profile.image}>
          <source src="/Promo/Veronica.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      {/* 🔴 SOVEREIGN HEADER */}
      <div className="relative z-[110] bg-black/80 backdrop-blur-xl px-6 pt-10 pb-4 flex flex-col gap-6">
         <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0 text-left">
               <span className="text-[9px] font-black text-white/40 tracking-[0.2em] leading-none">NEURAL LINK ACTIVE</span>
               <span className="text-2xl font-black text-[#ffea00] leading-none mt-1">{timeLeft}</span>
            </div>
            
            <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-black text-white tracking-widest leading-none">14 Online</span>
            </div>

            <div className="text-right">
               <span className="text-[9px] font-black text-[#ff00ff] tracking-[0.2em] leading-none text-right block">SYNDICATE</span>
               <div className="text-[9px] font-black text-[#ff00ff] tracking-[0.2em] leading-none text-right">MASTER TERMINAL</div>
            </div>
         </div>

         <div className="flex items-center justify-between">
            <div className="flex items-center gap-5 text-left">
               <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-[#ff00ff] p-1 shadow-[0_0_20px_rgba(255,0,255,0.4)]">
                     <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                        <img 
                          src={profile.image} 
                          className="w-full h-full object-cover" 
                          alt={profile.name} 
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                     </div>
                  </div>
                  <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-black border border-white/20 flex items-center justify-center text-[8px] font-bold text-white/40 shadow-xl">V</div>
               </div>
               
               <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                     <h2 className="text-2xl font-black text-white tracking-tighter leading-none">{profile.name}</h2>
                     <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                  </div>
                  <span className="text-[10px] font-black text-white/40 tracking-[0.3em] leading-none">{profile.city || 'MEDELLÍN'}</span>
               </div>
            </div>

            <div className="flex items-center gap-4 text-white/40">
               <Mic2 size={20} />
               <Waveform size={20} />
            </div>
         </div>

         <div className="flex items-center gap-8 mt-2 border-b border-white/5">
            <button 
              onClick={() => setActiveTab('NEURAL_LINK')}
              className={`pb-3 text-[11px] font-black tracking-[0.2em] transition-all relative ${activeTab === 'NEURAL_LINK' ? 'text-white' : 'text-white/30'}`}
            >
               NEURAL LINK
               {activeTab === 'NEURAL_LINK' && (
                 <motion.div layoutId="tab-active" className="absolute bottom-[-1.5px] left-0 right-0 h-[2.5px] bg-[#ff00ff] shadow-[0_0_10px_#ff00ff]" />
               )}
            </button>
            <button 
              onClick={() => setActiveTab('ARCHIVE')}
              className={`pb-3 text-[11px] font-black tracking-[0.2em] transition-all relative ${activeTab === 'ARCHIVE' ? 'text-white' : 'text-white/30 italic'}`}
            >
              ARCHIVE
              {activeTab === 'ARCHIVE' && (
                <motion.div layoutId="tab-active" className="absolute bottom-[-1.5px] left-0 right-0 h-[2.5px] bg-[#ff00ff] shadow-[0_0_10px_#ff00ff]" />
              )}
            </button>
         </div>
      </div>

      {/* 🌪️ MAIN TERMINAL STACK */}
      <div className="relative flex-1 flex flex-col overflow-hidden bg-transparent">
        <AnimatePresence mode="wait">
          
          {currentStepIdx === 0 && (
            <motion.div key="init" className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 bg-black">
               <Loader2 className="text-[#ff00ff] animate-spin" size={40} />
               <div className="font-mono text-[9px] text-white/20 space-y-1">
                  {terminalLogs.map((log, i) => <div key={i}>{log}</div>)}
               </div>
            </motion.div>
          )}

           {currentStepIdx === 1 && (
            <motion.div key="main-content" className="flex-1 flex flex-col overflow-hidden">
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar pb-32">
                
                {activeTab === 'NEURAL_LINK' ? (
                  <div className="space-y-8">
                    {/* 📸 HERO GALLERY PREVIEW */}
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                       {galleryImages.map((url, i) => (
                          <div key={i} className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative bg-white/5">
                             <img 
                               src={url} 
                               className="w-full h-full object-cover" 
                               alt="VERONICA" 
                               referrerPolicy="no-referrer"
                               crossOrigin="anonymous"
                               onError={(e) => {
                                  if (url.includes('PromoPic2')) {
                                    (e.target as HTMLImageElement).src = galleryImages[0];
                                  }
                               }}
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          </div>
                       ))}
                    </div>

                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] px-6 py-5 rounded-[1.8rem] text-[15px] normal-case tracking-normal leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-[#ff00ff] text-white font-bold italic rounded-tr-none shadow-[0_15px_30px_rgba(255,0,255,0.3)]' 
                            : 'bg-[#151515]/90 backdrop-blur-md text-white border border-white/10 rounded-tl-none font-medium text-white/90'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                       <div className="flex justify-start">
                          <div className="bg-[#151515]/90 backdrop-blur-md px-6 py-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                             <div className="w-1.5 h-1.5 bg-[#ff00ff] rounded-full animate-bounce" />
                             <div className="w-1.5 h-1.5 bg-[#ff00ff] rounded-full animate-bounce [animation-delay:0.2s]" />
                             <div className="w-1.5 h-1.5 bg-[#ff00ff] rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                       </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in duration-700">
                    <div className="flex flex-col gap-2">
                       <h2 className="text-xl font-black italic tracking-tighter text-white">UNCENSORED ARCHIVE</h2>
                       <p className="text-[9px] font-black text-white/30 tracking-[0.3em]">SECURE VAULT // VERONICA-MEDELLIN-LOCKED</p>
                    </div>

                    {loadingVault ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="text-[#ff00ff] animate-spin" size={32} />
                        <span className="text-[10px] font-black tracking-widest text-[#ff00ff]">DECRYPTING...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {vaultItems
                          .filter(item => item.is_vault && !item.caption?.includes('DELETED'))
                          .map((item, idx) => (
                          <div key={item.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 bg-zinc-900 shadow-2xl group">
                            <img 
                              src={item.content_url} 
                              className="absolute inset-0 w-full h-full object-cover transition-all duration-700 blur-3xl scale-110 opacity-50" 
                              alt="Vault Content" 
                            />
                            
                            {/* 🔒 MASTER TERMINAL LOCK (Synced with ChatDrawer) */}
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 gap-4 bg-black/60 backdrop-blur-sm">
                               <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-2">
                                  <Lock size={20} />
                               </div>
                               
                               <div className="w-full space-y-3">
                                  <button 
                                    onClick={() => setCurrentStepIdx(2)}
                                    className="w-full py-3 bg-white text-black text-[10px] font-black uppercase rounded-xl hover:bg-[#ffea00] transition-all shadow-[0_10px_30px_rgba(255,255,255,0.15)] active:scale-95"
                                  >
                                     UNLOCK VAULT
                                  </button>
                                  <div className="text-center">
                                     <span className="text-[7px] font-black text-white/20 tracking-[0.4em] uppercase">RESTRICTED_NODE_{idx + 1}</span>
                                  </div>
                               </div>
                            </div>

                            {/* SCANLINE OVERLAY */}
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col items-center text-center gap-4">
                        <Sparkles className="text-[#ffea00]" size={24} />
                        <div className="space-y-1">
                           <h3 className="text-sm font-black italic tracking-tight">FULL ACCESS EXPIRES IN {timeLeft}</h3>
                           <p className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-relaxed">Top up your neural balance to unlock the full archive.</p>
                        </div>
                        <button onClick={() => setCurrentStepIdx(2)} className="w-full py-4 bg-[#ff00ff] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                           UPGRADE SUBSCRIPTION
                        </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-black border-t border-white/5 relative z-20">
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-4">
                  <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your reply to Veronica..."
                    className="flex-1 bg-[#111] border border-white/20 rounded-2xl px-6 py-5 text-[15px] normal-case tracking-normal focus:outline-none focus:border-[#ff00ff]/50 transition-all font-medium shadow-inner"
                  />
                  <button type="submit" className="w-14 h-14 bg-[#ff00ff] rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,0,255,0.4)] active:scale-95 transition-all outline outline-2 outline-white/10">
                    <Send size={24} className="rotate-[-45deg] translate-x-0.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {currentStepIdx === 2 && (
             <motion.div 
               key="offer"
               initial={{ opacity: 0, scale: 1.05 }}
               animate={{ opacity: 1, scale: 1 }}
               className="absolute inset-0 bg-black flex flex-col overflow-y-auto no-scrollbar pt-10 pb-40 space-y-10"
             >
                <div className="px-6 space-y-8">
                   <div className="text-center space-y-3">
                      <h2 className="text-5xl font-black italic tracking-tighter text-white leading-none">SESSION <span className="text-[#ff00ff] underline decoration-[6px]">EXPIRED</span></h2>
                      <div className="flex flex-col items-center gap-2">
                        <div className="px-3 py-1 bg-[#ffea00]/10 border border-[#ffea00]/30 rounded-full flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-[#ffea00] rounded-full animate-pulse shadow-[0_0_8px_rgba(255,234,0,0.8)]" />
                           <span className="text-[10px] font-black text-[#ffea00] tracking-widest leading-none">GASP NEURAL ACTIVE</span>
                        </div>
                        <p className="text-[11px] text-white/40 tracking-[0.2em] font-black italic">RESET UPLINK TO UNLOCK 100+ MODELS</p>
                      </div>
                   </div>

                   {/* 📸 FULL VERTICAL SYNDICATE FEED */}
                   <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between px-2">
                         <span className="text-[10px] font-black text-white/40 tracking-widest leading-none">NETWORK ACCESS MODULES</span>
                         <span className="text-[10px] font-black text-[#ffea00] tracking-widest leading-none shadow-md">{fomoMsg || 'WAITING...'}</span>
                      </div>
                      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 relative -left-6 w-screen px-6">
                         {[
                           { name: 'MOORE', img: 'https://asset.gasp.fun/personas/officer%20moore-9bdddf/hero_1.webp', tag: 'SECURITY' },
                           { name: 'NAYELI', img: 'https://asset.gasp.fun/personas/nayeli-79b5a9/hero_1.webp', tag: 'EXCLUSIVE' },
                           { name: 'MIKA', img: 'https://asset.gasp.fun/personas/mika-e29e80/hero_1.webp', tag: 'ELITE' },
                           { name: 'JASMINE', img: 'https://asset.gasp.fun/personas/jasmine-f04846/hero_1.webp', tag: 'INTIMATE' }
                         ].map((p, i) => (
                           <div key={i} className="relative w-32 h-44 rounded-[1.5rem] overflow-hidden group shadow-2xl border border-white/10 shrink-0">
                              <img 
                                src={p.img} 
                                className="w-full h-full object-cover shadow-inner" 
                                alt={p.name} 
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 shadow-inner" />
                              <div className="absolute bottom-3 left-3 text-left">
                                 <div className="text-[6px] font-black text-[#00f0ff] tracking-widest leading-none mb-1">{p.tag}</div>
                                 <div className="text-[11px] font-black text-white tracking-tighter leading-none">{p.name}</div>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* 💎 PRICING PROTOCOL */}
                   <div className="space-y-4">
                      {[
                        { id: 'tier_starter', label: 'BASIC PACK', price: 4.99, credits: '5,000', bonus: '5,000' },
                        { id: 'tier_session', label: 'PRIME ACCESS', price: 24.99, credits: '30,000', bonus: '30,000', popular: true },
                        { id: 'tier_whale', label: 'ELITE IDENTITY', price: 99.99, credits: '120,000', bonus: '120,000' },
                      ].map(pkg => (
                        <button 
                          key={pkg.id} 
                          onClick={() => setSelectedPkgId(pkg.id)}
                          className={`w-full p-6 py-8 rounded-[2.5rem] border flex items-center justify-between transition-all ${selectedPkgId === pkg.id ? 'bg-[#ff00ff]/10 border-[#ff00ff] shadow-[0_0_50px_rgba(255,0,255,0.25)]' : 'bg-white/5 border-white/10'}`}
                        >
                           <div className="text-left space-y-1">
                              <span className="text-[10px] font-black tracking-widest text-[#ff00ff]">{pkg.label}</span>
                              <div className="text-3xl font-black italic leading-none text-white">{pkg.credits} CREDITS</div>
                              <div className="flex items-center gap-2 mt-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
                                 <span className="text-[10px] font-black text-[#00f0ff] tracking-widest leading-none">+{pkg.bonus} $GASPai Match</span>
                              </div>
                              <div className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em] mt-1 italic leading-none">🌶️ UNLOCKS PRIVATE VAULT</div>
                           </div>
                           <div className="text-right flex flex-col items-end gap-2">
                              <span className="text-2xl font-black italic text-white shadow-black leading-none">${pkg.price}</span>
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${selectedPkgId === pkg.id ? 'border-[#ff00ff] bg-[#ff00ff]' : 'border-white/20'}`}>
                                 {selectedPkgId === pkg.id && <Check size={18} className="text-white" />}
                              </div>
                           </div>
                        </button>
                      ))}
                   </div>
                </div>

                {/* 🚀 STICKY CTA */}
                <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/95 to-transparent z-[200] pt-12">
                   <div className="flex flex-col items-center gap-5">
                      <div className="flex items-center justify-center gap-2 opacity-30 grayscale">
                         <Shield size={14} className="text-[#00f0ff]" />
                         <span className="text-[9px] font-black tracking-[0.4em]">SYNDICATE CRYPTO-GATE ACTIVE</span>
                      </div>
                      <button onClick={() => setIsTopUpOpen(true)} className="w-full p-6 bg-[#ff00ff] rounded-[2.6rem] text-[18px] font-black uppercase tracking-[0.3em] shadow-[0_25px_70px_rgba(255,0,255,0.5)] active:scale-95 transition-all outline outline-4 outline-white/10 group flex items-center justify-center gap-4">
                         <span>SECURE CHECKOUT</span>
                         <ArrowRight size={26} className="group-hover:translate-x-2 transition-transform" />
                      </button>
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
