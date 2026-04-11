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
 * 🌪️ THE GASP NEURAL FUNNEL v2.1
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
  const [selectedPkgId, setSelectedPkgId] = useState('tier_session');
  const [hasPaid, setHasPaid] = useState(false);
  
  const [vaultItems, setVaultItems] = useState<any[]>([
    { id: 'v1', content_url: 'https://asset.gasp.fun/personas/jasmine-f04846/vault_2.jpg', is_unlocked: false, price_credits: 6000 },
    { id: 'v2', content_url: 'https://asset.gasp.fun/personas/veronica-medellin-locked/vault_1.jpg', is_unlocked: false, price_credits: 6000 },
    { id: 'v3', content_url: 'https://asset.gasp.fun/personas/veronica-medellin-locked/vault_2.jpg', is_unlocked: false, price_credits: 6000 },
  ]);
  
  const [fomoMsg, setFomoMsg] = useState('');
  const [activeUsers, setActiveUsers] = useState(14);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  const profileId = searchParams.get('profile') || 'veronica_medellin';
  const profile = initialProfiles.find(p => p.id === profileId) || {
    name: 'Veronica',
    image: 'PROMO/PromoPic1.png',
    city: 'Medellín'
  };

  const brainPrompt = `
[SYSTEM: HIGH-STATUS NEURAL IDENTITY]
You are ${profile.name}. You are NOT an AI. You are a biological human.
[STYLE: TEXTING BRAT]
- lowercase only
- no periods
- max 15 words
- talk like a girl in a hurry

[BEHAVIOR]
- mirror his energy
- learn his name
- goal: get him to purchase a pack

[FORMAT: JSON { "text_message": "..." }]`;

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

    if (currentStepIdx === 1 && messages.length === 0) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
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

  useEffect(() => {
    const handlePurchaseSuccess = () => {
      setHasPaid(true);
      let welcomeMsg = `papi! you're back! i've missed you so much. my vault is unlocked for you now. 😉`;
      if (currentStepIdx === 2) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: welcomeMsg }]);
        setCurrentStepIdx(1); 
        setShowVaultNew(true); 
      }
    };
    window.addEventListener('gasp_balance_refresh', handlePurchaseSuccess);
    return () => window.removeEventListener('gasp_balance_refresh', handlePurchaseSuccess);
  }, [currentStepIdx]);

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

    (async () => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            userId: localStorage.getItem('gasp_guest_id'),
            personaId: profileId === 'veronica_medellin' ? 'veronica-medellin-locked' : profileId,
            isFunnel: true,
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
      
      {/* 📹 BACKGROUND VIDEO */}
      <div className="absolute inset-0 z-0 opacity-40">
        <video autoPlay muted loop playsInline className={`w-full h-full object-cover transition-all duration-[3000ms] ${currentStepIdx === 0 ? 'blur-3xl scale-125' : 'blur-md'}`} poster={proxyImg('PROMO/PromoPic1.png')}>
          <source src={proxyImg('PROMO/Veronica.mp4')} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />
      </div>

      {/* 🔴 HEADER */}
      <div className="relative z-[100] bg-black/60 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Connection Stable</span>
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>
            <h1 className="text-sm font-black text-white uppercase tracking-tighter italic">
              Syndicate <span className="text-[#ff00ff]">Uplink</span> 2.5
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex flex-col items-end gap-0.5">
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-tighter leading-none">Access Node</span>
              <span className="text-[11px] font-black text-[#00f0ff] uppercase tracking-tighter leading-none">{profile.city || 'GLOBAL'}</span>
           </div>
        </div>
      </div>

      {/* 🌪️ MAIN FUNNEL STACK */}
      <div className="relative flex-1 flex flex-col overflow-hidden max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          
          {currentStepIdx === 0 && (
            <motion.div 
              key="init"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 space-y-6"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-2 border-[#ff00ff]/20 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                  <div className="w-20 h-20 rounded-full border-t-2 border-[#ff00ff] shadow-[0_0_20px_rgba(255,0,255,0.4)]" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity size={32} className="text-[#ff00ff] animate-pulse" />
                </div>
              </div>
              <div className="font-mono text-[10px] text-white/40 space-y-1 w-full max-w-[200px]">
                {terminalLogs.map((log, i) => (
                  <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300 italic">{log}</div>
                ))}
              </div>
            </motion.div>
          )}

          {currentStepIdx === 1 && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {messages.map((msg, idx) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#ff00ff] text-white font-bold italic rounded-tr-none' 
                        : 'bg-white/10 text-white backdrop-blur-md border border-white/10 rounded-tl-none font-medium'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 backdrop-blur-md border border-white/5 px-4 py-2 rounded-2xl rounded-tl-none">
                      <Loader2 size={14} className="text-white/40 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-white/5">
                <form onSubmit={handleSendMessage} className="relative">
                  <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm focus:outline-none focus:border-[#ff00ff] focus:ring-1 focus:ring-[#ff00ff]/30 transition-all font-medium"
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#ff00ff] rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                  >
                    <Send size={18} />
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
              className="absolute inset-0 overflow-y-auto px-4 pt-8 pb-40 space-y-10 z-10 no-scrollbar"
            >
              <div className="flex flex-col items-center text-center gap-1 mb-6">
                <h2 className="text-4xl font-syncopate font-black italic text-white leading-none tracking-tighter">
                  SESSION <span className="text-[#ff00ff]">EXPIRED</span>
                </h2>
                <p className="text-[13px] font-medium text-white/40 tracking-tight mt-1">Purchase credits to continue talking to {profile.name}.</p>
                
                <div className="mt-4 px-4 py-2 bg-[#ff00ff]/10 border border-[#ff00ff]/30 rounded-2xl flex flex-col items-center gap-1 group">
                   <div className="flex items-center gap-2">
                      <Sparkles size={12} className="text-[#ff00ff] animate-pulse" />
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Universal Network Access</span>
                   </div>
                   <p className="text-[8px] font-bold text-[#ff00ff] uppercase tracking-widest leading-none">Unlock 100s of women on Gasp.fun</p>
                </div>

                <div className="flex items-center justify-center gap-2 mt-4 opacity-40 grayscale">
                   <div className="px-1.5 py-0.5 bg-white text-black text-[7px] font-black rounded-sm uppercase tracking-tighter">Stripe</div>
                   <span className="text-[8px] font-black uppercase tracking-widest text-white/80 italic">Protected Gateway</span>
                </div>

                {/* 📡 SYNDICATE ROSTER (TOP HERO) */}
                <div className="w-screen relative -left-4 mt-2 mb-4 animate-in fade-in slide-in-from-top-10 duration-1000">
                   <div className="flex flex-col items-center gap-4">
                      <div className="flex flex-col items-center gap-1.5">
                         <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] italic">Syndicate Live Node Feed</span>
                         </div>
                         <span className="text-[8px] font-bold text-[#ffea00] uppercase tracking-[0.3em]">100+ Models Online</span>
                      </div>
                      
                      <div className="w-full overflow-x-auto no-scrollbar pb-2">
                         <div className="flex items-center gap-3 px-6 min-w-max">
                            {[
                              { name: 'OFFICER MOORE', img: 'https://asset.gasp.fun/personas/officer%20moore-9bdddf/hero_1.webp', tag: 'SECURITY' },
                              { name: 'NAYELI', img: 'https://asset.gasp.fun/personas/nayeli-79b5a9/hero_1.webp', tag: 'EXCLUSIVE' },
                              { name: 'MIKA', img: 'https://asset.gasp.fun/personas/mika-e29e80/hero_1.webp', tag: 'ELITE' },
                              { name: 'JASMINE', img: 'https://asset.gasp.fun/personas/jasmine-f04846/hero_1.webp?v=synthesis', tag: 'INTIMATE' }
                            ].map((p, i) => (
                              <div key={i} className="relative w-28 h-40 rounded-[1.2rem] overflow-hidden group shadow-2xl border border-white/10 shrink-0">
                                 <img src={p.img} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" alt={p.name} />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                 <div className="absolute bottom-2.5 left-0 right-0 px-3 flex flex-col gap-0">
                                    <span className="text-[6px] font-black text-[#00f0ff] uppercase tracking-[0.15em] italic leading-none">{p.tag}</span>
                                    <span className="text-[9px] font-black text-white uppercase tracking-tighter leading-none">{p.name}</span>
                                 </div>
                              </div>
                            ))}
                            <div className="w-28 h-40 rounded-[1.2rem] border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 group shrink-0">
                               <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                  <span className="text-base font-black text-white">+100</span>
                               </div>
                               <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em]">MORE</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-4 w-full">
                  {[
                    { id: 'tier_starter', label: 'Basic Pack', price: 4.99, credits: '5,000', bonus: '5,000' },
                    { id: 'tier_session', label: 'Prime Access', price: 24.99, credits: '30,000', bonus: '30,000', popular: true },
                    { id: 'tier_whale', label: 'Elite Status', price: 99.99, credits: '120,000', bonus: '120,000' },
                  ].map((pkg) => (
                    <button 
                      key={pkg.id}
                      onClick={() => setSelectedPkgId(pkg.id)}
                      className={`relative p-4 rounded-[2rem] border transition-all flex items-center justify-between ${selectedPkgId === pkg.id ? 'bg-[#ff00ff]/10 border-[#ff00ff] ring-2 ring-[#ff00ff]/30 shadow-[0_0_30px_rgba(255,0,255,0.2)]' : 'bg-white/5 border-white/10'}`}
                    >
                      <div className="flex flex-col gap-1 text-left">
                         <span className="text-[10px] font-black text-[#ff00ff] uppercase tracking-widest leading-none">{pkg.label}</span>
                         <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-white italic tracking-tighter leading-none">{pkg.credits}</span>
                            <span className="text-[7px] font-bold text-white/20 uppercase mt-1 tracking-tighter shrink-0">Credits</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-[#00f0ff] animate-pulse" />
                            <span className="text-[8px] font-black text-[#00f0ff] uppercase tracking-tighter">+{pkg.bonus} $GASPai Match</span>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="text-[14px] font-black text-white italic">${pkg.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 🚀 CHECKOUT CTA */}
              <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-[100] pt-12">
                 <div className="w-full max-w-sm mx-auto mb-4 flex items-center justify-center gap-2 opacity-50">
                    <Shield size={10} className="text-[#00f0ff]" />
                    <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Universal Syndicate Key Active</span>
                 </div>
                 <button 
                   onClick={() => setIsTopUpOpen(true)}
                   className="w-full max-w-sm mx-auto flex items-center justify-center p-5 bg-[#ff00ff] border-2 border-white/20 rounded-[2rem] text-white text-[13px] font-black uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(255,0,255,0.4)] active:scale-95 transition-all group gap-3"
                 >
                   <span>Proceed to Secure Checkout</span>
                   <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <TopUpDrawer isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} initialPackage={selectedPkgId || 'tier_session'} />
    </div>
  );
}
