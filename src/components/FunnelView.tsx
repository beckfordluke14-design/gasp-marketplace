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

export default function FunnelView() {
  const [currentStepIdx, setCurrentStepIdx] = useState(1); // ⚡️ START DIRECTLY AT CHAT
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
  }, [messages, isTyping, isRecording]);

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
            type: 'text'
          }]);
          setIsTyping(false);
          
          setTimeout(() => {
             setIsRecording(true);
             setTimeout(() => {
                setIsRecording(false);
                setMessages(prev => [...prev, {
                  id: 'm2',
                  role: 'assistant',
                  content: `I can't believe people actually find me on here lol. what's your name? 🙈🍑`,
                  type: 'text'
                }]);
             }, 3000); // 🧬 Simulate 3s typing/presence
          }, 800);
        }, 1400);
      }, 1000);
    }
  }, [currentStepIdx]);

  // 🧬 FUNNEL ORCHESTRATOR: Watch for the final neural heartbeat to trigger the conversion wall
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.media_url?.includes('veronica_4_close.wav') && !hasIntercepted.current && !isRecording) {
      hasIntercepted.current = true;
      
      // 🥒 STAGE 1: The "Accidental" Leak (Blurred Vault Tease)
      setTimeout(() => {
         setMessages(prev => [...prev, { 
           id: 'leak_' + Date.now(), 
           role: 'assistant', 
           content: 'oops... i was just sending this to a friend 😭', 
           media_url: '/Promo/cucumber_tease.png',
           media_type: 'image'
         }]);
         
         // 🌡️ STAGE 2: The Pivot (Flirty Text)
         setTimeout(() => {
            setIsTyping(true);
            setTimeout(() => {
               setMessages(prev => [...prev, { 
                 id: 'pivot_' + Date.now(), 
                 role: 'assistant', 
                 content: 'actually... since u saw that... i have way better ones in my private vault if u want the link? 🌶️' 
               }]);
               setIsTyping(false);

               // 🍑 STAGE 3: The High-Value Tease (Real Blurred Vault Asset)
               setTimeout(() => {
                  setMessages(prev => [...prev, { 
                    id: 'tease_' + Date.now(), 
                    role: 'assistant', 
                    content: 'tease_module', 
                    isTease: true,
                    // Pass the real asset URL if we have one
                    media_url: vaultItems.length > 0 ? vaultItems[0].content_url : null
                  }]);
                  
                  // Final move to the wall
                  setTimeout(() => { setCurrentStepIdx(2); }, 6000);
               }, 3000);
            }, 2000);
         }, 3000);
      }, 2000); 
    }
  }, [messages, isRecording]);


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || currentStepIdx !== 1) return;
    const userMsg = { id: Date.now().toString(), role: 'user', content: inputValue };
    
    // 👤 User Send
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    
    // 🛡️ "READING" DELAY: 1.2s Pause before she even starts typing
    setTimeout(() => {
       setIsTyping(true);
       executeNeuralResponse(userMsg);
    }, 1200);
  };

  const executeNeuralResponse = (userMsg: any) => {

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
    
    // The AI Engine now handles the conversation dynamically.
    // Transition to the wall is handled by the useEffect watching for the final voice note.

    (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        setIsTyping(false);
        controller.abort();
      }, 15000); // 🛡️ NEURAL WATCHDOG: 15s Guard

      try {
        const currentMessages = [...messages, userMsg];
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            messages: currentMessages,
            userId: localStorage.getItem('gasp_guest_id'),
            personaId: 'veronica-medellin-locked',
            isFunnel: true,
            systemInstruction: `You are Veronica, a 23-year-old from Medellín. 
            - Text like a real girl: short messages, lowercase, emojis.
            - You brought up the grocery store video first. Be flirty and naturally curious.
            - If you don't know his name yet, ask it. 
            - Call him "papi" naturally in your text.`,
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
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('0:')) {
                setIsTyping(false); // 🧬 TEXT ARRIVED: Safe to stop typing
                clearTimeout(timeoutId);
                try { 
                  const text = JSON.parse(line.substring(2)); 
                  setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last?.role === 'assistant' && !last.isTease) {
                      return [...prev.slice(0, -1), { 
                        ...last, 
                        content: text
                      }];
                    }
                    return [...prev, { 
                      id: 'v-' + Date.now(), 
                      role: 'assistant', 
                      content: text,
                      type: 'text'
                    }];
                  });
                } catch (e) {}
              } else if (line.startsWith('d:')) {
                 try {
                   const asset = JSON.parse(line.substring(2));
                   if (asset.type === 'voice_note' && asset.audioUrl) {
                      // 🎙️ SIMULATED RECORDING: Hold the state to make it look real
                      setIsTyping(false);
                      setIsRecording(true);
                      
                      setTimeout(() => {
                         setIsRecording(false);
                         setMessages(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.role === 'assistant') {
                              return [...prev.slice(0, -1), { ...last, media_url: asset.audioUrl, type: 'voice' }];
                            }
                            return prev;
                         });
                         clearTimeout(timeoutId);
                      }, 2500 + Math.random() * 2000); 
                   }
                 } catch {}
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') { console.warn('[Funnel] Stream Timed Out (15s Neural Watchdog)'); }
        setIsTyping(false);
      } finally {
        setIsTyping(false);
      }
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
        {/* 🛸 SOVEREIGN HEADER: ASSET 01 */}
        <div className="shrink-0 pt-10 pb-4 px-6 md:px-10 flex flex-col gap-5 border-b border-white/5 bg-black/40 relative">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">NEURAL LINK ESTABLISHED</span>
              <span className="text-[20px] font-black text-[#ffea00] italic leading-none tracking-tighter">09:53:57</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] animate-pulse" />
                <span className="text-[9px] font-black text-white tracking-[0.1em]">14 Online</span>
              </div>
              <span className="text-[9px] font-black text-[#ff00ff] uppercase tracking-[0.2em]">SOVEREIGN SESSION ACTIVE</span>
            </div>
          </div>

          {/* 🧬 PROFILE BAR */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#ff00ff]/40 p-0.5 shadow-[0_0_20px_rgba(255,0,255,0.2)]">
                <div className="w-full h-full rounded-full overflow-hidden border border-white/20">
                  <img src="/Promo/PromoPic1.png" className="w-full h-full object-cover" alt="Veronica" />
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
            <div className="flex items-center gap-4 text-white/40">
              <Mic size={18} />
              <HeartPulse size={18} />
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
            {currentStepIdx === 2 && <motion.div key="glitch" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], x: [0, -10, 10, 0] }} className="absolute inset-0 z-[500] bg-[#ff00ff]/10 mix-blend-overlay pointer-events-none" />}
            
            {currentStepIdx === 0 && (
              <motion.div key="init" className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
                 <Loader2 className="text-[#ff00ff] animate-spin" size={40} />
                 <div className="font-mono text-[9px] text-white/20 space-y-1">{terminalLogs.map((log, i) => <div key={i}>{log}</div>)}</div>
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
                  {/* ... existing gallery and messages logic ... */}
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
                        <div className="w-full max-w-[85%] bg-white/5 border border-[#ffea00]/30 rounded-3xl p-4 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                           <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 rounded-full bg-[#ffea00]/20 flex items-center justify-center">
                               <Sparkles size={16} className="text-[#ffea00]" />
                             </div>
                             <span className="text-[10px] font-black text-[#ffea00] uppercase tracking-widest">Incoming Private Preview...</span>
                           </div>
                           <div className="aspect-[4/5] rounded-2xl bg-white/10 overflow-hidden relative group">
                              <img 
                                src={m.media_url ? proxyImg(m.media_url) : (vaultItems[0]?.content_url ? proxyImg(vaultItems[0].content_url) : "/Promo/PromoPic1.png")} 
                                className="w-full h-full object-cover blur-[22px] scale-110" 
                                alt="Special Tease" 
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
                                 <Lock size={32} className="text-[#ffea00] mb-3 animate-pulse" />
                                 <span className="text-[14px] font-black text-white italic lowercase">media intercepted</span>
                                 <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-2">{profile.name} ACCESS ONLY</span>
                              </div>
                           </div>
                        </div>
                      ) : (
                         <div className={`flex flex-col gap-2 w-full ${m.role === 'assistant' ? 'items-start' : 'items-end'}`}>
                             {m.content && m.content !== '...' && m.content !== '' && (
                               <div className={`max-w-[85%] px-6 py-4 rounded-[2rem] text-[16px] leading-relaxed relative ${m.role === 'assistant' ? 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none font-medium' : 'bg-[#ffea00] text-black font-black rounded-tr-none shadow-[0_10px_30px_rgba(255,234,0,0.2)]'}`}>
                                 {m.content}
                               </div>
                             )}
                             {m.media_url && (
                                <div className="w-full max-w-[90%]">
                                   {m.media_type === 'image' ? (
                                     <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative aspect-[4/5] bg-white/5">
                                        <img src={m.media_url} className="w-full h-full object-cover" alt="Media" />
                                     </motion.div>
                                   ) : (
                                     <VoiceNoteBubble audioUrl={m.media_url} profileImage={profile.image} profileName={profile.name} translation={m.audio_translation} isUnlocked={true} isEnglish={true} onUnlockTranslation={async () => true} />
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
                <div className="px-6 py-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <form onSubmit={handleSendMessage} className="relative group max-w-[500px] mx-auto">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#ff00ff]/20 to-[#00f0ff]/20 rounded-[2rem] blur opacity-30 group-focus-within:opacity-100 transition duration-1000"></div>
                    <div className="relative flex items-center gap-3 bg-[#1a1a1a] p-2 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-2xl">
                      <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Type your reply..." className="flex-1 bg-transparent border-none px-6 text-[15px] text-white placeholder:text-white/20 focus:outline-none focus:ring-0 font-bold" />
                      <button type="submit" className="w-12 h-12 bg-[#ff00ff] rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,0,255,0.4)] hover:scale-105 active:scale-95 transition-all outline-none">
                        <Send size={18} />
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'ARCHIVE' && currentStepIdx === 1 && (
               <motion.div 
                 key="archive-grid" 
                 initial={{ opacity: 0, scale: 0.95 }} 
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="flex-1 overflow-y-auto p-6 scrollbar-hide pb-32"
               >
                  <div className="grid grid-cols-2 gap-3">
                    {[1,2,3,4,5,6].map((i) => (
                      <div key={i} className="aspect-[3/4] rounded-3xl bg-white/5 border border-white/10 overflow-hidden relative group">
                        <img src={`/Promo/PromoPic${(i%3)+1}.${i%2===0?'webp':'png'}`} className="w-full h-full object-cover blur-2xl opacity-40" alt="Locked" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-4 text-center">
                           <Lock size={20} className="text-[#ffea00] mb-2" />
                           <span className="text-[10px] font-black text-white uppercase tracking-tighter">unlocked via</span>
                           <span className="text-[14px] font-black text-[#ffea00] italic">Verification</span>
                           <button 
                             onClick={() => setCurrentStepIdx(2)}
                             className="mt-4 px-4 py-2 bg-[#ffea00] text-black text-[9px] font-black rounded-full uppercase tracking-widest shadow-[0_5px_15px_rgba(255,234,0,0.3)] active:scale-95 transition-all"
                           >
                              Start Mission
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 p-6 rounded-3xl bg-[#ff00ff]/5 border border-[#ff00ff]/20 text-center">
                    <p className="text-[11px] font-black text-[#ff00ff] uppercase tracking-[0.2em] mb-2">Notice</p>
                    <p className="text-[13px] text-white/50 leading-relaxed italic">"help me out papi... verify u aren't a bot so my archive doesn't get shut down 😭🙏"</p>
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
                     <div className="flex items-center justify-between mb-2 px-2">
                        <span className="text-[8px] font-black text-[#00f0ff] tracking-[0.4em] uppercase italic">REWARD INFUSION MATRIX</span>
                        {missionCount > 0 && (
                          <span className="text-[10px] font-black text-[#ffea00] animate-pulse">
                             PROGRESS: {missionCount}/3 MISSIONS
                          </span>
                        )}
                     </div>
                     
                     <div className="grid grid-cols-1 gap-3">
                        {/* BASIC TASK */}
                        <button 
                          onClick={() => {
                            const tid = localStorage.getItem('gasp_guest_id') || 'G';
                            window.open(SYNDICATE_CONFIG.getSmartLink(tid), '_blank');
                            setMissionCount(prev => Math.min(3, prev + 1));
                          }}
                          className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-[#ffea00]/30 transition-all text-left"
                        >
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-[#ffea00] uppercase tracking-widest">Entry Verification</span>
                              <span className="text-lg font-black text-white italic">2,500 - 5,000 Credits</span>
                           </div>
                           <div className="px-3 py-1 bg-[#ffea00]/10 border border-[#ffea00]/30 rounded-lg text-[#ffea00] text-[10px] font-black uppercase tracking-widest">
                             {missionCount >= 1 ? 'COMPLETED' : 'START'}
                           </div>
                        </button>

                        {/* ADVANCED TASK */}
                        <button 
                          onClick={() => {
                            const tid = localStorage.getItem('gasp_guest_id') || 'G';
                            window.open(SYNDICATE_CONFIG.getSmartLink(tid), '_blank');
                            setMissionCount(prev => Math.min(3, prev + 1));
                          }}
                          className="p-4 rounded-2xl bg-white/5 border border-white/20 flex items-center justify-between group hover:border-[#00f0ff]/30 transition-all scale-[1.02] shadow-[0_0_30px_rgba(0,240,255,0.05)] border-l-[#00f0ff] border-l-2 text-left"
                        >
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-[#00f0ff] uppercase tracking-widest">High-Intent Survey</span>
                              <span className="text-lg font-black text-white italic">12,000 - 25,000 Credits</span>
                           </div>
                           <div className="px-3 py-1 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-lg text-[#00f0ff] text-[10px] font-black uppercase tracking-widest">
                             {missionCount >= 2 ? 'COMPLETED' : 'POPULAR'}
                           </div>
                        </button>

                        {/* INSTITUTIONAL TASK */}
                        <button 
                          onClick={() => {
                            const tid = localStorage.getItem('gasp_guest_id') || 'G';
                            window.open(SYNDICATE_CONFIG.getSmartLink(tid), '_blank');
                            setMissionCount(prev => Math.min(3, prev + 1));
                          }}
                          className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-[#ff00ff]/30 transition-all text-left"
                        >
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-[#ff00ff] uppercase tracking-widest">System Optimization</span>
                              <span className="text-lg font-black text-white italic">50,000+ Credits</span>
                           </div>
                           <div className="px-3 py-1 bg-[#ff00ff]/10 border border-[#ff00ff]/30 rounded-lg text-[#ff00ff] text-[10px] font-black uppercase tracking-widest">
                             {missionCount >= 3 ? 'COMPLETED' : 'ELITE'}
                           </div>
                        </button>
                     </div>

                     {/* Progress Status */}
                     <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                           <span className="text-white/40">Unlock Progress</span>
                           <span className={missionCount >= 3 ? 'text-[#00ffcc]' : 'text-[#ffea00]'}>{missionCount}/3 Missions Done</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${(missionCount / 3) * 100}%` }}
                             className="h-full bg-gradient-to-r from-[#ffea00] to-[#00f0ff]"
                           />
                        </div>
                        <p className="text-[9px] text-white/30 text-center mt-3 uppercase tracking-tighter">
                          {missionCount < 3 ? `Complete ${3 - missionCount} more missions to unlock your credits permanently` : 'All missions complete! Tap below to verify your signal.'}
                        </p>
                     </div>
                  </div>
                </div>

                {/* ⚡️ ACTION AREA */}
                <div className="shrink-0 p-6 md:p-10 bg-black/80 border-t border-white/5 backdrop-blur-xl flex flex-col items-center gap-4 relative">
                   <button 
                     onClick={() => { 
                       const tid = localStorage.getItem('gasp_guest_id') || 'G'; 
                       window.open(SYNDICATE_CONFIG.getSmartLink(tid), '_blank'); 
                       setMissionCount(prev => Math.min(3, prev + 1));
                     }} 
                     className={`w-full max-w-[500px] h-16 md:h-20 rounded-[3rem] text-black text-[18px] md:text-[22px] font-black uppercase tracking-widest flex items-center justify-center gap-5 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all group shrink-0 relative overflow-hidden ${missionCount >= 3 ? 'bg-[#00ffcc] shadow-[0_20px_60px_rgba(0,255,204,0.4)]' : 'bg-[#ffea00] shadow-[0_20px_60px_rgba(255,234,0,0.4)]'}`}
                   >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                      <Zap size={24} className="fill-black" />
                      <span className="italic">
                        {missionCount === 0 ? 'START FIRST MISSION' : 
                         missionCount < 3 ? `START MISSION ${missionCount + 1}/3` : 
                         'MISSIONS COMPLETE ✅'}
                      </span>
                      <ArrowRight size={24} className="group-hover:translate-x-2 transition-all opacity-40" />
                   </button>
                   
                   <div className="flex flex-col w-full items-center gap-3">
                      <div className="grid grid-cols-2 gap-3 w-full max-w-[500px]">
                        <button
                          onClick={async () => {
                            if (missionCount >= 3) {
                              setCurrentStepIdx(3);
                              return;
                            }
                            const gid = localStorage.getItem('gasp_guest_id') || '';
                            const res = await fetch(`/api/economy/balance?userId=${gid}`);
                            const data = await res.json();
                            if (data.success && data.balance >= 6000) {
                              setCurrentStepIdx(3);
                            } else {
                              const remaining = Math.max(1, 3 - missionCount);
                              alert(`Insufficient Signal Strength. Complete ${remaining} more missions and try again!`);
                            }
                          }}
                          className={`flex-1 py-4 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-2 italic ${missionCount >= 3 ? 'border-[#00ffcc] text-[#00ffcc]' : 'border-white/10 text-white'}`}
                        >
                          <Shield size={14} /> VERIFY SIGNAL
                        </button>
                        
                        <button onClick={() => setIsTopUpOpen(true)} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2 italic">
                          <CreditCard size={14} /> BUY INSTANT
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-center gap-3 opacity-30 mt-1">
                        <div className="flex gap-1">
                          <span className={`w-1 h-1 rounded-full animate-ping ${missionCount >= 3 ? 'bg-[#00ffcc]' : 'bg-[#00f0ff]'}`} />
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-[0.4em] italic ${missionCount >= 3 ? 'text-[#00ffcc]' : 'text-[#00f0ff]'}`}>
                          {missionCount >= 3 ? 'IDENTITY VERIFIED - READY' : 'SCANNING INBOUND SIGNALS...'}
                        </span>
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
