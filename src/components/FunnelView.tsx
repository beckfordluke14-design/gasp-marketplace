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
              <motion.div 
                key="chat" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* 💬 CHAT FEED */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide pb-24"
                >
                  {messages.map((m) => (
                    <motion.div 
                      key={m.id}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                    >
                      {m.isTease ? (
                        <div className="w-full max-w-[85%] bg-white/5 border border-[#ffea00]/30 rounded-3xl p-4 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                           <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 rounded-full bg-[#ffea00]/20 flex items-center justify-center">
                               <Sparkles size={16} className="text-[#ffea00]" />
                             </div>
                             <span className="text-[10px] font-black text-[#ffea00] uppercase tracking-widest">Incoming Preview...</span>
                           </div>
                           <div className="aspect-[4/5] rounded-2xl bg-white/10 overflow-hidden relative group">
                              <img src={vaultItems[0]?.url || proxyImg(profile.id + '-1')} className="w-full h-full object-cover blur-[20px] scale-110" alt="Preview" />
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
                                 <Lock size={32} className="text-[#ffea00] mb-3 animate-pulse" />
                                 <span className="text-[14px] font-black text-white italic">MEDIA INTERCEPTED</span>
                                 <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-2">Signal Security Protocol Active</span>
                              </div>
                           </div>
                        </div>
                      ) : (
                        <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-[15px] font-medium leading-relaxed ${
                          m.role === 'assistant' 
                            ? 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none' 
                            : 'bg-[#ffea00] text-black font-bold rounded-tr-none shadow-[0_5px_15px_rgba(255,234,0,0.2)]'
                        }`}>
                          {m.content}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                      <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffea00] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffea00] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffea00] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* ⌨️ INPUT AREA */}
                <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <form onSubmit={handleSendMessage} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ffea00]/20 to-[#00f0ff]/20 rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition duration-1000"></div>
                    <div className="relative flex items-center gap-3">
                      <input 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Reply to Veronica..."
                        className="flex-1 h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ffea00]/50 transition-all font-bold backdrop-blur-xl"
                      />
                      <button type="submit" className="w-14 h-14 bg-[#ffea00] rounded-2xl flex items-center justify-center text-black shadow-[0_10px_30px_rgba(255,234,0,0.2)] hover:scale-105 active:scale-95 transition-all">
                        <Send size={20} />
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {currentStepIdx === 2 && (
              <motion.div 
                key="offer" 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide pb-40">
                  {/* 🎁 GIFT BANNER */}
                  <div className="bg-[#00ffcc]/10 border border-[#00ffcc]/30 rounded-[2rem] p-6 flex items-center justify-between overflow-hidden relative shadow-[0_0_40px_rgba(0,255,204,0.15)]">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ffcc]/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                     <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-16 rounded-full bg-[#00ffcc]/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_#00ffcc]">
                           <span className="text-[#00ffcc] text-2xl">🎁</span>
                        </div>
                        <div className="flex flex-col text-left">
                           <span className="text-[11px] font-black text-[#00ffcc] uppercase tracking-widest leading-none mb-1">{profile.name} SENT A GIFT</span>
                           <span className="text-[22px] font-black text-white italic leading-none">+500 CR</span>
                        </div>
                     </div>
                     <div className="flex flex-col items-end relative z-10">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">REMAINING</span>
                        <span className="text-[16px] font-black text-[#ffea00] italic leading-none">5,500 CR</span>
                     </div>
                  </div>

                  <div className="text-center space-y-3">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Security Intercept ⚠️</h2>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Identity Verification Required</p>
                  </div>

                  {/* 🍼 THE STEPS */}
                  <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-6 border border-[#ffea00]/30 bg-[#ffea00]/5 rounded-3xl flex items-center gap-6 relative overflow-hidden group">
                        <div className="absolute inset-y-0 left-0 w-1 bg-[#ffea00]" />
                        <span className="text-4xl font-black text-[#ffea00]/20 italic group-hover:text-[#ffea00]/40 transition-colors">01</span>
                        <div className="flex flex-col">
                           <span className="text-[14px] font-black text-white uppercase italic">TAP REWARD SELECTION</span>
                           <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">Authorized Neural Link Gateway</span>
                        </div>
                        <Zap size={18} className="ml-auto text-[#ffea00] animate-pulse" />
                     </div>
                     <div className="p-6 border border-white/10 bg-white/5 rounded-3xl flex items-center gap-6">
                        <span className="text-4xl font-black text-white/10 italic">02</span>
                        <div className="flex flex-col">
                           <span className="text-[14px] font-black text-white uppercase italic">COMPLETE DATA TASK</span>
                           <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">Verification Signal Required</span>
                        </div>
                     </div>
                  </div>

                  {/* 📊 REWARD MATRIX: SHOWING POTENTIAL */}
                  <div className="space-y-4 pt-4">
                     <div className="flex items-center gap-2 mb-2 px-2 text-left">
                        <span className="text-[8px] font-black text-[#00f0ff] tracking-[0.4em] uppercase italic">REWARD INFUSION MATRIX</span>
                        <div className="h-[1px] flex-1 bg-[#00f0ff]/10" />
                     </div>
                     
                     <div className="grid grid-cols-1 gap-3">
                        {/* BASIC TASK */}
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-[#ffea00]/30 transition-all">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-[#ffea00] uppercase tracking-widest">Entry Verification</span>
                              <span className="text-lg font-black text-white italic">2,500 - 5,000 Credits</span>
                           </div>
                           <div className="px-3 py-1 bg-[#ffea00]/10 border border-[#ffea00]/30 rounded-lg text-[#ffea00] text-[10px] font-black uppercase tracking-widest">Low Effort</div>
                        </div>

                        {/* ADVANCED TASK */}
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/20 flex items-center justify-between group hover:border-[#00f0ff]/30 transition-all scale-[1.02] shadow-[0_0_30px_rgba(0,240,255,0.05)] border-l-[#00f0ff] border-l-2">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-[#00f0ff] uppercase tracking-widest">High-Intent Survey</span>
                              <span className="text-lg font-black text-white italic">12,000 - 25,000 Credits</span>
                           </div>
                           <div className="px-3 py-1 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-lg text-[#00f0ff] text-[10px] font-black uppercase tracking-widest">Popular</div>
                        </div>

                        {/* INSTITUTIONAL TASK */}
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-[#ff00ff]/30 transition-all">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-[#ff00ff] uppercase tracking-widest">System Optimization</span>
                              <span className="text-lg font-black text-white italic">50,000+ Credits</span>
                           </div>
                           <div className="px-3 py-1 bg-[#ff00ff]/10 border border-[#ff00ff]/30 rounded-lg text-[#ff00ff] text-[10px] font-black uppercase tracking-widest">Elite Reward</div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* ⚡️ ACTION AREA */}
                <div className="fixed bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black via-black/95 to-transparent flex flex-col items-center gap-4 z-[600]">
                   <button onClick={() => { const tid = localStorage.getItem('gasp_guest_id') || 'G'; window.open(SYNDICATE_CONFIG.getSmartLink(tid), '_blank'); }} className="w-full max-w-[500px] h-16 md:h-20 bg-[#ffea00] rounded-[3rem] text-black text-[18px] md:text-[22px] font-black uppercase tracking-widest flex items-center justify-center gap-5 shadow-[0_20px_60px_rgba(255,234,0,0.4)] hover:scale-[1.02] active:scale-95 transition-all group shrink-0 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                      <Zap size={24} className="fill-black" />
                      <span className="italic">ACCESS TASK BOARD</span>
                      <ArrowRight size={24} className="group-hover:translate-x-2 transition-all opacity-40" />
                   </button>
                   
                   <div className="flex flex-col w-full items-center gap-3">
                      <div className="grid grid-cols-2 gap-3 w-full max-w-[500px]">
                        <button
                          onClick={async () => {
                            const gid = localStorage.getItem('gasp_guest_id') || '';
                            const res = await fetch(`/api/economy/balance?userId=${gid}`);
                            const data = await res.json();
                            if (data.success && data.balance >= 6000) {
                              setCurrentStepIdx(3);
                            } else {
                              alert(`Insufficient Signal: ${data.balance || 0} / 6,000 CR. Complete a task and try again!`);
                            }
                          }}
                          className="flex-1 py-4 border-2 border-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-2 italic"
                        >
                          <Shield size={14} /> VERIFY SIGNAL
                        </button>
                        
                        <button onClick={() => setIsTopUpOpen(true)} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2 italic">
                          <CreditCard size={14} /> BUY INSTANT
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-center gap-3 opacity-30 mt-1">
                        <div className="flex gap-1">
                          <span className="w-1 h-1 rounded-full bg-[#00f0ff] animate-ping" />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#00f0ff] italic">SCANNING INBOUND...</span>
                      </div>
                   </div>
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
