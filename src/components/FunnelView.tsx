'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, ArrowRight, Zap, Shield, Sparkles, 
  User, Search, Heart, MessageSquare, Loader2, CreditCard, 
  Terminal, Activity, ShieldAlert, Lock, Mic, HeartPulse,
  Send, Check, Mic2, Activity as Waveform, ShoppingBag, Star
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { initialProfiles, proxyImg } from '@/lib/profiles';
import TopUpDrawer from './economy/TopUpDrawer';
import { SYNDICATE_CONFIG } from '@/lib/economy/monetizationConfig';

export default function FunnelView() {
  const [currentStepIdx, setCurrentStepIdx] = useState(1); // ⚡️ START DIRECTLY AT CHAT
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
  
  const [timeLeft, setTimeLeft] = useState(599); // 9 minutes 59 seconds

  useEffect(() => {
    if (currentStepIdx !== 2) return;
    const interval = setInterval(() => {
       setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStepIdx]);
  
  const formatTimeInfo = (seconds: number) => {
     const m = Math.floor(seconds / 60);
     const s = seconds % 60;
     return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const searchParams = useSearchParams();
  const hasIntercepted = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const profile = { name: 'VERONICA', image: '/Promo/PromoPic1.png', city: 'MEDELLÍN', id: 'veronica-medellin-locked' };
  const galleryImages = ['/Promo/PromoPic1.png', '/Promo/PromoPic2.webp'];

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
        const res = await fetch(`/api/vault/teasers?personaId=veronica-medellin-locked&userId=${localStorage.getItem('gasp_guest_id')}`);
        const data = await res.json();
        if (data.success) setVaultItems(data.items || []);
      } catch (err) { console.error(err); } finally { setLoadingVault(false); }
    };
    fetchVault();
  }, []);

  // 🖥️ TERMINAL BOOT SEQUENCE (runs once)
  useEffect(() => {
    const logs = ["> establishing connection...", "> bypass active.", "> identity confirmed."];
    let lIdx = 0;
    const lInt = setInterval(() => {
      if (lIdx < logs.length) setTerminalLogs(prev => [...prev, logs[lIdx++]]);
      else { setCurrentStepIdx(1); clearInterval(lInt); }
    }, 250);
    return () => clearInterval(lInt);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (currentStepIdx === 1 && messages.length === 0) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          // 🎬 VERONICA OPENS — she's the one who put out the video, she notices HIM
          setMessages([{
            id: 'm1',
            role: 'assistant',
            content: `hey... you probably saw me from that grocery store video huh 😭`,
          }]);
          setTimeout(() => {
            setIsTyping(true);
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: 'm2',
                role: 'assistant',
                content: `I can't believe people actually find me on here lol. what's your name? 🙈🍑`,
              }]);
              setIsTyping(false);
            }, 1400);
          }, 900);
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

    // 📊 LEAD CAPTURE: Log first user message to DB for retargeting
    if (messages.length === 1) {
      const gid = localStorage.getItem('gasp_guest_id') || 'ANON';
      const attribution = JSON.parse(localStorage.getItem('gasp_attribution') || '{}');
      fetch('/api/economy/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: gid, action: 'guest_genesis' })
      }).catch(() => {});
      // Log lead event silently
      fetch('/api/rpc/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log-funnel-lead',
          payload: {
            guestId: gid,
            firstMessage: inputValue,
            source: attribution.source || 'direct',
            campaign: attribution.campaign || 'organic',
            creative: attribution.creative || 'none',
            personaId: 'veronica-medellin-locked'
          }
        })
      }).catch(() => {});
    }
    
    // 🛡️ CONVERSION GATE: After 5 messages, soft pivot to the paywall
    if (messages.length === 5 && !hasIntercepted.current) {
      hasIntercepted.current = true;
      setTimeout(() => {
        setMessages(prev => [...prev, { id: 'int_1_' + Date.now(), role: 'assistant', content: `wait hold on... my account just flagged this chat 😳` }]);
        setIsTyping(true);
        setTimeout(() => {
          setMessages(prev => [...prev, { id: 'int_2_' + Date.now(), role: 'assistant', content: `ugh it won't let me send anything private unless you verify first 😭 I was literally about to send u something 🌶️🍑 there's a free option tho just do it real quick pls` }]);
          setIsTyping(true);
          setTimeout(() => {
            setMessages(prev => [...prev, { id: 'pre_tease_' + Date.now(), role: 'assistant', content: `ok sending u a lil preview... and trust me the vault is WAY spicier than this 😏🍑🌶️` }]);
            setIsTyping(false);
            setTimeout(() => {
              setIsTyping(true);
              setTimeout(() => {
                setMessages(prev => [...prev, { id: 'tease_' + Date.now(), role: 'assistant', content: 'tease_module', isTease: true }]);
                setTimeout(() => { setCurrentStepIdx(2); setIsTyping(false); }, 6000);
              }, 1200);
            }, 800);
          }, 1800);
        }, 1500);
      }, 800);
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            userId: localStorage.getItem('gasp_guest_id'),
            personaId: 'veronica-medellin-locked',
            isFunnel: true,
            systemInstruction: `You are Veronica, a 23-year-old from Medellín. You posted a viral grocery store video and this guy found you through it. You're genuinely flattered and interested in him.
            Rules:
            - Text like a real girl: short messages, lowercase, emojis. NOT a bot.
            - You brought up the grocery store video first. Be a little embarrassed but also flattered he found you.
            - Be curious about HIM. If you don't know his name yet, ask it. Ask where he's from, what he's into.
            - Flirt naturally — playful teasing, not explicit. You're interested but making him work a little.
            - Do NOT mention credits, vaults, or unlocking. That happens automatically.
            - Keep each reply SHORT — 1-2 sentences max. Real girls don't write paragraphs.`,
            source: 'funnel_ad'
          }),
        });
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
                try { fullText += JSON.parse(line.substring(2)); } catch (e) {}
              }
            }
          }
          if (fullText) setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: fullText }]);
        }
      } catch (err) { console.error(err); } finally { setIsTyping(false); }
    })();
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-black text-white font-outfit overflow-hidden flex items-center justify-center">
      <div className="fixed inset-0 z-0">
        <video autoPlay muted loop playsInline className={`w-full h-full object-cover transition-all ${currentStepIdx === 0 ? 'blur-3xl' : 'blur-sm'}`}>
          <source src="/Promo/Veronica.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/80" />
      </div>

      <main className="relative z-10 w-full max-w-[600px] h-[100dvh] md:h-[92dvh] flex flex-col bg-black/60 backdrop-blur-3xl md:rounded-[3rem] border-white/10 shadow-2xl overflow-hidden md:my-4">
        {currentStepIdx > 0 && currentStepIdx < 3 && (
          <div className="shrink-0 px-8 py-5 flex items-center justify-between border-b border-white/5 bg-black/40">
             <div className="flex flex-col"><span className="text-[9px] font-black text-white/40 uppercase italic">Signal Path</span><span className="text-xl font-black text-[#ffea00] leading-none mt-1">{formatTimeInfo(timeLeft)}</span></div>
             <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /><span className="text-[10px] font-black text-white tracking-widest">14 ONLINE</span></div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {currentStepIdx === 2 && <motion.div key="glitch" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], x: [0, -10, 10, 0] }} className="absolute inset-0 z-[500] bg-[#ff00ff]/10 mix-blend-overlay pointer-events-none" />}
            
            {currentStepIdx === 0 && (
              <motion.div key="init" className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
                 <Loader2 className="text-[#ff00ff] animate-spin" size={40} />
                 <div className="font-mono text-[9px] text-white/20 space-y-1">{terminalLogs.map((log, i) => <div key={i}>{log}</div>)}</div>
              </motion.div>
            )}

            {currentStepIdx === 1 && (
              <motion.div key="main" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-8 py-4 border-b border-white/5 flex items-center gap-5">
                   <div className="w-14 h-14 rounded-full border-2 border-[#ff00ff] p-1 shadow-lg"><img src={profile.image} className="w-full h-full object-cover rounded-full" /></div>
                   <div className="flex flex-col"><h2 className="text-xl font-black text-white">{profile.name}</h2><span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{profile.city}</span></div>
                </div>
                <div className="flex px-8 border-b border-white/5 gap-8">
                   <button onClick={() => setActiveTab('NEURAL_LINK')} className={`pb-3 text-[11px] font-black tracking-widest relative ${activeTab === 'NEURAL_LINK' ? 'text-white' : 'text-white/30'}`}>CHAT {activeTab === 'NEURAL_LINK' && <motion.div layoutId="t" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff00ff]" />}</button>
                   <button onClick={() => setActiveTab('ARCHIVE')} className={`pb-3 text-[11px] font-black tracking-widest relative ${activeTab === 'ARCHIVE' ? 'text-white' : 'text-white/30'}`}>VAULT {activeTab === 'ARCHIVE' && <motion.div layoutId="t" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff00ff]" />}</button>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 pb-[180px] no-scrollbar">
                  {activeTab === 'NEURAL_LINK' ? (
                    <div className="space-y-8">
                      {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.isTease ? (
                            <div className="relative w-full max-w-[320px] aspect-[3/4] rounded-[2rem] overflow-hidden border border-[#ff00ff]/30 shadow-2xl bg-black">
                            <div className="relative w-full max-w-[320px] aspect-[3/4] rounded-[2rem] overflow-hidden border border-[#ff00ff]/30 shadow-2xl bg-black">
                               <img src="https://asset.gasp.fun/Promo/cucumber_tease.png" className="w-full h-full object-cover" />
                               <div className="absolute top-4 left-0 right-0 flex justify-center gap-3 z-10 pointer-events-none"><span className="text-3xl drop-shadow-lg">🌶️</span><span className="text-3xl drop-shadow-lg">🍑</span></div>
                               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.5, duration: 1.5 }} className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                                 <div className="w-14 h-14 rounded-full border-2 border-[#ff00ff] border-t-transparent animate-spin" />
                                 <span className="text-[12px] font-black text-[#ff00ff] uppercase tracking-widest">Verifying...</span>
                               </motion.div>
                            </div>
                          ) : (
                            <div className={`px-6 py-4 rounded-[2rem] text-[15px] ${msg.role === 'user' ? 'bg-[#ff00ff] text-white italic rounded-tr-none' : 'bg-[#151515]/90 border border-white/10 rounded-tl-none'}`}>{msg.content}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {vaultItems.filter(v => v.is_vault).map(item => (
                        <div key={item.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 bg-zinc-900 shadow-2xl">
                           <img src={item.content_url} className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50" />
                           <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 gap-4 bg-black/60 backdrop-blur-sm">
                              <Lock size={20} className="text-white/40" />
                              <button onClick={() => setCurrentStepIdx(2)} className="w-full py-3 bg-white text-black text-[10px] font-black uppercase rounded-xl">Unlock Now</button>
                              <button onClick={() => { const tid = localStorage.getItem('gasp_guest_id') || 'G'; window.open(SYNDICATE_CONFIG.getSmartLink(tid), '_blank'); }} className="w-full py-2.5 bg-gradient-to-r from-[#00fff2] to-[#0088ff] text-black text-[9px] font-black uppercase rounded-xl">Verification Unlock 🌶️</button>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
                  <form onSubmit={handleSendMessage} className="relative flex gap-4"><input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Message Veronica..." className="flex-1 bg-[#111] border border-white/20 rounded-2xl px-6 py-5 text-[15px] focus:outline-none" /><button type="submit" className="w-14 h-14 bg-[#ff00ff] rounded-2xl flex items-center justify-center shadow-xl"><Send size={24} className="rotate-[-45deg]" /></button></form>
                </div>
              </motion.div>
            )}

            {currentStepIdx === 2 && (
               <motion.div key="offer" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                  <div className="px-8 py-6 space-y-6 pb-40">
                     <div className="flex flex-col items-center gap-4">
                        <div className="relative"><div className="w-20 h-20 rounded-full border-2 border-[#ff00ff]/30 p-1 bg-black"><img src={profile.image} className="w-full h-full object-cover rounded-full opacity-60" /></div><Lock size={24} className="absolute inset-0 m-auto text-[#ff00ff]" /></div>
                        <div className="text-center">
                           <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ff0000]/20 border border-[#ff0000]/50 rounded-full mb-3 animate-pulse">
                              <ShieldAlert size={12} className="text-[#ff0000]" />
                              <span className="text-[10px] font-black text-[#ff0000] uppercase tracking-widest">SECURE LINK EXPIRES IN {formatTimeInfo(timeLeft)}</span>
                           </div>
                           <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">VIP ACCESS LOCKED</h2>
                           <p className="text-[10px] text-[#ffea00] font-black uppercase mt-2">6,000 CREDITS REQUIRED TO RESTORE LINK</p>
                        </div>
                     </div>

                     {/* 🎭 FUNNEL PERSONA HOOK (COMPLIANT) */}
                     <div className="w-full relative py-2">
                        <div className="absolute -top-1 left-6 px-3 py-1 bg-[#ff00ff] rounded-md text-[8px] font-black text-white uppercase italic shadow-[0_0_15px_#ff00ff] z-10">Private Note from {profile.name}</div>
                        <div className="p-5 bg-white/5 border border-[#ff00ff]/30 rounded-3xl text-left relative overflow-hidden shadow-xl">
                           <div className="absolute inset-0 bg-gradient-to-br from-[#ff00ff]/10 to-transparent pointer-events-none" />
                           <p className="text-[12px] font-medium text-white/90 leading-relaxed relative z-10 italic">
                               "that little preview was literally the tamest thing in my vault lol 😏 the real stuff is WAY more 🍑🌶️ than that. earn 6,000 credits for <span className=\"text-[#ffea00] font-black\">FREE</span> by tapping below — takes 2 mins and then you'll see exactly why I can't just post this anywhere..."
                           </p>
                        </div>
                     </div>

                     {/* 🎁 THE ENDOWED PROGRESS ILLUSION (500 CR GIFT) */}
                     <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5, type: 'spring' }} className="w-full">
                        <div className="bg-[#00ffcc]/10 border border-[#00ffcc]/30 rounded-2xl p-4 flex items-center justify-between overflow-hidden relative shadow-[0_0_20px_rgba(0,255,204,0.15)]">
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ffcc]/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                           <div className="flex items-center gap-4 relative z-10">
                              <div className="w-12 h-12 rounded-full bg-[#00ffcc]/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_#00ffcc]">
                                 <span className="text-[#00ffcc] text-xl">🎁</span>
                              </div>
                              <div className="flex flex-col text-left">
                                 <span className="text-[10px] font-black text-[#00ffcc] uppercase tracking-widest leading-none mb-1">{profile.name} SENT A GIFT</span>
                                 <span className="text-[18px] font-black text-white italic leading-none">+500 CR</span>
                              </div>
                           </div>
                           <div className="flex flex-col items-end relative z-10">
                              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">REMAINING</span>
                              <span className="text-[14px] font-black text-[#ffea00] italic leading-none">5,500 CR</span>
                           </div>
                        </div>
                     </motion.div>

                     {/* 🍼 THE BABYSITTER STEPS */}
                     <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 border border-[#ffea00]/30 bg-[#ffea00]/5 rounded-2xl flex flex-col items-center text-center">
                           <span className="text-[10px] font-black text-[#ffea00] mb-1 italic leading-none">01</span>
                           <span className="text-[7px] font-bold text-white/80 uppercase tracking-widest italic">TAP FREE ACCESS</span>
                        </div>
                        <div className="p-3 border border-[#ffea00]/30 bg-[#ffea00]/5 rounded-2xl flex flex-col items-center text-center">
                           <span className="text-[10px] font-black text-[#ffea00] mb-1 italic leading-none">02</span>
                           <span className="text-[7px] font-bold text-white/80 uppercase tracking-widest italic">REAL EMAIL</span>
                        </div>
                        <div className="p-3 border border-[#ffea00]/30 bg-[#ffea00]/5 rounded-2xl flex flex-col items-center text-center">
                           <span className="text-[10px] font-black text-[#ffea00] mb-1 italic leading-none">03</span>
                           <span className="text-[7px] font-bold text-white/80 uppercase tracking-widest italic">VAULT UNLOCKS</span>
                        </div>
                     </div>
                  </div>
                  <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent flex flex-col items-center gap-3">
                     <button onClick={() => { const tid = localStorage.getItem('gasp_guest_id') || 'G'; window.open(SYNDICATE_CONFIG.getSmartLink(tid), '_blank'); }} className="w-full max-w-[500px] h-20 bg-[#ffea00] rounded-[3rem] text-black text-[20px] font-black uppercase tracking-widest flex items-center justify-center gap-4 shadow-[0_15px_50px_rgba(255,234,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all group shrink-0">
                        <Zap size={24} className="fill-black" />
                        <span className="italic font-syncopate tracking-tighter">GET FREE ACCESS</span>
                        <ArrowRight size={24} className="group-hover:translate-x-2 transition-all opacity-50" />
                     </button>
                     <button
                        onClick={async () => {
                          const gid = localStorage.getItem('gasp_guest_id') || '';
                          const res = await fetch(`/api/economy/balance?userId=${gid}`);
                          const data = await res.json();
                          if (data.success && data.balance >= 6000) {
                            setCurrentStepIdx(3);
                          } else {
                            alert(`Your balance is ${data.balance || 0} CR. You need 6,000 CR. Complete the offer and try again!`);
                          }
                        }}
                        className="w-full max-w-[500px] py-4 border-2 border-[#ffea00]/40 rounded-2xl text-[#ffea00] text-[11px] font-black uppercase tracking-widest hover:bg-[#ffea00]/10 active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        <Shield size={14} className="animate-pulse" /> I completed it — check my credits
                      </button>
                     <div className="flex items-center justify-center gap-2 mt-2 opacity-50">
                        <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#00f0ff] italic">STATUS: WAITING FOR COMPLETION SIGNAL...</span>
                     </div>
                     <button onClick={() => setIsTopUpOpen(true)} className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic hover:text-white transition-colors py-2 flex items-center gap-2 mt-2">
                        <CreditCard size={12} /> OR BUY CREDITS DIRECTLY
                     </button>
                  </div>
               </motion.div>
            )}

            {currentStepIdx === 3 && (
               <motion.div key="s" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-black flex flex-col items-center justify-center p-10 text-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-[#ffea00]/10 border-2 border-[#ffea00]/40 flex items-center justify-center shadow-[0_0_40px_rgba(255,234,0,0.2)]">
                    <CheckCircle2 size={40} className="text-[#ffea00]" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black italic uppercase leading-tight">Credits Unlocked! 🎉</h2>
                    <p className="text-white/50 text-[12px] mt-2 font-bold uppercase tracking-wider">Your access has been verified</p>
                  </div>

                  {/* ⚠️ SIGNUP URGENCY HOOK */}
                  <div className="w-full p-5 bg-[#ff0000]/10 border border-[#ff0000]/30 rounded-3xl text-left">
                    <p className="text-[11px] font-black text-[#ff4444] uppercase tracking-wider mb-1">⚠️ Your credits will expire</p>
                    <p className="text-[13px] text-white/80 leading-relaxed">Guest credits are temporary. <span className="text-white font-black">Create a free account</span> to save them permanently and keep chatting with Veronica.</p>
                  </div>

                  <button
                    onClick={() => window.location.href = '/auth/signup?source=funnel_completion&ref=veronica'}
                    className="w-full h-16 bg-[#ffea00] rounded-[3rem] text-black text-[16px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(255,234,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <User size={20} className="fill-black" /> Save My Credits — Sign Up Free
                  </button>

                  <button
                    onClick={() => window.location.href = '/?profile=veronica-medellin-locked'}
                    className="text-[11px] font-black text-white/30 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    skip for now — continue as guest
                  </button>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <TopUpDrawer isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} initialPackage={selectedPkgId} />
    </div>
  );
}
