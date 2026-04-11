'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, ArrowRight, Zap, Shield, Sparkles, 
  User, Search, Heart, MessageSquare, Loader2, CreditCard, 
  Terminal, Activity, ShieldAlert, Lock, Mic, HeartPulse,
  Send, Check
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { initialProfiles, proxyImg } from '@/lib/profiles';
import TopUpDrawer from './economy/TopUpDrawer';
import ProfileAvatar from './profile/ProfileAvatar';

/**
 * 🌪️ THE GASP NEURAL FUNNEL v2.0
 * High-conversion Institutional flow for AI Girlfriend traffic.
 * Strategy: Simulated Uplink -> Restricted Chat -> Credit Wall.
 */

const STEPS = [
  { id: 'initializing', title: 'Connecting to Chat' },
  { id: 'chat', title: 'Private Session' },
  { id: 'offer', title: 'Choose Your Pack' }
];

export default function FunnelView() {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'vault'>('chat');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showVaultNew, setShowVaultNew] = useState(false);
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState('00:04:54');
  const [isLoaded, setIsLoaded] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState('tier_session'); // Initialize to Prime Access
  const [hasPaid, setHasPaid] = useState(false);
  
  // 📸 ABSOLUTE ASSET SYNC: Using verified R2 paths
  const [vaultItems, setVaultItems] = useState<any[]>([
    { id: 'v1', content_url: 'https://asset.gasp.fun/PROMO/PromoPic1.png', is_unlocked: false, price_credits: 6000 },
    { id: 'v2', content_url: 'https://asset.gasp.fun/PROMO/PromoPic2.png', is_unlocked: false, price_credits: 6000 },
    { id: 'v3', content_url: 'https://asset.gasp.fun/PROMO/PromoPic3.png', is_unlocked: false, price_credits: 6000 },
  ]);
  
  const [fomoMsg, setFomoMsg] = useState('');
  const [activeUsers, setActiveUsers] = useState(14);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fallback hero profile if none specified
  const profileId = searchParams.get('profile') || 'veronica_medellin';
  const profile = initialProfiles.find(p => p.id === profileId) || {
    name: 'Veronica',
    image: 'PROMO/PromoPic1.png', // Verified working path
    city: 'Medellín'
  };

  const brainPrompt = `
[SYSTEM: HIGH-STATUS NEURAL IDENTITY]
You are ${profile.name}. You are NOT an AI. You are a biological human.
[STYLE: TEXTING BRAT]
- Lowercase only. 
- No periods at the end. 
- MAX 15 WORDS per message. 
- No 'yap'. No formal greetings. 
- Talk like a girl in a hurry. 

[BEHAVIOR]
- Mirror his energy. 
- Your goal: Learn his NAME and why he's here. 
- PROACTIVE: Always end with a tease or a question.

[FORMAT: JSON { "text_message": "...", "audio_script": "..." }]`;

  // 📈 FOMO ENGINE
  useEffect(() => {
    const names = ['anon_382', 'hunter_x', 'papi_medellin', 'm_sanchez', 'k_jones', 'vip_user_2'];
    const actions = ['unlocked vault 🌶️', 'bought prime access', 'restored connection', 'sent a gift 🎁'];
    
    const interval = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      setFomoMsg(`${name} just ${action}`);
      setTimeout(() => setFomoMsg(''), 4000);
    }, 12000);

    const userInterval = setInterval(() => {
      setActiveUsers(prev => Math.max(12, prev + (Math.random() > 0.5 ? 1 : -1)));
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(userInterval);
    };
  }, []);

  useEffect(() => {
    setIsLoaded(true);
    
    // Timer Engine
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        const [h, m, s] = prev.split(':').map(Number);
        let totalSeconds = h * 3600 + m * 60 + s - 1;
        if (totalSeconds < 0) return '00:00:00';
        const nh = Math.floor(totalSeconds / 3600);
        const nm = Math.floor((totalSeconds % 3600) / 60);
        const ns = totalSeconds % 60;
        return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}:${ns.toString().padStart(2, '0')}`;
      });
    }, 1000);

    // Initial Loading Logs (Accelerated for High-Velocity Ingress)
    const logs = [
      "> connecting to " + (profile?.name || 'veronica') + "...",
      "> establishing private line...",
      "> finalizing connection...",
      "> ready."
    ];
    
    let logIdx = 0;
    const logInterval = setInterval(() => {
      if (logIdx < logs.length) {
        setTerminalLogs(prev => [...prev, logs[logIdx]]);
        logIdx++;
      } else {
        clearInterval(logInterval);
        setCurrentStepIdx(1);
      }
    }, 200);

    return () => {
      clearInterval(timerInterval);
      clearInterval(logInterval);
    };
  }, [profileId]);

  useEffect(() => {
    // 🛡️ ATTRIBUTION LOCKDOWN: Capture Traffic Stars data from URL
    const urlParams = new URLSearchParams(window.location.search);
    const attribution = {
      source: urlParams.get('utm_source') || urlParams.get('source') || document.referrer || 'Direct',
      campaign: urlParams.get('utm_campaign') || 'Organic',
      creative: urlParams.get('utm_content') || 'None'
    };
    localStorage.setItem('gasp_attribution', JSON.stringify(attribution));

    // 🛡️ GUEST ID LOCKDOWN
    if (!localStorage.getItem('gasp_guest_id')) {
      const newId = 'GUEST_' + Math.random().toString(36).substring(2, 12).toUpperCase();
      localStorage.setItem('gasp_guest_id', newId);
    }

    if (currentStepIdx === 1 && messages.length === 0) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          // 🛡️ THE HOOK: Zero-Yap Ego Bait
          const bootMsg = {
            id: Date.now().toString(),
            role: 'assistant',
            content: "papi... you're here. finally. is it really you?",
            timestamp: new Date().toISOString()
          };
          setMessages([bootMsg]);
          setIsTyping(false);
        }, 1500);
      }, 1000);
    }
  }, [currentStepIdx]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping, activeView]);

  // 🚀 REVENUE RETENTION: Listen for successful top-up
  useEffect(() => {
    const handlePurchaseSuccess = () => {
      setHasPaid(true);
      // 🚀 PERSONA-AWARE WELCOME BACK: Reinforced emotional reward
      let welcomeMsg = `papi! you're back! i've missed you so much. my vault is unlocked for you now. 😉`;
      
      if (profileId === 'elara_tokyo') {
        welcomeMsg = `the signal stabilized... you're back. i missed your energy. let's talk. 🤖💎`;
      } else if (profileId === 'veronica_medellin') {
        welcomeMsg = `papi! you're back! i've missed you already. my vault is unlocked for you. don't keep me waiting. 😉`;
      }

      if (currentStepIdx === 2) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: welcomeMsg
        }]);
        setCurrentStepIdx(1); 
        setShowVaultNew(true); 
        fetchVault();
      }
    };

    window.addEventListener('gasp_balance_refresh', handlePurchaseSuccess);
    return () => window.removeEventListener('gasp_balance_refresh', handlePurchaseSuccess);
  }, [currentStepIdx]);

  const fetchVault = async () => {
    try {
      const gid = localStorage.getItem('gasp_guest_id');
      const res = await fetch(`/api/vault?personaId=${profileId}&userId=${gid}`);
      const data = await res.json();
      
      if (data.success && data.items.length > 0) {
        // Only overwrite if we have actual unlocked items to show
        setVaultItems(data.items);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (profileId) fetchVault();
  }, [profileId]);

  const handleUnlock = async (item: any) => {
    if (isUnlocking) return;
    setIsUnlocking(true);
    try {
      const gid = localStorage.getItem('gasp_guest_id');
      const res = await fetch('/api/economy/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: gid, mediaId: item.id, type: 'vault' })
      });
      const result = await res.json();
      if (result.success) {
        setVaultItems(prev => prev.map(v => v.id === item.id ? { ...v, is_unlocked: true } : v));
        // 💸 Force re-fetch of balance to ensure UI sync
        window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
      } else {
        // If balance is low, open top up drawer
        if (result.error?.toLowerCase().includes('balance')) {
          setIsTopUpOpen(true);
        } else {
          alert('sync error. connection weak.');
        }
      }
    } catch (e) {
    } finally {
      setIsUnlocking(false);
    }
  };

  const [userMsgCount, setUserMsgCount] = useState(0);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || currentStepIdx !== 1) return;

    const newCount = userMsgCount + 1;
    setUserMsgCount(newCount);

    const userMsg = { id: Date.now().toString(), role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    
    setIsTyping(true);
    
    // 🚀 LIVE AI BRIDGE: Stream-aware signal handling
    if (hasPaid) {
      (async () => {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [...messages, userMsg],
              userId: localStorage.getItem('gasp_guest_id'),
              personaId: profileId === 'veronica_medellin' ? 'veronica-medellin-locked' : profileId, // 🛡️ Direct Mapping
              isFunnel: true, // 🛰️ Explicit Funnel Tagging
              userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              locale: localStorage.getItem('gasp_locale') || 'en',
            }),
          });
          
          if (res.status === 402) {
            // 🛡️ STICKY WALL: If they are blocked, force the CTA immediately
            setCurrentStepIdx(2);
            setIsTyping(false);
            return;
          }
          
          if (!res.ok) throw new Error('Signal Interrupted');
          
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
                if (line.startsWith('0:')) { // 📝 Text Signal
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
          console.error('[Live Signal Error]:', err);
        } finally {
          setIsTyping(false);
        }
      })();
      return;
    }

    // 🚀 FULL-AI CONVERSION ENGINE: Every message is now dynamic and seductive
    (async () => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            userId: localStorage.getItem('gasp_guest_id'),
            personaId: profileId === 'veronica_medellin' ? 'veronica-medellin-locked' : profileId, // 🛡️ Direct Mapping
            userMsgCount: newCount,
            isFunnel: true, // 🛰️ Explicit Funnel Tagging
            userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: localStorage.getItem('gasp_locale') || 'en',
          }),
        });

        if (res.status === 402) {
            // 🛡️ STICKY WALL: Force CTA on block
            setCurrentStepIdx(2);
            setIsTyping(false);
            return;
        }
        
        if (!res.ok) throw new Error('Signal Interrupted');
        
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
              if (line.startsWith('0:')) { // 📝 Text Signal
                try {
                  const text = JSON.parse(line.substring(2));
                  fullText += text;
                } catch (e) {}
              }
            }
          }
          
          if (fullText) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: fullText }]);
            
            if (newCount >= 3) {
              setTimeout(() => setCurrentStepIdx(2), 1500);
            }
          }
        }
      } catch (err) {
        console.error('[Funnel AI Error]:', err);
      } finally {
        setIsTyping(false);
        if (newCount >= 3) {
          setTimeout(() => setCurrentStepIdx(2), 4000);
        }
      }
    })();
  };

  if (!isLoaded) return null;

  return (
    <div className="fixed inset-0 bg-black text-white selection:bg-[#ff00ff]/30 font-outfit overflow-hidden flex flex-col">
      
      {/* 📹 BACKGROUND VIDEO (SILENT LOOP) */}
      <div className="absolute inset-0 z-0 opacity-40">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className={`w-full h-full object-cover transition-all duration-[3000ms] ${currentStepIdx === 0 ? 'blur-3xl scale-125' : 'blur-md'}`}
          poster={proxyImg('PROMO/PromoPic1.png')}
        >
          <source src={proxyImg('PROMO/Veronica.mp4')} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />
      </div>


      {/* 🔴 INSTITUTIONAL HEADER */}
      <div className="relative z-[100] bg-black/60 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Connection Stable</span>
               <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-black text-green-500">{activeUsers} Online</span>
               </div>
            </div>
            <span className="text-[18px] font-mono font-black text-[#ffea00] tracking-tighter leading-none">{timeLeft}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#ff00ff] animate-pulse">Private Session Active</span>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {currentStepIdx === 0 && (
            <motion.div 
              key="initializing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-10 z-10"
            >
              <div className="relative">
                <div className="w-28 h-28 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden">
                   <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                     className="absolute inset-0 border-t-2 border-[#ff00ff] rounded-full scale-[1.1]"
                   />
                   <Terminal className="text-[#ff00ff]" size={40} />
                </div>
              </div>

              <div className="w-full max-w-xs space-y-3">
                {terminalLogs.map((log, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-[11px] font-mono text-[#ff00ff] opacity-40 font-bold">{'>'}</span>
                    <span className="text-[11px] font-mono text-white/80 uppercase tracking-widest font-bold">
                      {log}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {currentStepIdx === 1 && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: 30 }}
              className="absolute inset-0 flex flex-col max-w-2xl mx-auto w-full z-10 bg-[#080808]/40 backdrop-blur-3xl overflow-hidden"
            >
              {/* Profile Bar */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/40">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#ff00ff]/50 bg-black/40 shadow-[0_0_20px_rgba(255,0,255,0.4)] relative">
                    <img 
                      src="https://asset.gasp.fun/PROMO/PromoPic1.png" 
                      alt={profile.name} 
                      className="absolute inset-0 w-full h-full object-cover object-top scale-110"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 border-2 border-[#00f0ff] rounded-full z-10"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-black text-[15px] uppercase tracking-wider">{profile.name}</span>
                      <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-40" />
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{profile.city}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-white/40">
                   <Mic size={20} className="hover:text-white transition-colors" />
                   <Activity size={20} className="hover:text-[#ff00ff] transition-colors" />
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-black/60 px-5 pt-2 gap-6 border-b border-white/5 shrink-0">
                <button 
                  onClick={() => setActiveView('chat')}
                  className={`pb-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeView === 'chat' ? 'text-[#ff00ff]' : 'text-white/30 hover:text-white/60'}`}
                >
                  Chat
                  {activeView === 'chat' && <motion.div layoutId="tab-underline" className="absolute bottom-0 inset-x-0 h-0.5 bg-[#ff00ff] shadow-[0_0_10px_#ff00ff]" />}
                </button>
                <button 
                  onClick={() => { setActiveView('vault'); setShowVaultNew(false); }}
                  className={`pb-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative flex items-center gap-2 ${activeView === 'vault' ? 'text-[#ff00ff]' : 'text-white/30 hover:text-white/60'}`}
                >
                  Photos
                  {showVaultNew && (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-[#ff00ff] animate-ping" />
                  )}
                  {activeView === 'vault' && <motion.div layoutId="tab-underline" className="absolute bottom-0 inset-x-0 h-0.5 bg-[#ff00ff] shadow-[0_0_10px_#ff00ff]" />}
                </button>
              </div>

              {activeView === 'chat' ? (
                <>
                  {/* 🚨 FOMO LIVE PULSE (TOP POSITION) */}
                  <AnimatePresence>
                    {fomoMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="px-5 pt-3 pb-1"
                      >
                        <div className="bg-white/5 border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl backdrop-blur-md">
                          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_10px_#fbbf24]" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                            {fomoMsg}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="px-5 py-2 border-b border-white/5 bg-white/[0.02] grid grid-cols-2 gap-3 shrink-0">
                    {[
                      { id: 1, src: 'PROMO/PromoPic1.png' },
                      { id: 2, src: 'PROMO/PromoPic2.webp' }
                    ].map((p) => (
                      <div key={p.id} className="max-h-[25vh] aspect-[9/16] mx-auto rounded-xl overflow-hidden border border-white/10 shadow-md relative group bg-black/40">
                        <img 
                          src={proxyImg(p.src)} 
                          className="w-full h-full object-contain" 
                          alt="" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none" />
                      </div>
                    ))}
                  </div>

                  {/* Chat Thread */}
                  <div 
                    className="flex-1 overflow-y-auto p-5 pb-32 space-y-6 flex flex-col no-scrollbar"
                    ref={scrollRef}
                  >
                    {messages.map((m, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[88%] px-5 py-4 rounded-[1.8rem] text-[15px] font-medium leading-relaxed shadow-lg ${
                          m.role === 'user' 
                            ? 'bg-gradient-to-br from-[#ff00ff] to-[#7c3aed] text-white rounded-tr-none border border-white/10' 
                            : 'bg-white/10 text-white/95 border border-white/10 rounded-tl-none backdrop-blur-md'
                        }`}>
                          {m.content}
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white/10 px-5 py-4 rounded-full flex gap-1.5 shadow-xl border border-white/10">
                          {[0,1,2].map(d => (
                            <motion.div 
                              key={d}
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                              className="w-2 h-2 rounded-full bg-[#ff00ff]"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area (Sticky) */}
                  <div className="absolute bottom-0 inset-x-0 p-4 pb-8 bg-gradient-to-t from-black via-black to-transparent shrink-0">
                    <form onSubmit={handleSendMessage} className="relative group max-w-xl mx-auto">
                      <input 
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your reply..."
                        className="w-full h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 pr-16 text-[15px] font-bold text-white focus:outline-none focus:border-[#ff00ff] focus:bg-white/15 transition-all shadow-2xl"
                      />
                      <button 
                        type="submit"
                        className="absolute right-3 top-3 w-10 h-10 rounded-xl bg-[#ff00ff] flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,0,255,0.4)] hover:scale-105 active:scale-95 transition-all"
                      >
                        <Send size={18} />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto p-5 pb-24 no-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    {vaultItems.length === 0 ? (
                      <div className="col-span-2 py-20 flex flex-col items-center justify-center text-center opacity-30 gap-4">
                         <Lock size={32} />
                         <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed italic">No archives detected in this node yet.</span>
                      </div>
                    ) : (
                      vaultItems.map((item, idx) => (
                        <motion.div 
                          key={item.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="relative aspect-[3/4] bg-white/5 rounded-2xl overflow-hidden border border-white/5 group"
                        >
                          <img 
                            src={proxyImg(item.content_url || '')} 
                            className={`w-full h-full object-cover transition-all duration-1000 ${!item.is_unlocked ? 'blur-2xl scale-110 opacity-40' : 'opacity-100'}`}
                            alt=""
                          />
                          {!item.is_unlocked && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-black/60 gap-3">
                              <Lock size={20} className="text-white/40" />
                              <button 
                                onClick={() => handleUnlock(item)}
                                disabled={isUnlocking}
                                className="w-full py-2.5 bg-white text-black text-[9px] font-black uppercase rounded-xl hover:bg-[#ffea00] transition-all active:scale-95 disabled:opacity-50 shadow-2xl"
                              >
                                {isUnlocking ? 'Syncing...' : `Unlock · ${item.price_credits || 6000}cr`}
                              </button>
                            </div>
                          )}
                          {item.is_unlocked && (
                             <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center">
                                <Check size={12} className="text-[#00f0ff]" />
                             </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {currentStepIdx === 2 && (
            <motion.div 
              key="offer"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 overflow-y-auto px-4 pt-8 pb-40 space-y-10 z-10 no-scrollbar"
            >
              <div className="text-center space-y-3 px-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-[9px] font-black uppercase tracking-[0.25em] text-red-500 mb-1">
                  <Lock size={10} />
                  <span>Session Terminated</span>
                </div>
                <h2 className="text-[32px] md:text-5xl font-black text-white leading-[0.9] tracking-tighter">
                  SESSION <span className="text-[#ff00ff]">EXPIRED</span>
                </h2>
                <p className="text-[13px] font-medium text-white/40 tracking-tight">Purchase credits to continue talking to {profile.name}.</p>
                <div className="flex items-center justify-center gap-2 mt-4 opacity-40 grayscale">
                   <div className="px-1.5 py-0.5 bg-white text-black text-[7px] font-black rounded-sm uppercase tracking-tighter">Stripe</div>
                   <span className="text-[8px] font-black uppercase tracking-widest text-white/80 italic">Protected Gateway</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
                {[
                  { id: 'tier_starter', label: 'Basic Pack', price: 4.99, credits: '5,000', bonus: '5,000' },
                  { id: 'tier_session', label: 'Prime Access', price: 24.99, credits: '30,000', bonus: '30,000', popular: true },
                  { id: 'tier_whale', label: 'Elite Status', price: 99.99, credits: '120,000', bonus: '120,000' },
                ].map((pkg) => (
                  <button 
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`relative p-5 rounded-3xl border transition-all duration-300 flex items-center justify-between ${selectedPkgId === pkg.id ? 'bg-[#ff00ff]/10 border-[#ff00ff] ring-2 ring-[#ff00ff]/30 shadow-[0_0_30px_rgba(255,0,255,0.2)]' : 'bg-white/5 border-white/10'}`}
                  >
                    <div className="flex flex-col gap-1 text-left">
                       <span className="text-[10px] font-black text-[#ff00ff] uppercase tracking-widest leading-none">{pkg.label}</span>
                       <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-white italic tracking-tighter leading-none">{pkg.credits}</span>
                          <span className="text-[7px] font-bold text-white/20 uppercase mt-1 tracking-tighter">Credits</span>
                       </div>
                       <div className="flex items-center gap-1.5 opacity-80">
                          <div className="w-1 h-1 rounded-full bg-[#00f0ff] animate-pulse" />
                          <span className="text-[8px] font-black text-[#00f0ff] uppercase tracking-tighter">+{pkg.bonus} $GASPai Match</span>
                       </div>
                       <div className="mt-1">
                          <span className="text-[7px] font-black text-white/40 uppercase tracking-widest italic">🌶️ Unlocks Private Vault</span>
                       </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                       <span className="text-[14px] font-black text-white italic">${pkg.price}</span>
                       <div className={`mt-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPkgId === pkg.id ? 'border-[#ff00ff] bg-[#ff00ff]' : 'border-white/20'}`}>
                          {selectedPkgId === pkg.id && <Check size={12} className="text-white" />}
                       </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* 🚀 SOVEREIGN CHECKOUT CTA */}
              <div className="sticky bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-[100] mt-8">
                 <button 
                   onClick={() => setIsTopUpOpen(true)}
                   className="w-full max-w-sm mx-auto flex items-center justify-center p-5 bg-[#ff00ff] border-2 border-white/20 rounded-[2rem] text-white text-[13px] font-black uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(255,0,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all group gap-3"
                 >
                    <span>Proceed to Secure Checkout</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TopUpDrawer 
        isOpen={isTopUpOpen} 
        onClose={() => setIsTopUpOpen(false)} 
        initialPackage={selectedPkgId || 'tier_session'} 
      />
    </div>
  );
}
