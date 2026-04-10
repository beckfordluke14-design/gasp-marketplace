'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, ArrowRight, Zap, Shield, Sparkles, 
  User, Search, Heart, MessageSquare, Loader2, CreditCard, 
  Terminal, Activity, ShieldAlert, Lock, Mic, HeartPulse,
  Send as SendIcon
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { initialProfiles, proxyImg } from '@/lib/profiles';
import TopUpDrawer from './economy/TopUpDrawer';

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
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState('09:54:07');
  const [isLoaded, setIsLoaded] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState('');
  
  const [fomoMsg, setFomoMsg] = useState('');
  const [activeUsers, setActiveUsers] = useState(14);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fallback hero profile if none specified
  const profileId = searchParams.get('profile') || 'veronica_medellin';
  const profile = initialProfiles.find(p => p.id === profileId) || {
    name: 'Veronica',
    image: '/ai_girl_hero_funnel_1775829590274.png',
    city: 'Medellín'
  };

  // 📈 FOMO ENGINE
  useEffect(() => {
    const names = ['anon_382', 'hunter_x', 'papi_medellin', 'm_sanchez', 'k_jones', 'vip_user_2'];
    const actions = ['unlocked Vault 🌶️', 'bought Prime Access', 'restored Connection', 'sent a Tip ⚡'];
    
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

    // Initial Loading Logs
    const logs = [
      "> Connecting to private server...",
      "> Locating available line...",
      "> Verifying access tokens...",
      "> Found: " + (profile?.name || 'Veronica'),
      "> Security check passed.",
      "> Private line established.",
      "> Ready."
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
    }, 400);

    return () => {
      clearInterval(timerInterval);
      clearInterval(logInterval);
    };
  }, [profileId]);

  // Simulated Chat Logic
  useEffect(() => {
    if (currentStepIdx === 1 && messages.length === 0) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setMessages([
            { 
              id: '1', 
              role: 'assistant', 
              content: `Hey Papi... I was hoping you'd find me today. 😉 I'm so bored, I've just been waiting for someone fun to talk to. How's your day going?` 
            }
          ]);
          setIsTyping(false);
        }, 1500);
      }, 1000);
    }
  }, [currentStepIdx]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const [userMsgCount, setUserMsgCount] = useState(0);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newCount = userMsgCount + 1;
    setUserMsgCount(newCount);

    const userMsg = { id: Date.now().toString(), role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    
    setIsTyping(true);
    
    setTimeout(() => {
      if (newCount === 1) {
        // First reply: Normal Conversation
        setMessages(prev => [...prev, { 
          id: (Date.now()+1).toString(), 
          role: 'assistant', 
          content: `I love that. It's so hard to find guys who actually know how to talk these days. Honestly, I could stay here all day with you... but I just realized my guest minutes are super low. 🥺` 
        }]);
        setIsTyping(false);
      } else {
        // Second reply: The Squeeze
        setMessages(prev => [...prev, { 
          id: (Date.now()+1).toString(), 
          role: 'assistant', 
          content: `Oh no, my time is about to run out! Papi, please grab some credits real quick so this doesn't cut us off. I really want to keep talking... and I might even show you what I just put in my private vault. 🌶️` 
        }]);
        setIsTyping(false);
        
        // Move to offer after a delay
        setTimeout(() => setCurrentStepIdx(2), 3500);
      }
    }, 1500);
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
          poster={proxyImg('funnel/veronica_poster.jpg')}
        >
          <source src="https://asset.gasp.fun/funnel/veronica_promo.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />
      </div>

      {/* 🛡️ SOCIAL PROOF TICKER */}
      <AnimatePresence>
        {fomoMsg && (
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed bottom-32 left-4 right-4 z-[110] px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center gap-3 shadow-2xl md:left-6 md:right-auto md:w-fit"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffea00] animate-pulse shadow-[0_0_10px_#ffea00]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-white">{fomoMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔴 URGENCY HEADER */}
      <div className="relative z-[100] bg-[#0c0c0c]/90 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff00ff] to-[#7c3aed] flex items-center justify-center shadow-[0_0_20px_rgba(255,0,255,0.4)]">
            <Heart size={20} className="text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
               <span className="text-[11px] font-black uppercase text-white leading-none tracking-tight">Private Session</span>
               <div className="flex items-center gap-1 bg-green-500/20 px-1.5 py-0.5 rounded-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-black text-green-500">{activeUsers} Online</span>
               </div>
            </div>
            <span className="text-[16px] font-mono font-black text-[#ffea00] leading-none mt-1.5">{timeLeft}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Status</span>
           <span className="text-[11px] font-black uppercase tracking-widest text-green-500 animate-pulse">
              {currentStepIdx === 0 ? 'Loading...' : 'Active Now'}
           </span>
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
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#ff00ff]/30 bg-black/40 shadow-xl">
                    <img src={proxyImg('funnel/veronica_poster.jpg')} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-black text-[15px] uppercase tracking-wider">{profile.name}</span>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{profile.city}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-white/40">
                   <Mic size={20} className="hover:text-white transition-colors" />
                   <Activity size={20} className="hover:text-[#ff00ff] transition-colors" />
                </div>
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
                    <SendIcon size={20} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {currentStepIdx === 2 && (
            <motion.div 
              key="offer"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 overflow-y-auto px-4 pt-8 pb-32 space-y-10 z-10 no-scrollbar"
            >
              <div className="text-center space-y-4 px-2">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/30 rounded-full text-[11px] font-black uppercase tracking-[0.25em] text-red-500 mb-2">
                  <Lock size={12} />
                  <span>Session Expired</span>
                </div>
                <h2 className="text-[38px] md:text-5xl font-black text-white leading-[0.85] tracking-tighter">
                  CONNECTION <span className="text-[#ff00ff]">LOCKED</span> <br />
                  <span className="text-white/40 text-[20px] tracking-tight mt-2 block">Choose a Pack to keep chatting with Veronica</span>
                </h2>
                
                {/* 🚨 REWARD BADGE: HIGH-CONTRAST SANS */}
                <div className="max-w-[280px] mx-auto mt-6 p-4 bg-[#ffea00] rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_10px_40px_rgba(255,234,0,0.3)] border-2 border-white">
                  <span className="text-[12px] font-system-black uppercase text-black tracking-widest leading-none font-sans font-black">LOYALTY REWARD ACTIVE</span>
                  <div className="flex items-baseline gap-1">
                     <span className="text-2xl font-system-black text-black font-sans font-black">1:1 $GaspAi Match</span>
                  </div>
                </div>
                <p className="text-[9px] font-black uppercase text-[#ffea00] tracking-widest mt-2 animate-pulse">Genesis Phase 1: Ends at 10k accounts</p>
              </div>

              <div className="grid grid-cols-1 max-w-md mx-auto gap-6 px-1">
                {[
                  { 
                    id: 'tier_starter', 
                    label: 'Basic Pack', 
                    price: 4.99, 
                    credits: '5,000', 
                    value: 'ENTRY',
                    tag: 'Essential'
                  },
                  { 
                    id: 'tier_session', 
                    label: 'Prime Access', 
                    price: 24.99, 
                    credits: '30,000', 
                    value: '6X VALUE',
                    popular: true,
                    tag: 'Most Popular' 
                  },
                  { 
                    id: 'tier_whale', 
                    label: 'Elite Status', 
                    price: 99.99, 
                    credits: '120,000', 
                    value: '24X VALUE',
                    tag: 'Whale Tier' 
                  },
                ].map((pkg) => (
                  <button 
                    key={pkg.id}
                    onClick={() => {
                        setSelectedPkgId(pkg.id);
                        setIsTopUpOpen(true);
                    }}
                    className={`relative p-6 rounded-[2.5rem] border transition-all duration-500 group flex flex-col text-left ${pkg.popular ? 'bg-gradient-to-br from-[#ff00ff]/20 to-black border-[#ff00ff] shadow-[0_20px_50px_rgba(255,0,255,0.2)] scale-[1.03] z-20' : 'bg-black/80 border-white/20'}`}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-black text-[#ff00ff] uppercase tracking-[0.3em] mb-1">{pkg.tag}</span>
                        <span className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{pkg.label}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-4xl font-black text-white italic tracking-tighter leading-none">${pkg.price}</span>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-2">{pkg.value}</span>
                      </div>
                    </div>

                    <div className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${pkg.popular ? 'bg-[#ff00ff]/20 border-[#ff00ff]/40' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex flex-col">
                           <span className="text-[28px] font-black text-white italic tracking-tighter leading-none">{pkg.credits}</span>
                           <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">Credits Included</span>
                        </div>
                        <Zap size={24} className={pkg.popular ? 'text-[#ff00ff] fill-[#ff00ff]' : 'text-white/20'} />
                    </div>

                    <div className="mt-6 flex items-center gap-2 opacity-80">
                       <CheckCircle2 size={12} className="text-green-500" />
                       <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">Instant Vault Unlock 🌶️</span>
                    </div>

                    {pkg.popular && (
                      <div className="absolute top-0 right-10 -translate-y-1/2 px-5 py-2 bg-[#ff00ff] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl skew-x-[-12deg]">
                        BEST CHOICE
                      </div>
                    )}
                  </button>
                ))}
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
