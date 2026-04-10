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
              content: `Hey Papi... I've been waiting for you to find me. 😉 I don't have much time left on this private line, let's talk fast.` 
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    
    // Auto-reply and then show offer
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: (Date.now()+1).toString(), 
        role: 'assistant', 
        content: `Oh no... our line is cutting out! 🥺 Papi, I think I'm losing you. You need to get a chat pack so we can keep talking! I have something special waiting for you in my private vault.` 
      }]);
      setIsTyping(false);
      
      // Move to offer after a delay
      setTimeout(() => setCurrentStepIdx(2), 2000);
    }, 1200);
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#ff00ff]/30 font-outfit overflow-hidden flex flex-col relative">
      
      {/* 📹 BACKGROUND VIDEO (SILENT LOOP) */}
      <div className="absolute inset-0 z-0 opacity-40">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className={`w-full h-full object-cover transition-all duration-[3000ms] ${currentStepIdx === 0 ? 'blur-3xl scale-125' : 'blur-md'}`}
          poster={profile.image}
        >
          <source src="/Promo/Veronica.mp4" type="video/mp4" />
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
            className="fixed bottom-32 left-6 z-[100] px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-3 shadow-2xl"
          >
            <div className="w-2 h-2 rounded-full bg-[#ffea00] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{fomoMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔴 URGENCY HEADER */}
      <div className="relative z-[100] bg-[#0c0c0c]/80 backdrop-blur-lg border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff00ff] to-[#7c3aed] flex items-center justify-center shadow-[0_0_20px_rgba(255,0,255,0.3)]">
            <Heart size={16} className="text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase text-white leading-none tracking-tight">Active Link</span>
               <div className="flex items-center gap-1 bg-green-500/20 px-1.5 py-0.5 rounded">
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[8px] font-black text-green-500">{activeUsers} Waiting</span>
               </div>
            </div>
            <span className="text-[14px] font-mono font-black text-[#ff00ff] leading-none mt-1">{timeLeft}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
           <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 font-outfit">Priority Status</span>
           <span className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff] animate-pulse">
              {currentStepIdx === 0 ? 'Syncing...' : 'Connected'}
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
              className="flex-1 flex flex-col items-center justify-center p-6 gap-10 relative z-10"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden">
                   <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                     className="absolute inset-0 border-t border-[#ff00ff] rounded-full scale-[1.1]"
                   />
                   <Terminal className="text-[#ff00ff]" size={32} />
                </div>
              </div>

              <div className="w-full max-w-xs space-y-2">
                {terminalLogs.map((log, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-[10px] font-mono text-[#ff00ff] opacity-40 leading-none">{'>'}</span>
                    <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest leading-none">
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1 flex flex-col max-w-2xl mx-auto w-full relative z-10 bg-[#080808]/60 backdrop-blur-2xl border-x border-white/5"
            >
              {/* Profile Bar */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#ff00ff]/30">
                    <img src={proxyImg(profile.image)} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-black text-sm uppercase tracking-widest">{profile.name}</span>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{profile.city} Connection</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-white/40">
                   <Mic size={18} />
                   <Activity size={18} />
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col no-scrollbar">
                {messages.map((m, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] px-5 py-4 rounded-[1.5rem] text-sm font-medium ${
                      m.role === 'user' 
                        ? 'bg-gradient-to-br from-[#ff00ff] to-[#7c3aed] text-white rounded-tr-none shadow-[0_10px_30px_rgba(255,0,255,0.2)]' 
                        : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'
                    }`}>
                      {m.content}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 px-4 py-3 rounded-2xl flex gap-1">
                      {[0,1,2].map(d => (
                        <motion.div 
                          key={d}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                          className="w-1.5 h-1.5 rounded-full bg-white/40"
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 pt-0 mt-auto shrink-0">
                <form onSubmit={handleSendMessage} className="relative group">
                  <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full h-16 bg-white/[0.03] border border-white/10 rounded-2xl px-6 pr-16 text-sm font-medium focus:outline-none focus:border-[#ff00ff]/50 focus:bg-white/[0.06] transition-all"
                  />
                  <button 
                    type="submit"
                    className="absolute right-3 top-3 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-[#ff00ff] transition-all"
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
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 overflow-y-auto px-6 pt-10 pb-32 space-y-12 relative z-10"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-2">
                  <Lock size={10} />
                  <span>Connection Limited</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-outfit font-black text-white leading-[0.9] tracking-tighter">
                  Session <span className="text-[#ff00ff]">Locked</span> <br />
                  <span className="text-white/40 text-2xl">Pick a Pack to continue chatting</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 max-w-lg mx-auto gap-5">
                {[
                  { 
                    id: 'tier_starter', 
                    label: 'Basic Uplink', 
                    price: 4.99, 
                    credits: '5,000', 
                    value: 'ENTRY',
                    features: ['Credits for Private Chat', 'Starter Vault Peeks 🌶️', 'Basic Identity Search'],
                    tag: 'Essential'
                  },
                  { 
                    id: 'tier_session', 
                    label: 'Prime Access', 
                    price: 24.99, 
                    credits: '30,000', 
                    value: '6X VALUE',
                    popular: true,
                    features: ['Credits for Private Vault Unlocks 🌶️', 'High-Fidelity Voice Uplink Sync', 'Extended Direct Chat Session'],
                    tag: 'Most Popular' 
                  },
                  { 
                    id: 'tier_whale', 
                    label: 'Elite Status', 
                    price: 99.99, 
                    credits: '120,000', 
                    value: '24X VALUE',
                    features: ['Massive Vault Decryption Pool 🔞', 'Continuous Identity Connection', 'Priority Link Response'],
                    tag: 'Whale Tier' 
                  },
                ].map((pkg) => (
                  <div 
                    key={pkg.id}
                    className={`relative p-8 rounded-[2rem] border transition-all duration-500 group flex flex-col ${pkg.popular ? 'bg-[#ff00ff]/5 border-[#ff00ff] shadow-[0_0_60px_rgba(255,0,255,0.2)] scale-[1.02]' : 'bg-[#0f0f0f] border-white/5 hover:border-white/10'}`}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex flex-col gap-1">
                        <span className="text-xl font-black text-white uppercase tracking-widest leading-none">{pkg.label}</span>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="bg-[#ff00ff]/20 text-[#ff00ff] text-[10px] font-black px-2 py-0.5 rounded uppercase">{pkg.tag}</span>
                           <span className="text-[8px] font-black text-[#ffea00] uppercase tracking-widest whitespace-nowrap">+ 1,500 GENESIS GIFT</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-1 mr-[-2px]">
                          <span className="text-4xl font-black text-white italic tracking-tighter">${pkg.price}</span>
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">once</span>
                        </div>
                        <span className="text-[12px] font-black text-[#ff00ff] uppercase tracking-widest mt-1">{pkg.value}</span>
                      </div>
                    </div>

                    <div className="mb-8 p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Neural Power</span>
                           <Zap size={10} className="text-[#ff00ff] fill-[#ff00ff]" />
                        </div>
                        <div className="text-4xl font-black text-white italic tracking-tighter leading-none">
                           {pkg.credits} <span className="text-sm text-white/40 not-italic tracking-widest uppercase ml-2">Credits</span>
                        </div>
                    </div>

                    <div className="space-y-4 mb-10 pl-2">
                       {pkg.features.map(f => (
                         <div key={f} className="flex items-start gap-4">
                           <div className="w-1 h-1 rounded-full bg-[#ff00ff] mt-1.5" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-white/60 leading-tight">{f}</span>
                         </div>
                       ))}
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedPkgId(pkg.id);
                        setIsTopUpOpen(true);
                      }}
                      className={`w-full h-16 rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${pkg.popular ? 'bg-[#ff00ff] text-white shadow-[0_10px_30px_rgba(255,0,255,0.3)]' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}
                    >
                      Get {pkg.label}
                    </button>

                    {pkg.popular && (
                      <div className="absolute top-0 right-8 -translate-y-1/2 px-4 py-1.5 bg-[#ff00ff] text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                        Recommended Sync
                      </div>
                    )}
                  </div>
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
