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
  const [roster, setRoster] = useState<any[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState('04:54');
  const [activeUsers] = useState(14);
  const [fomoMsg, setFomoMsg] = useState('');
  
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  const profileIdFromUrl = searchParams.get('profile') || 'veronica_medellin';
  
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

  useEffect(() => {
    const fetchRoster = async () => {
      setLoadingRoster(true);
      try {
        const res = await fetch('/api/rpc/db', {
          method: 'POST',
          body: JSON.stringify({ 
            action: 'query', 
            payload: { 
              query: "SELECT id, name, seed_image_url FROM personas WHERE name IN ('Officer Moore', 'Nayeli', 'Mika', 'Jasmine') ORDER BY CASE name WHEN 'Officer Moore' THEN 1 WHEN 'Nayeli' THEN 2 WHEN 'Mika' THEN 3 WHEN 'Jasmine' THEN 4 END" 
            } 
          })
        });
        const data = await res.json();
        if (data.success && data.data?.rows) {
          setRoster(data.data.rows.map((r: any) => ({
            name: r.name.replace('Officer ', '').toUpperCase(),
            img: r.seed_image_url,
            tag: r.name === 'Officer Moore' ? 'SECURITY' : 'EXCLUSIVE'
          })));
        }
      } catch (err) {
        console.error('[Roster Loader Error]:', err);
      } finally {
        setLoadingRoster(false);
      }
    };
    fetchRoster();
  }, []);

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

    const logs = ["> establishing connection...", "> bypass active.", "> identity confirmed."];
    let lIdx = 0;
    const lInt = setInterval(() => {
      if (lIdx < logs.length) setTerminalLogs(prev => [...prev, logs[lIdx++]]);
      else { if (currentStepIdx === 0) setCurrentStepIdx(1); }
    }, 250);
    return () => { clearInterval(timerInterval); clearInterval(lInt); };
  }, [currentStepIdx]);

  useEffect(() => {
    const handleSuccess = () => {
      setTimeout(() => {
        setCurrentStepIdx(3);
        setIsTopUpOpen(false);
      }, 800);
    };
    window.addEventListener('gasp_balance_refresh', handleSuccess);
    return () => window.removeEventListener('gasp_balance_refresh', handleSuccess);
  }, []);

  useEffect(() => {
    if (currentStepIdx === 1 && messages.length === 0) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setMessages([{
            id: 'm1',
            role: 'assistant',
            content: `I saw you looking... you probably saw that video of me in the grocery store, didn't you? 😉 I'm just glad you finally found me here. I've been waiting for someone like you to actually say something.`
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
            systemInstruction: `You are VERONICA. The user just arrived from an ad showing you in a grocery store.
            1. Lean into the fact that they "saw you" in that video. Be playful and flattered.
            2. Build a "shared secret" connection. You are glad they found you.
            3. DO NOT ask for their name/age or stall. 
            4. By the 2nd or 3rd message, pivot to sending a "Private Tease" because you want to show them more than what was in that video.
            5. Goal: Drive to the GLITCH cutoff after the tease.`,
            source: 'traffic_stars_funnel'
          }),
        });

        if (res.status === 402 || messages.length >= 3) {
          // 🌩️ THE TEASE & GLITCH SEQUENCE
          setTimeout(() => {
            setMessages(prev => [...prev, { 
              id: 'tease_' + Date.now(), 
              role: 'assistant', 
              content: 'tease_module',
              isTease: true 
            }]);
            
            // ⚡ FINAL HARD CLOSE
            setTimeout(() => {
              setCurrentStepIdx(2);
              setIsTyping(false);
            }, 1800);
          }, 800);
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
      }
    })();
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-black text-white font-outfit overflow-hidden selection:bg-[#ff00ff]/30 flex items-center justify-center">
      
      {/* 📹 BACKGROUND DEPTH */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video autoPlay muted loop playsInline className={`w-full h-full object-cover transition-all duration-[3000ms] ${currentStepIdx === 0 ? 'blur-3xl scale-125' : 'blur-sm'}`} poster={profile.image}>
          <source src="/Promo/Veronica.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80" />
      </div>

      {/* 🛡️ MASTER EXPERIENCE CONTAINER */}
      <main className="relative z-10 w-full max-w-[600px] h-screen md:h-[92dvh] flex flex-col bg-black/60 backdrop-blur-3xl md:rounded-[3rem] md:border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-700 md:my-4">
        
        {/* UPPER STATUS BAR */}
        {currentStepIdx > 0 && currentStepIdx < 3 && (
          <div className="shrink-0 px-8 py-5 flex items-center justify-between border-b border-white/5 bg-black/40 relative z-[110]">
             <div className="flex flex-col text-left">
                <span className="text-[9px] font-black text-white/40 tracking-[0.2em] leading-none uppercase italic">Signal Status</span>
                <span className="text-xl font-black text-[#ffea00] leading-none mt-1">{timeLeft}</span>
             </div>
             
             <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-white tracking-widest leading-none">14 ONLINE</span>
             </div>

             <div className="text-right">
                <span className="text-[9px] font-black text-[#ff00ff] tracking-[0.2em] leading-none text-right block uppercase italic">Syndicate</span>
                <div className="text-[9px] font-black text-[#ff00ff] tracking-[0.2em] leading-none text-right uppercase italic">Terminal</div>
             </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            
            {currentStepIdx === 2 ? (
              <motion.div
                key="glitch-overlay"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 1, 0, 1, 0],
                  x: [0, -10, 10, -5, 0],
                  filter: ["blur(0px)", "blur(20px)", "blur(0px)"]
                }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 z-[500] pointer-events-none bg-[#ff00ff]/10 mix-blend-overlay"
              />
            ) : null}

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
                {/* Profile Header */}
                <div className="px-8 py-6 border-b border-white/5 relative z-20 flex items-center justify-between">
                   <div className="flex items-center gap-5 text-left">
                      <div className="relative">
                         <div className="w-16 h-16 rounded-full border-2 border-[#ff00ff] p-1 shadow-[0_0_20px_rgba(255,0,255,0.4)]">
                            <img src={profile.image} className="w-full h-full object-cover object-top rounded-full" alt={profile.name} />
                         </div>
                         <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-black border border-white/20 flex items-center justify-center text-[8px] font-bold text-white/40 shadow-xl">V</div>
                      </div>
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-white tracking-tighter leading-none">{profile.name}</h2>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                         </div>
                         <span className="text-[10px] font-black text-white/40 tracking-[0.3em] leading-none uppercase">{profile.city}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 text-white/40">
                      <Mic2 size={20} />
                      <Waveform size={20} />
                   </div>
                </div>

                <div className="flex items-center gap-8 px-8 border-b border-white/5">
                   <button onClick={() => setActiveTab('NEURAL_LINK')} className={`pb-3 text-[11px] font-black tracking-[0.2em] transition-all relative ${activeTab === 'NEURAL_LINK' ? 'text-white' : 'text-white/30'}`}>
                      CHAT
                      {activeTab === 'NEURAL_LINK' && <motion.div layoutId="tab-active" className="absolute bottom-[-1px] left-0 right-0 h-[2.5px] bg-[#ff00ff]" />}
                   </button>
                   <button onClick={() => setActiveTab('ARCHIVE')} className={`pb-3 text-[11px] font-black tracking-[0.2em] transition-all relative ${activeTab === 'ARCHIVE' ? 'text-white' : 'text-white/30'}`}>
                      VAULT
                      {activeTab === 'ARCHIVE' && <motion.div layoutId="tab-active" className="absolute bottom-[-1px] left-0 right-0 h-[2.5px] bg-[#ff00ff]" />}
                   </button>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 no-scrollbar pb-32">
                  {activeTab === 'NEURAL_LINK' ? (
                    <div className="space-y-8">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.isTease ? (
                            <div className="relative w-full max-w-[320px] aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-[#ff00ff]/30 shadow-[0_0_50px_rgba(255,0,255,0.2)] bg-black animate-in fade-in zoom-in duration-500">
                               <img 
                                 src="https://asset.gasp.fun/Promo/cucumber_tease.png" 
                                 className="w-full h-full object-cover transition-all duration-[2000ms]" 
                                 alt="Tease" 
                               />
                               <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center p-6 text-center gap-4 group">
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ delay: 1.2, duration: 0.5 }}
                                    className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-4"
                                  >
                                     <div className="w-14 h-14 rounded-full border-2 border-[#ff00ff] border-t-transparent animate-spin" />
                                     <div className="space-y-1">
                                        <div className="text-[12px] font-black text-[#ff00ff] tracking-[0.4em] uppercase">Private Access</div>
                                        <div className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">DECRYPTING_ASSET_069...</div>
                                     </div>
                                  </motion.div>
                               </div>
                               <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent h-1/3 pointer-events-none" />
                            </div>
                          ) : (
                            <div className={`max-w-[90%] px-6 py-5 rounded-[2rem] text-[15px] ${msg.role === 'user' ? 'bg-[#ff00ff] text-white font-bold italic rounded-tr-none shadow-xl' : 'bg-[#151515]/90 border border-white/10 rounded-tl-none font-medium'}`}>
                              {msg.content}
                            </div>
                          )}
                        </div>
                      ))}
                      {isTyping && (
                         <div className="flex justify-start">
                            <div className="bg-[#151515]/90 px-6 py-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                               <div className="w-1.5 h-1.5 bg-[#ff00ff] rounded-full animate-bounce" />
                               <div className="w-1.5 h-1.5 bg-[#ff00ff] rounded-full animate-bounce [animation-delay:0.2s]" />
                               <div className="w-1.5 h-1.5 bg-[#ff00ff] rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                         </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in fade-in duration-700">
                      <h2 className="text-xl font-black italic tracking-tighter text-white">UNCENSORED VAULT</h2>
                      {loadingVault ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="text-[#ff00ff] animate-spin" size={32} /></div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {vaultItems.filter(v => v.is_vault && !v.caption?.includes('DELETED')).map((item, idx) => (
                            <div key={item.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 bg-zinc-900 group shadow-2xl">
                              <img src={item.content_url} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-50" />
                              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 gap-4 bg-black/60 backdrop-blur-sm">
                                 <Lock size={20} className="text-white/40" />
                                 <button onClick={() => setCurrentStepIdx(2)} className="w-full py-4 bg-white text-black text-[10px] font-black uppercase rounded-xl hover:bg-[#ffea00] active:scale-95 transition-all shadow-xl font-syncopate italic">Unlock Vault</button>
                                 <span className="text-[7px] font-black text-white/20 tracking-widest uppercase">NODE_{idx + 1}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-[100]">
                  <form onSubmit={handleSendMessage} className="relative flex items-center gap-4">
                    <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Type reply to Veronica..." className="flex-1 bg-[#111] border border-white/20 rounded-2xl px-6 py-5 text-[15px] focus:outline-none focus:border-[#ff00ff]/50 shadow-inner" />
                    <button type="submit" className="w-14 h-14 bg-[#ff00ff] rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all"><Send size={24} className="rotate-[-45deg]" /></button>
                  </form>
                </div>
              </motion.div>
            )}

            {currentStepIdx === 2 && (
               <motion.div 
                 key="offer" 
                 initial={{ opacity: 0, scale: 1.1 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="flex-1 overflow-y-auto no-scrollbar scroll-smooth"
               >
                  <div className="px-10 py-10 space-y-10 pb-40">
                     <div className="flex flex-col items-center gap-6 pt-6">
                        <div className="relative">
                           <div className="w-20 h-20 rounded-full border-2 border-white/10 p-1 opacity-40 grayscale">
                              <img src={profile.image} className="w-full h-full object-cover object-top rounded-full" alt={profile.name} />
                           </div>
                           <div className="absolute inset-0 flex items-center justify-center">
                              <Lock size={24} className="text-white/20" />
                           </div>
                        </div>
                        <div className="text-center space-y-3">
                           <h2 className="text-6xl font-black italic tracking-tighter text-white leading-none uppercase">Session Expired</h2>
                           <div className="flex flex-col items-center gap-2">
                              <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                                 <span className="text-[11px] font-black text-white/40 tracking-widest uppercase">Identity Protected</span>
                              </div>
                              <p className="text-[12px] text-[#ffea00] tracking-[0.2em] font-black italic uppercase">Re-link with {profile.name} to continue</p>
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between px-2">
                           <span className="text-[10px] font-black text-white/20 tracking-widest uppercase">Top Network Connections</span>
                           <span className="text-[10px] font-black text-[#ffea00] tracking-widest leading-none">{fomoMsg || 'WAITING...'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2.5">
                           {(roster.length > 0 ? roster : [
                             { name: 'MOORE', img: 'https://asset.gasp.fun/personas/officer%20moore-9bdddf/hero_1.webp', tag: 'SECURITY' },
                             { name: 'NAYELI', img: 'https://asset.gasp.fun/personas/nayeli-79b5a9/hero_1.webp', tag: 'EXCLUSIVE' },
                             { name: 'MIKA', img: 'https://asset.gasp.fun/personas/mika-e29e80/hero_1.webp', tag: 'ELITE' },
                             { name: 'JASMINE', img: 'https://asset.gasp.fun/personas/jasmine-f04846/hero_1.webp', tag: 'INTIMATE' }
                           ]).map((p, i) => (
                             <div key={i} className="relative w-[19%] aspect-[3/4.5] rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0 shadow-xl">
                                <img src={p.img} className="w-full h-full object-cover" alt={p.name} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-90 shadow-inner" />
                                <div className="absolute bottom-2.5 left-2.5 text-left">
                                   <div className="text-[5px] font-black text-[#00f0ff] tracking-widest mb-0.5 uppercase leading-none">{p.tag}</div>
                                   <div className="text-[10px] font-black text-white italic tracking-tighter uppercase leading-none">{p.name}</div>
                                </div>
                             </div>
                           ))}
                           <div className="relative w-[19%] aspect-[3/4.5] rounded-2xl overflow-hidden bg-[#ff00ff]/5 border border-[#ff00ff]/30 shrink-0 flex flex-col items-center justify-center gap-1.5 group cursor-pointer active:scale-95 transition-all shadow-2xl">
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
                              <Sparkles size={16} className="text-[#ff00ff] relative z-10" />
                              <div className="relative z-10 text-center">
                                 <div className="text-[13px] font-black text-white leading-none">& 100+</div>
                                 <div className="text-[7px] font-black text-[#ff00ff] tracking-widest uppercase">MORE</div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        {[
                          { id: 'tier_starter', label: 'STARTER PACK', price: 4.99, credits: '5,000', bonus: '5,000', perk: 'Private Chat + Points for Photo Unlocks' },
                          { id: 'tier_session', label: 'SESSIONS PRO', price: 24.99, credits: '30,000', bonus: '30,000', perk: 'Unlock Multiple Spicy Galleries + Full Chat', popular: true },
                          { id: 'tier_whale', label: 'ELITE IDENTITY', price: 99.99, credits: '120,000', bonus: '120,000', perk: 'VIP Priority - Unlock Every Secret Photo' },
                        ].map(pkg => (
                          <button 
                            key={pkg.id} 
                            onClick={() => setSelectedPkgId(pkg.id)} 
                            className={`w-full p-8 rounded-[2.8rem] border flex items-center justify-between transition-all relative overflow-hidden group ${selectedPkgId === pkg.id ? 'bg-[#ff00ff]/10 border-[#ff00ff] shadow-2xl' : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'}`}
                          >
                             {pkg.popular && <div className="absolute top-0 right-0 px-6 py-2 bg-[#ff00ff] text-white text-[9px] font-black uppercase tracking-widest rounded-bl-2xl font-syncopate italic">Selected</div>}
                             <div className="text-left space-y-1">
                                <span className="text-[11px] font-black text-[#ff00ff] uppercase tracking-widest leading-none">{pkg.label}</span>
                                <div className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none my-1">{pkg.credits} Credits</div>
                                <div className="flex items-center gap-2 py-1">
                                   <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
                                   <span className="text-[11px] font-black text-[#00f0ff] uppercase tracking-widest">+ {pkg.bonus} $GASPai LOYALTY POINTS</span>
                                </div>
                                <div className="text-[10px] font-black text-[#ffea00] uppercase tracking-widest py-1 italic">🌶️ {pkg.perk}</div>
                             </div>
                             <div className="text-right flex flex-col items-end gap-3">
                                <span className="text-3xl font-black italic text-white leading-none">${pkg.price}</span>
                                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${selectedPkgId === pkg.id ? 'border-[#ff00ff] bg-[#ff00ff] shadow-[0_0_20px_#ff00ff]' : 'border-white/20'}`}>
                                   {selectedPkgId === pkg.id && <Check size={20} className="text-white" />}
                                </div>
                             </div>
                          </button>
                        ))}
                     </div>
                  </div>
                  
                  <div className="fixed bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black via-black/95 to-transparent z-[200] pt-16 flex justify-center">
                     <button 
                       onClick={() => setIsTopUpOpen(true)}
                       className="w-full max-w-[500px] h-20 bg-[#ff00ff] rounded-[2.8rem] text-[20px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-5 shadow-[0_25px_80px_rgba(255,0,255,0.4)] active:scale-95 group transition-all"
                     >
                        <span>Secure Checkout</span>
                        <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
                     </button>
                  </div>
               </motion.div>
            )}

             {currentStepIdx === 3 && (
             <motion.div 
               key="success"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="absolute inset-0 bg-black flex flex-col items-center justify-center p-12 text-center space-y-12"
             >
                <div className="relative">
                   <div className="w-28 h-28 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center shadow-[0_0_100px_rgba(0,240,255,0.3)]">
                      <CheckCircle2 size={56} className="text-[#00f0ff]" />
                   </div>
                   <div className="absolute inset-0 rounded-full border border-[#00f0ff]/20 animate-ping" />
                </div>
                <div className="space-y-6">
                   <h2 className="text-5xl font-black italic tracking-tighter text-white leading-none uppercase shrink-0">Account Loaded</h2>
                   <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl font-black text-[#ffea00] tracking-[0.2em] uppercase italic leading-none">Access Granted</span>
                      <div className="h-px w-20 bg-white/10 my-2" />
                      <span className="text-[11px] font-black text-white/30 tracking-[0.4em] uppercase">Identity Verified</span>
                   </div>
                </div>
                <div className="w-full space-y-4 pt-10">
                   <button 
                     onClick={() => window.location.href = '/app'} 
                     className="w-full py-7 bg-white text-black rounded-[2.5rem] text-[20px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95"
                   >
                     Enter Main Frame
                   </button>
                </div>
             </motion.div>
           )}

          </AnimatePresence>
        </div>
      </main>

      <TopUpDrawer isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} initialPackage={selectedPkgId} />
    </div>
  );
}
