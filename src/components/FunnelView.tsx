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
import VoiceNoteBubble from './chat/VoiceNoteBubble';
import { SYNDICATE_CONFIG } from '@/lib/economy/monetizationConfig';
import { useUser } from './providers/UserProvider';

export default function FunnelView() {
  const { authenticated, login, profile: userProfile } = useUser();
  const [currentStepIdx, setCurrentStepIdx] = useState(0); // ⚡️ START AT LOADING
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<'NEURAL_LINK' | 'ARCHIVE'>('NEURAL_LINK');
  const [isLoaded, setIsLoaded] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState('tier_session');
  const [missionCount, setMissionCount] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [showStatusHub, setShowStatusHub] = useState(false);
  
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(599); // 9 minutes 59 seconds

  useEffect(() => {
    const interval = setInterval(() => {
       setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const formatTimeInfo = (seconds: number) => {
     const m = Math.floor(seconds / 60);
     const s = seconds % 60;
     return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 📈 LIVE FOMO TICKER SAMPLES
  const [fomoIndex, setFomoIndex] = useState(0);
  const fomoMessages = [
    'User_9389 just claimed his reward ⚡️',
    'Veronica just sent a 🌶️ link...',
    'Secure Vault Gateway Active',
    '348 Agents Viewing Archive',
    'LuckieLuke just joined the Syndicate'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setFomoIndex(prev => (prev + 1) % fomoMessages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
          if (data.success && data.items) {
             // 🧬 HARD DEDUPLICATION: Ensure unique Content URLs only
             const uniqueItems = Array.from(
               new Map(data.items.map((item: any) => [item.content_url, item])).values()
             );
             setVaultItems(uniqueItems);
          }
       } catch (e) {
          console.error('[Vault] Teaser Sync Error:', e);
       } finally { 
          setLoadingVault(false); 
       }
    };
    fetchVault();
  }, []);

  // 🖥️ PREMIUM BOOT SEQUENCE
  useEffect(() => {
    const logs = [
      "INITIALIZING SECURE UPLINK...", 
      "BYPASSING LOCAL RESTRICTIONS...", 
      "CONNECTING TO VERONICA'S HUB...",
      "IDENTITY CONFIRMED // GUEST_SESSION"
    ];
    let lIdx = 0;
    const lInt = setInterval(() => {
      if (lIdx < logs.length) {
        setTerminalLogs(prev => [...prev, logs[lIdx++]]);
      } else {
        setTimeout(() => {
          setCurrentStepIdx(1);
          localStorage.setItem('gasp_funnel_step', '1');
        }, 1000); // Transition to Chat
        clearInterval(lInt);
      }
    }, 1200); // Slightly slower to build tension
    return () => clearInterval(lInt);
  }, []);

  // 🛰️ MISSION PERSISTENCE SCANNER
  useEffect(() => {
    const checkStatus = async () => {
       const gid = localStorage.getItem('gasp_guest_id');
       if (!gid) return;
       try {
          const res = await fetch(`/api/economy/balance?userId=${gid}`);
          const data = await res.json();
          // If balance increased, show the "Level Up" Hub
          if (data.balance > 500 && !showStatusHub) {
             setMissionCount(Math.floor(data.balance / 2000));
             setShowStatusHub(true);
          }
       } catch (e) {}
    };

    const sInt = setInterval(checkStatus, 5000); 
    return () => clearInterval(sInt);
  }, [showStatusHub]);

  // 🧬 RESTORE PROGRESS
  useEffect(() => {
    const savedStep = localStorage.getItem('gasp_funnel_step');
    if (savedStep && !isNaN(parseInt(savedStep))) {
        const stepIdx = parseInt(savedStep);
        // Only restore if they were deep in the funnel
        if (stepIdx > 1) setCurrentStepIdx(stepIdx);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping, isRecording]);

  useEffect(() => {
    if (currentStepIdx === 1 && messages.length === 0) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setMessages([{
            id: 'm1',
            role: 'assistant',
            content: `hey... you probably saw me from that grocery store video huh 😭`,
            type: 'text'
          }]);
          setIsTyping(false);
          
          setTimeout(() => {
             setIsTyping(true);
             setTimeout(() => {
                setIsTyping(false);
                setMessages(prev => [...prev, {
                  id: 'm2',
                  role: 'assistant',
                  content: `I can't believe people actually find me on here lol. what's your name? 🙈`,
                  type: 'text'
                }]);
             }, 3000); 
          }, 800);
        }, 1400);
      }, 1000);
    }
  }, [currentStepIdx]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.media_url?.includes('veronica_4_close.wav') && !hasIntercepted.current && !isRecording) {
      hasIntercepted.current = true;
      
      setTimeout(() => {
         const leakId = 'leak_' + Date.now();
         setMessages(prev => [...prev, { 
           id: leakId, 
           role: 'assistant', 
           content: 'oops... i was just sending this to a friend 😭', 
           media_url: '/Promo/cucumber_tease.png',
           media_type: 'image',
           isUnsent: false
         }]);
         
         // ⏳ 4.5s Gaze Window
         setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === leakId ? { ...m, isUnsent: true, content: 'Message unsent', media_url: null } : m));
            
            setTimeout(() => {
               setIsTyping(true);
               setTimeout(() => {
                  setMessages(prev => [...prev, { 
                    id: 'fluster_' + Date.now(), 
                    role: 'assistant', 
                    content: 'OMG ignore ignore!! 😭 I didn’t mean to send that here... how do I delete it??' 
                  }]);
                  setIsTyping(false);

                  setTimeout(() => {
                     setIsTyping(true);
                     setTimeout(() => {
                        setMessages(prev => [...prev, { 
                          id: 'pivot_' + Date.now(), 
                          role: 'assistant', 
                          content: 'actually... since u saw it... i have way better ones in my private vault if u want the link? 🌶️' 
                        }]);
                        setIsTyping(false);

                        setTimeout(() => {
                           // 🧬 USE REAL VAULT ITEM (not promo) - pick 2nd item for variety
                           const teaseVaultItem = vaultItems.find((v: any) => v.content_url) || null;
                           setMessages(prev => [...prev, { 
                             id: 'tease_' + Date.now(), 
                             role: 'assistant', 
                             content: 'tease_module', 
                             isTease: true,
                             media_url: teaseVaultItem?.content_url || null,
                             vaultItemId: teaseVaultItem?.id || null
                           }]);
                           
                           // 🛑 FINAL BRIDGE TO CTA
                           setTimeout(() => { 
                             setCurrentStepIdx(2); 
                             localStorage.setItem('gasp_funnel_step', '2');
                           }, 7000);
                        }, 2500);
                     }, 3000);
                  }, 4000);
               }, 2000);
            }, 1500);
         }, 4500); 
      }, 5000); 
    }
  }, [messages, isRecording]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || currentStepIdx !== 1) return;
    const userMsg = { id: Date.now().toString(), role: 'user', content: inputValue };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue('');
    setTimeout(() => {
       setIsTyping(true);
       executeNeuralResponse(userMsg, newHistory);
    }, 1200);
  };

  const executeNeuralResponse = (userMsg: any, currentHistory: any[]) => {
    if (messages.length === 1) {
      const gid = localStorage.getItem('gasp_guest_id') || 'ANON';
      const attribution = JSON.parse(localStorage.getItem('gasp_attribution') || '{}');
      fetch('/api/economy/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: gid, action: 'guest_genesis' })
      }).catch(() => {});
      fetch('/api/rpc/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log-funnel-lead',
          payload: {
            guestId: gid,
            firstMessage: userMsg.content,
            source: attribution.source || 'direct',
            campaign: attribution.campaign || 'organic',
            creative: attribution.creative || 'none',
            personaId: 'veronica-medellin-locked'
          }
        })
      }).catch(() => {});
    }

    (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        setIsTyping(false);
        if (!controller.signal.aborted) controller.abort();
      }, 15000);

      try {
        const res = await fetch('/api/chat/funnel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            messages: (currentHistory || []).map(m => ({ 
              role: m.role || 'user', 
              content: m.content || '' 
            })),
            userId: typeof window !== 'undefined' ? localStorage.getItem('gasp_guest_id') : 'ANON',
            personaId: 'veronica-medellin-locked',
            isFunnel: true,
            userName: userName || userMsg?.content || 'sweetheart',
            source: 'funnel_ad'
          }),
        });

        // 🧠 IDENTITY SYNC: If this was the response to "whats your name?", save it
        if (!userName && messages.length <= 2) {
            setUserName(userMsg.content);
        }
        if (!res.ok) {
           setIsTyping(false);
           return;
        }
        clearTimeout(timeoutId);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let lineBuffer = '';
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            lineBuffer += decoder.decode(value, { stream: true });
            const lines = lineBuffer.split('\n');
            lineBuffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('0:')) {
                try { 
                  const textContent = line.substring(2).trim();
                  if (!textContent) continue;
                  const text = JSON.parse(textContent); 
                  setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last?.role === 'assistant' && !last.isTease) {
                      return [...prev.slice(0, -1), { ...last, content: text }];
                    }
                    return [...prev, { id: 'v-' + Date.now(), role: 'assistant', content: text, type: 'text' }];
                  });
                } catch (e) {}
              } else if (line.startsWith('d:')) {
                try {
                  const data = JSON.parse(line.substring(2));
                  if (data.type === 'voice_note' && data.audioUrl) {
                     // 🎙️ VOICE NOTE SEQUENCE: Show recording indicator then attach audio
                     setIsTyping(false);
                     setIsRecording(true);
                     setTimeout(() => {
                        setIsRecording(false);
                        setMessages(prev => {
                           const last = prev[prev.length - 1];
                           if (last?.role === 'assistant') {
                             return [...prev.slice(0, -1), { ...last, media_url: data.audioUrl, type: 'voice' }];
                           }
                           // If no message yet, create one
                           return [...prev, { id: 'voice-' + Date.now(), role: 'assistant', content: '...', media_url: data.audioUrl, type: 'voice' }];
                        });
                     }, 2800);
                  }
                } catch (e) {}
              }
            }
          }
        }
      } catch (err: any) {
        setIsTyping(false);
      } finally {
        setIsTyping(false);
      }
    })();
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-black text-white font-outfit overflow-hidden flex items-center justify-center relative">
      <div className="fixed inset-0 z-0">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className={`w-full h-full object-cover transition-all duration-1000 ${currentStepIdx === 0 ? 'blur-3xl' : 'blur-xl opacity-40'}`}
        >
          <source src="/Promo/Veronica.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/90 to-black" />
      </div>

      <main className="relative z-10 w-full max-w-[500px] h-[100dvh] md:h-[94vh] md:max-h-[900px] flex flex-col bg-black/70 backdrop-blur-3xl md:rounded-[3rem] border-x md:border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden">
        {/* 🛸 SOVEREIGN HEADER */}
        <div className="shrink-0 pt-10 pb-4 px-6 md:px-10 flex flex-col gap-5 border-b border-white/5 bg-black/40 relative">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">NEURAL LINK ESTABLISHED</span>
              <span className="text-[20px] font-black text-[#ffea00] italic leading-none tracking-tighter w-20">
                {formatTimeInfo(timeLeft)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {!authenticated && (
                <button 
                  onClick={() => login()}
                  className="px-3 py-1.5 rounded-full bg-[#ffea00] border border-[#ffea00] flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,234,0,0.3)] group"
                >
                  <Shield size={10} className="text-black" />
                  <span className="text-[9px] font-black text-black tracking-[0.1em]">SECURE ACCOUNT</span>
                </button>
              )}
              {authenticated && (
                <div className="flex items-center gap-2">
                   <div className="px-3 py-1.5 rounded-full bg-white/5 border border-[#00ffcc]/30 flex items-center gap-2">
                     <CheckCircle2 size={10} className="text-[#00ffcc]" />
                     <span className="text-[9px] font-black text-[#00ffcc] tracking-[0.1em]">VERIFIED</span>
                   </div>
                   <button 
                     onClick={() => window.location.href = '/'}
                     className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-white/40 hover:text-white transition-colors"
                   >
                     EXPLORE HUB 🛰️
                   </button>
                </div>
              )}
              <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] animate-pulse" />
                <span className="text-[9px] font-black text-white tracking-[0.1em]">14 Online</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.span 
                  key={fomoIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-[9px] font-black text-[#ff00ff] uppercase tracking-[0.2em]"
                >
                  {fomoMessages[fomoIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* 🧬 PROFILE BAR */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#ff00ff]/40 p-0.5 shadow-[0_0_20px_rgba(255,0,255,0.2)]">
                <div className="w-full h-full rounded-full overflow-hidden border border-white/20">
                  <img src="/Promo/PromoPic1.png" className="w-full h-full object-cover object-top" alt="Veronica" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-black text-white uppercase italic tracking-wide">VERONICA</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00ffcc]" />
                </div>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">MEDELLÍN</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsTopUpOpen(true)}
                className="px-4 py-2 bg-[#ffea00] rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(255,234,0,0.3)] hover:scale-105 transition-all"
              >
                <Zap size={14} className="fill-black text-black" />
                <span className="text-[10px] font-black text-black uppercase tracking-widest leading-none">TOP UP</span>
              </button>
            </div>
          </div>

          {/* ⚡️ TABS */}
          <div className="flex items-center gap-8 mt-2">
            <button className="relative pb-2" onClick={() => setActiveTab('NEURAL_LINK')}>
              <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${activeTab === 'NEURAL_LINK' ? 'text-[#ff00ff]' : 'text-white/30'}`}>CHAT</span>
              {activeTab === 'NEURAL_LINK' && <motion.div layoutId="tab-u" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff00ff]" />}
            </button>
            <button className="relative pb-2" onClick={() => setActiveTab('ARCHIVE')}>
              <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${activeTab === 'ARCHIVE' ? 'text-[#ff00ff]' : 'text-white/30'}`}>ARCHIVE</span>
              {activeTab === 'ARCHIVE' && <motion.div layoutId="tab-u" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff00ff]" />}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {currentStepIdx === 0 && (
              <motion.div 
                key="loading" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0, scale: 1.1 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-12 z-50 bg-black/40 backdrop-blur-xl"
              >
                <div className="relative w-48 h-48 mb-12">
                   <motion.div 
                     animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                     transition={{ duration: 2, repeat: Infinity }}
                     className="absolute inset-0 rounded-full bg-[#ffea00]/20 border border-[#ffea00]/40 blur-2xl"
                   />
                   <div className="absolute inset-0 rounded-full border-2 border-[#ffea00]/10 flex items-center justify-center">
                      <Zap size={48} className="text-[#ffea00] animate-pulse" />
                   </div>
                   <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <motion.circle
                        cx="96" cy="96" r="90"
                        stroke="#ffea00"
                        strokeWidth="2"
                        fill="transparent"
                        strokeDasharray="565"
                        initial={{ strokeDashoffset: 565 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 5, ease: "linear" }}
                      />
                   </svg>
                </div>
                
                <div className="space-y-4 text-center">
                   <h2 className="text-[12px] font-black uppercase tracking-[0.5em] text-[#ffea00] italic">
                      Establishing Secure Node
                   </h2>
                   <div className="flex flex-col gap-2">
                      {terminalLogs.slice(-2).map((log, i) => (
                        <motion.p 
                          key={log + i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-[9px] font-mono text-white/40 uppercase tracking-widest"
                        >
                          {log}
                        </motion.p>
                      ))}
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'NEURAL_LINK' && currentStepIdx === 1 && (
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
                  className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide pb-24"
                >
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="aspect-[3/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative group">
                      <img src="/Promo/PromoPic1.png" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Promo" />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="aspect-[3/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative group">
                      <img src="/Promo/PromoPic2.webp" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Promo" />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                    </motion.div>
                  </div>

                  {messages.map((m) => (
                    <motion.div key={m.id} initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                      {m.isTease ? (
                        <div 
                          onClick={() => {
                            setCurrentStepIdx(2);
                            localStorage.setItem('gasp_funnel_step', '2');
                          }}
                          className="w-full max-w-[85%] bg-white/5 border border-[#ffea00]/30 rounded-3xl p-4 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer hover:bg-white/[0.07] transition-all group"
                        >
                           <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 rounded-full bg-[#ffea00]/20 flex items-center justify-center group-hover:bg-[#ffea00]/40 transition-colors">
                               <Sparkles size={16} className="text-[#ffea00]" />
                             </div>
                             <span className="text-[10px] font-black text-[#ffea00] uppercase tracking-widest">Incoming Private Preview...</span>
                           </div>
                           <div className="aspect-[4/5] rounded-2xl bg-white/10 overflow-hidden relative">
                              <img 
                                src={m.media_url ? proxyImg(m.media_url) : (vaultItems[0]?.content_url ? proxyImg(vaultItems[0].content_url) : "/Promo/PromoPic1.png")} 
                                className="w-full h-full object-cover blur-[22px] scale-110 group-hover:scale-105 transition-transform duration-[2s]" 
                                alt="Special Tease" 
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
                                 <Lock size={32} className="text-[#ffea00] mb-3 animate-pulse group-hover:scale-110 transition-transform" />
                                 <span className="text-[14px] font-black text-white italic lowercase">view full archive</span>
                                 <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-2 px-4 shadow-xl">CLICK TO UNLOCK ACCESS</span>
                              </div>
                           </div>
                        </div>
                      ) : (
                         <div className={`flex flex-col gap-2 w-full ${m.role === 'assistant' ? 'items-start' : 'items-end'}`}>
                             {m.content && (
                               <div className={`max-w-[85%] px-6 py-4 rounded-[2rem] text-[16px] leading-relaxed relative ${m.role === 'assistant' ? 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none font-medium' : 'bg-[#ffea00] text-black font-black rounded-tr-none shadow-[0_10px_30px_rgba(255,234,0,0.2)]'} ${m.isUnsent ? 'opacity-30 italic font-normal text-[12px] py-2 px-4' : ''}`}>
                                 {m.content}
                               </div>
                             )}
                             {m.media_url && !m.isUnsent && (
                                <div className="w-full max-w-[90%]">
                                   {m.media_type === 'image' ? (
                                     <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative aspect-[4/5] bg-white/5">
                                        <img src={m.media_url} className="w-full h-full object-cover" alt="Media" />
                                     </motion.div>
                                   ) : (
                                     <VoiceNoteBubble 
                                       audioUrl={m.media_url} 
                                       profileImage="/Promo/Veronica_Profile.png" 
                                       profileName="Veronica" 
                                       translation={m.audio_translation} 
                                       isUnlocked={true} 
                                       isEnglish={true} 
                                       onUnlockTranslation={async () => true} 
                                     />
                                   )}
                                </div>
                             )}
                         </div>
                      )}
                    </motion.div>
                  ))}
                  {(isTyping || isRecording) && (
                    <div className="flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                       <div className="w-8 h-8 rounded-full border border-white/5 overflow-hidden shrink-0 mt-1 relative">
                          <img src={profile.image} className="w-full h-full object-cover blur-[1px]" alt="" />
                       </div>
                       <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl rounded-tl-none flex items-center gap-3">
                          <div className="flex gap-1">
                             <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-[#ff00ff]' : 'bg-[#00f0ff]'}`} />
                             <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-[#ff00ff]' : 'bg-[#00f0ff]'}`} />
                             <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-[#ff00ff]' : 'bg-[#00f0ff]'}`} />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest italic ${isRecording ? 'text-[#ff00ff]' : 'text-[#00f0ff]'}`}>
                             {isRecording ? 'Recording voice note...' : 'Veronica is typing...'}
                          </span>
                       </div>
                    </div>
                  )}
                </div>

                {/* ⌨️ INPUT AREA */}
                <div className="px-6 py-6 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-4">
                  <div className="flex items-center justify-center gap-3">
                    <button 
                      onClick={() => setCurrentStepIdx(2)}
                      className="flex-1 py-3 bg-[#ffea00]/10 border border-[#ffea00]/30 rounded-2xl flex items-center justify-center gap-2 group hover:bg-[#ffea00]/20 transition-all"
                    >
                       <Zap size={14} className="fill-[#ffea00] text-[#ffea00] group-hover:animate-pulse" />
                       <span className="text-[10px] font-black text-white uppercase tracking-widest italic tracking-tighter">EARN FREE CREDITS</span>
                    </button>
                    <button 
                      onClick={() => setIsTopUpOpen(true)}
                      className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-white/40 hover:text-white transition-all"
                    >
                       <CreditCard size={14} />
                       <span className="text-[10px] font-black uppercase tracking-widest italic tracking-tighter italic">BUY INSTANT</span>
                    </button>
                  </div>
                  <form onSubmit={handleSendMessage} className="relative group max-w-[500px] mx-auto w-full">
                    <div className="relative flex items-center gap-3 bg-[#131313] p-1.5 rounded-[3rem] border border-white/10 backdrop-blur-3xl">
                      <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Type a flirty reply..." className="flex-1 bg-transparent border-none px-6 text-[15px] text-white placeholder:text-white/20 focus:outline-none focus:ring-0 font-bold" />
                      <button type="submit" className="w-12 h-12 bg-[#ffea00] rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,234,0,0.3)] hover:scale-105 active:scale-95 transition-all">
                        <Send size={18} />
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'ARCHIVE' && currentStepIdx === 1 && (
               <motion.div key="archive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto p-6 scrollbar-hide pb-32">
                  <div className="grid grid-cols-2 gap-3">
                    {vaultItems.length > 0 ? vaultItems.map((item) => (
                      <div key={item.id} className="aspect-[3/4] rounded-3xl bg-white/5 border border-white/10 overflow-hidden relative group">
                        <img src={item.content_url} className="w-full h-full object-cover blur-2xl opacity-40" alt="Locked" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-4 text-center">
                           <Lock size={20} className="text-[#ffea00] mb-2" />
                           <span className="text-[10px] font-black text-white uppercase tracking-tighter italic">Unlocked with 6,000 Credits</span>
                           <button onClick={() => setCurrentStepIdx(2)} className="mt-4 px-4 py-2 bg-[#ffea00] text-black text-[9px] font-black rounded-full uppercase">CLICK TO START MISSION</button>
                        </div>
                      </div>
                    )) : [1,2,3].map(n => <div key={n} className="aspect-[3/4] rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center opacity-20"><Lock size={16} /></div>)}
                  </div>
               </motion.div>
            )}

            {currentStepIdx === 2 && (
              <motion.div key="wall" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto scrollbar-hide pb-20">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00ffcc]/10 to-transparent border border-[#00ffcc]/30 p-4">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ffcc] to-[#33ffaa] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,204,0.3)]">
                        <span className="text-xl">🎁</span>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-[#00ffcc] uppercase tracking-widest leading-none mb-1">YOUR FIRST GIFT</h4>
                        <div className="text-[20px] font-black text-white italic leading-none">+500 CREDITS</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] font-bold text-white/40 uppercase tracking-tighter leading-none mb-1">NEED</div>
                      <div className="text-[14px] font-black text-[#ffea00] italic leading-none">5,500 MORE</div>
                    </div>
                  </div>
                </div>

                <div className="text-center py-2">
                  <h2 className="text-[26px] font-black text-white uppercase italic tracking-tighter leading-none flex items-center justify-center gap-2">CLAIM SITEWIDE CREDITS <span className="text-2xl">⚡️</span></h2>
                  <p className="text-[10px] font-black text-[#ffea00] uppercase tracking-[0.2em] mt-2">COMPLETE 3 EASY MISSIONS TO EARN 6,000G ON GASP.FUN</p>
                </div>

                <motion.button 
                  animate={{ 
                    scale: [1, 1.02, 1],
                    boxShadow: [
                      "0 0 0px rgba(255, 234, 0, 0)", 
                      "0 0 25px rgba(255, 234, 0, 0.4)", 
                      "0 0 0px rgba(255, 234, 0, 0)"
                    ] 
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  onClick={() => { const tid = localStorage.getItem('gasp_guest_id') || 'G'; window.open(SYNDICATE_CONFIG.getSmartLink(tid), '_blank'); }}
                  className={`w-full p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all group relative overflow-hidden ${missionCount >= 3 ? 'bg-[#00ffcc] border-[#00ffcc] text-black' : 'bg-white/5 border-[#ffea00]/60 text-white shadow-[0_0_30px_rgba(255,234,0,0.15)]'}`}
                >
                  <div className="flex items-center gap-2">
                    <Zap size={18} className={missionCount >= 3 ? "fill-black" : "text-[#ffea00]"} />
                    <span className="text-[18px] font-black uppercase italic tracking-tighter">CLICK TO START FREE CREDIT MISSION</span>
                    <ArrowRight size={18} className="opacity-40 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest text-[#00ffcc]">REDEEM SITEWIDE • NO PAYMENT REQUIRED</span>
                </motion.button>

                <div className="pt-2 space-y-4">
                  <button
                    onClick={async () => {
                      const gid = localStorage.getItem('gasp_guest_id') || '';
                      const res = await fetch(`/api/economy/balance?userId=${gid}`);
                      const data = await res.json();
                      if (data.success && data.balance >= 6000) setCurrentStepIdx(3);
                      else alert(`Not enough credits yet! Complete the 3 missions above to claim your 6,000G reward.`);
                    }}
                    className="w-full py-4 border border-white/10 rounded-2xl text-[12px] font-black text-white/50 uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
                  >
                    <Shield size={14} /> VERIFY & CLAIM CREDITS
                  </button>

                  <div className="text-center space-y-4 pt-2">
                    <div className="flex flex-col gap-3">
                      <button onClick={() => { setSelectedPkgId('tier_starter'); setIsTopUpOpen(true); }} className="group">
                        <span className="text-[11px] font-black text-[#00ffcc] uppercase tracking-[0.2em] group-hover:text-white transition-colors border-b border-[#00ffcc]/20 pb-1">OR GET STARTER ACCESS — $4.99</span>
                      </button>
                      <button onClick={() => { setSelectedPkgId('tier_entry'); setIsTopUpOpen(true); }} className="group">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] group-hover:text-[#ffea00] transition-colors">FULL MEMBER ACCESS — $19.99</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-center gap-3 opacity-10 pt-4">
                      <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white">GASP.FUN ECOSYSTEM SECURE</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStepIdx === 3 && (
               <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-black flex flex-col items-center justify-center p-10 text-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-[#ffea00]/10 border-2 border-[#ffea00]/40 flex items-center justify-center shadow-[0_0_40px_rgba(255,234,0,0.2)]">
                    <CheckCircle2 size={40} className="text-[#ffea00]" />
                  </div>
                  <h2 className="text-3xl font-black italic uppercase leading-tight">Credits Claimed! 🎉</h2>
                  <div className="w-full p-5 bg-[#ff0000]/10 border border-[#ff0000]/30 rounded-3xl text-left">
                    <p className="text-[11px] font-black text-[#ff4444] uppercase tracking-wider mb-1">⚠️ Your credits will expire</p>
                    <p className="text-[13px] text-white/80 leading-relaxed">Guest credits are temporary. <span className="text-white font-black">Create a free account</span> to save them permanently.</p>
                  </div>
                  <button onClick={() => window.location.href = '/auth/signup'} className="w-full h-16 bg-[#ffea00] text-black font-black rounded-[3rem] shadow-[0_10px_40px_rgba(255,234,0,0.3)] hover:scale-[1.02] transition-all">SIGN UP FREE</button>
               </motion.div>
            )}
          </AnimatePresence>

          {/* 🛰️ MISSION STATUS HUB OVERLAY */}
          <AnimatePresence>
            {showStatusHub && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
              >
                <div className="w-full max-w-[400px] bg-gradient-to-b from-white/10 to-transparent border border-white/20 rounded-[3rem] p-8 text-center space-y-6 relative overflow-hidden">
                   <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00ffcc] to-transparent animate-pulse" />
                   
                   <div className="flex justify-center">
                      <div className="w-20 h-20 rounded-full bg-[#00ffcc]/20 flex items-center justify-center border border-[#00ffcc]/40">
                         <Zap size={40} className="text-[#00ffcc] fill-[#00ffcc] animate-pulse" />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <h3 className="text-[24px] font-black text-white italic uppercase tracking-tighter">Neural Sync Verified</h3>
                      <p className="text-[12px] font-bold text-white/40 uppercase tracking-widest">Syndicate Credits Provisioned</p>
                   </div>

                   <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                      <div className="text-left">
                         <span className="block text-[10px] font-black text-[#ffea00] uppercase tracking-widest leading-none mb-1">CURRENT STATUS</span>
                         <span className="text-[18px] font-black text-white italic uppercase">{missionCount}/3 MISSIONS COMPLETED</span>
                      </div>
                      <div className="w-12 h-12 rounded-full border-2 border-[#00ffcc] flex items-center justify-center text-[#00ffcc] font-black italic">
                         {Math.round((missionCount / 3) * 100)}%
                      </div>
                   </div>

                   <button 
                     onClick={() => setShowStatusHub(false)}
                     className="w-full py-5 bg-[#00ffcc] text-black font-black text-[16px] rounded-2xl uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,255,204,0.3)]"
                   >
                     Continue Next Mission
                   </button>
                   
                   <button 
                     onClick={() => { setShowStatusHub(false); setCurrentStepIdx(1); }}
                     className="w-full text-[10px] font-black text-white/30 uppercase tracking-[0.3em] hover:text-white transition-colors"
                   >
                     Back to Neural Link
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
