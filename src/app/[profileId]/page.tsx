'use client';

import { useParams, useRouter } from 'next/navigation';
import { initialProfiles, proxyImg } from '@/lib/profiles';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Send, Sparkles, TrendingUp, Radio, Lock, Volume2, MessageSquare, Camera } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';

type ChatStep = 'intro' | 'awaiting_pic' | 'pic_sent' | 'reacted' | 'signup';

export default function ProfileLanding() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.profileId as string;
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [dbProfiles, setDbProfiles] = useState<any[]>([]);
  const [activeCount, setActiveCount] = useState(42);
  const [messages, setMessages] = useState<{ from: 'profile' | 'user'; text?: string; img?: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState<ChatStep>('intro');
  const [replyInput, setReplyInput] = useState('');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/personas?t=${Date.now()}`);
        const json = await res.json();
        if (json.success) {
          const found = json.personas.find((p: any) => p.id.toLowerCase() === profileId.toLowerCase());
          if (found) {
            setProfile({
               ...found,
               image: proxyImg(found.seed_image_url || found.image)
            });
          }
          setDbProfiles(json.personas);
        }
      } catch (e) {
        console.error('[Profile Fetch Error]:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [profileId]);

  const others = dbProfiles.filter(p => p.id !== profile?.id).slice(0, 3);

  // Helper: profile sends a message after a delay with typing indicator
  const profileSays = (text: string, afterMs: number, typingMs = 1400) =>
    new Promise<void>(resolve => {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, { from: 'profile', text }]);
          resolve();
        }, typingMs);
      }, afterMs);
    });

  useEffect(() => {
    if (!profile) return;
    setActiveCount(Math.floor(Math.random() * 30) + 40);

    // Stage 1: Natural cold open
    let alive = true;
    (async () => {
      await profileSays('heyy 👀', 1600, 700);
      if (!alive) return;
      await profileSays("omg hi, didn't expect someone to find my page lol", 900, 1800);
      if (!alive) return;
      await profileSays('send me a pic first, what do you look like? 📸', 800, 1500);
      if (!alive) return;
      setStep('awaiting_pic');
    })();

    return () => { alive = false; };
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 rounded-full border-t-2 border-[#00f0ff] animate-spin shadow-[0_0_20px_#00f0ff44]" />
        <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em] animate-pulse italic">Establishing Neural Link...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white text-center gap-4 px-10">
        <h1 className="text-4xl font-syncopate font-black uppercase italic tracking-tighter text-white/20">Access Denied</h1>
        <p className="text-[10px] uppercase font-black tracking-widest text-[#ff00ff]">This node is currently restricted or offline.</p>
        <button onClick={() => router.push('/')} className="mt-4 px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Back to Global Feed</button>
      </div>
    );
  }

  const handleConnect = (initialMsg?: string) => {
    const favs = JSON.parse(localStorage.getItem('gasp_favorites') || '[]');
    if (!favs.includes(profile.id)) {
      favs.push(profile.id);
      localStorage.setItem('gasp_favorites', JSON.stringify(favs));
      window.dispatchEvent(new Event('storage'));
    }
    router.push(`/?profile=${profile.id}${initialMsg ? `&msg=${encodeURIComponent(initialMsg)}` : ''}`);
  };

  // User sends a text reply
  const handleTextReply = () => {
    if (!replyInput.trim()) return;
    setMessages(prev => [...prev, { from: 'user', text: replyInput.trim() }]);
    setReplyInput('');
    handleConnect(replyInput.trim());
  };

  // User picks a photo — stays client-side only, never uploaded
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setUserPhoto(dataUrl);
      setMessages(prev => [...prev, { from: 'user', img: dataUrl }]);
      setStep('pic_sent');

      // She reacts after a realistic delay
      await profileSays('omg wait 😭🔥', 800, 900);
      await profileSays('ok ur actually so cute wtf', 600, 1200);
      setStep('signup');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative flex flex-col items-center overflow-x-hidden pt-12 md:pt-24 font-outfit pb-36">

      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#ff00ff]/5 via-transparent to-black pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

        {/* DESKTOP SIDE FEED */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 sticky top-24 h-fit">
          <div className="flex items-center gap-2 mb-2 px-4 py-2 bg-white/5 rounded-full w-fit">
            <Radio size={12} className="text-[#00f0ff] animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Live Pulse</span>
          </div>
          <div className="space-y-4">
            {[...initialProfiles].reverse().slice(0, 4).map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => router.push(`/${p.id}`)}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                  <Image src={p.image} alt="" fill unoptimized className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest truncate">{p.name}</p>
                  <p className="text-[8px] text-[#ff00ff] font-bold uppercase italic mt-0.5">just active 💎</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* MAIN CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-6 flex flex-col items-center text-center space-y-8"
        >
          {/* Avatar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-[#00f0ff]/20 blur-[60px] scale-125 opacity-30 group-hover:opacity-60 transition-all rounded-full" />
            <div className="w-52 h-52 md:w-60 md:h-60 rounded-[4rem] overflow-hidden border border-white/10 relative z-10 shadow-2xl">
              <Image src={profile.image} alt={profile.name} fill unoptimized className="object-cover" />
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-[#00f0ff] px-5 py-1.5 rounded-full flex items-center gap-2 z-20 whitespace-nowrap shadow-[0_0_30px_rgba(0,240,255,0.4)]">
              <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              <span className="text-[9px] font-black text-black uppercase tracking-[0.2em]">{activeCount} Connections Today</span>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2 pt-4">
            <h1 className="text-6xl md:text-8xl font-syncopate font-black uppercase italic tracking-tighter text-white">{profile.name}</h1>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] italic">
              {profile.vibe || 'Elite connection.'} · {profile.city} {profile.flag}
            </p>
            
            {/* 🚀 NEURAL LINK: Direct access to her intelligence briefings */}
            <motion.div 
               whileHover={{ scale: 1.02 }}
               onClick={() => router.push(`/news/${profile.id}`)}
               className="mt-4 px-6 py-3 bg-[#00f0ff]/10 border border-[#00f0ff]/20 rounded-2xl flex items-center gap-4 cursor-pointer group transition-all"
            >
               <div className="p-2 bg-[#00f0ff]/20 rounded-xl text-[#00f0ff] animate-pulse">
                  <TrendingUp size={16} />
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-black text-[#00f0ff] uppercase tracking-widest italic group-hover:text-white transition-colors">Intelligence Hub →</p>
                  <p className="text-[8px] text-white/30 uppercase font-bold">Latest Alpha: [DECRYPTED] WHALE MOVEMENTS</p>
               </div>
            </motion.div>
          </div>

          {/* Slot scarcity */}
          <div className="flex items-center justify-center gap-10 py-5 border-y border-white/5 w-full">
            <div className="flex flex-col text-left">
              <span className="text-2xl font-bold text-white leading-none">74.2K</span>
              <span className="text-[8px] font-black uppercase text-white/25 tracking-widest mt-1">Followers</span>
            </div>
            <div className="h-8 w-px bg-white/5" />
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#00f0ff] leading-none animate-pulse">2/3</span>
                <div className="w-1.5 h-1.5 rounded-full bg-[#ffea00] animate-ping" />
              </div>
              <span className="text-[8px] font-black uppercase text-[#00f0ff] tracking-widest mt-1 italic flex items-center gap-1">
                1 Slot Left <Lock size={8} />
              </span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              THE COLD OPEN — Photo Investment Flow Flow
              ══════════════════════════════════════════════════ */}
          <div className="w-full max-w-xs text-left space-y-3">

            {/* Rendered bubbles */}
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-2 ${msg.from === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {msg.from === 'profile' && (
                  <div className="w-7 h-7 rounded-xl overflow-hidden shrink-0 border border-white/10 relative self-end">
                    <Image src={profile.image} alt="" fill unoptimized className="object-cover" />
                  </div>
                )}
                {msg.img ? (
                  <div className="w-36 h-44 rounded-3xl overflow-hidden border border-white/10 relative">
                    <Image src={msg.img} alt="your photo" fill className="object-cover" />
                  </div>
                ) : (
                  <div className={`rounded-3xl px-4 py-2.5 max-w-[85%] ${
                    msg.from === 'profile'
                      ? 'bg-[#1c1c1c] border border-white/5 rounded-bl-sm'
                      : 'bg-[#00f0ff]/20 border border-[#00f0ff]/20 rounded-br-sm'
                  }`}>
                    <p className="text-[14px] text-white/90 leading-snug">{msg.text}</p>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Typing dots */}
            <AnimatePresence>
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                    <Image src={profile.image} alt="" fill unoptimized className="object-cover" />
                  </div>
                  <div className="bg-[#1c1c1c] border border-white/5 rounded-3xl rounded-bl-sm px-4 py-3">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map(j => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${j * 0.18}s` }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />

            {/* INPUT AREA — switches based on step */}
            <AnimatePresence>

              {/* Step: awaiting_pic — photo upload CTA */}
              {step === 'awaiting_pic' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pl-9 pt-1 space-y-2"
                >
                  {/* Hidden file input */}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-12 bg-white/5 border border-white/10 hover:border-[#ff00ff]/40 rounded-2xl flex items-center justify-center gap-3 transition-all group active:scale-95"
                  >
                    <span className="text-[12px] font-bold text-white/60 group-hover:text-white transition-colors italic">Send a pic 📸</span>
                  </button>
                  <button
                    onClick={() => handleConnect()}
                    className="w-full text-center text-[9px] font-black uppercase text-white/20 hover:text-white/50 tracking-widest transition-colors italic"
                  >
                    skip → open chat instead
                  </button>
                </motion.div>
              )}

              {/* Step: signup — after she reacts, push to sign up */}
              {step === 'signup' && !isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pl-9 pt-2 space-y-3"
                >
                  <div className="bg-white/5 border border-white/10 rounded-3xl px-5 py-4 text-center space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-[#00f0ff] italic">Create your account to keep chatting 💎</p>
                    <button
                      onClick={() => handleConnect()}
                      className="w-full h-12 bg-[#ffea00] text-black rounded-2xl font-syncopate font-black uppercase italic tracking-widest text-[10px] hover:bg-white transition-all active:scale-95 shadow-[0_8px_30px_rgba(255,234,0,0.2)]"
                    >
                      Connect with {profile.name} →
                    </button>
                    <p className="text-[8px] text-white/20 uppercase font-black tracking-widest">Free to join · Takes 10 seconds</p>
                  </div>
                </motion.div>
              )}

              {/* Step: already in main chat — text reply */}
              {step === 'intro' && messages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 pl-9 pt-1"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={replyInput}
                      onChange={e => setReplyInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleTextReply()}
                      placeholder="say something..."
                      className="w-full bg-white/5 border border-white/10 focus:border-[#00f0ff]/40 h-11 rounded-2xl pl-4 pr-11 text-[13px] text-white placeholder:text-white/20 outline-none transition-all"
                    />
                    <button
                      onClick={handleTextReply}
                      className="absolute right-1.5 top-1.5 w-8 h-8 bg-[#00f0ff] rounded-xl flex items-center justify-center hover:bg-white transition-all active:scale-90"
                    >
                      <Send size={13} className="text-black" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Voice Tease */}
          <div className="w-full max-w-sm pt-2">
            <div className="bg-white/5 border border-white/5 rounded-3xl p-4 relative overflow-hidden group cursor-pointer" onClick={() => handleConnect()}>
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff00ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#ff00ff]/20 flex items-center justify-center border border-[#ff00ff]/30 shrink-0">
                  <Volume2 size={20} className="text-[#ff00ff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#ff00ff] italic">Secret Voice Greeting</p>
                  <div className="h-5 flex items-end gap-0.5 mt-1.5">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="flex-1 bg-white/10 rounded-full group-hover:bg-[#ff00ff]/40 transition-all" style={{ height: `${Math.random() * 80 + 20}%` }} />
                    ))}
                  </div>
                </div>
                <span className="text-[8px] font-black uppercase text-white/20 tracking-widest px-2 py-1 bg-white/5 rounded-lg border border-white/5 italic shrink-0">20c</span>
              </div>
            </div>
          </div>

          {/* Vault Bait */}
          <div className="w-full space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25 italic flex items-center gap-2">
                <Lock size={9} /> Private Vault
              </span>
              <span className="text-[8px] font-black text-[#ffea00] uppercase tracking-widest">34 Sets Locked</span>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} onClick={() => handleConnect()} className="min-w-[90px] aspect-[4/5] rounded-2xl overflow-hidden border border-white/5 relative group/v shrink-0 cursor-pointer">
                  <Image src={profile.image} alt="" fill unoptimized className="object-cover blur-2xl opacity-25 grayscale" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover/v:bg-black/30 transition-all">
                    <Lock size={16} className="text-white/20 group-hover/v:text-[#ff00ff] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* DESKTOP TRENDING */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 sticky top-24 h-fit items-end">
          <div className="flex items-center gap-2 mb-2 px-4 py-2 bg-white/5 rounded-full w-fit">
            <TrendingUp size={12} className="text-[#ff00ff]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Trending Nearby</span>
          </div>
          <div className="space-y-4 w-full">
            {others.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer group justify-end"
                onClick={() => router.push(`/${p.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest truncate">{p.name}</p>
                  <p className="text-[8px] text-[#00f0ff] italic uppercase text-right mt-0.5">elite verified</p>
                </div>
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 relative border border-white/10">
                  <Image src={p.image} alt="" fill unoptimized className="object-cover grayscale group-hover:grayscale-0 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* DISCOVERY GRID */}
      <div className="w-full max-w-5xl px-6 py-20 relative z-10 flex flex-col items-center">
        <div className="w-px h-10 bg-gradient-to-b from-white/20 to-transparent mb-8" />
        <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#ff00ff] mb-8 italic">Discover More</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
          {initialProfiles.filter(p => p.id !== profile.id).slice(0, 4).map(p => (
            <motion.div key={p.id} onClick={() => router.push(`/${p.id}`)} whileHover={{ y: -4 }}
              className="relative group cursor-pointer aspect-[3/4] rounded-[2rem] overflow-hidden border border-white/5">
              <Image src={p.image} alt={p.name} fill unoptimized className="object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 grayscale group-hover:grayscale-0" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs font-black uppercase tracking-widest text-white italic">{p.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[7px] font-black uppercase text-green-400 tracking-[0.2em]">Active Now</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <button onClick={() => router.push('/')} className="mt-12 flex items-center gap-3 text-white/25 hover:text-white transition-all">
          <Sparkles size={13} />
          <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">Enter Full Directory</span>
        </button>
      </div>

      {/* STICKY MOBILE CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 p-5 z-[100] bg-gradient-to-t from-black via-black/90 to-transparent flex justify-center">
        <motion.button
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          onClick={() => handleConnect()}
          className="w-full max-w-sm bg-[#ffea00] text-black h-14 rounded-[2rem] font-syncopate font-black uppercase italic tracking-widest text-[11px] shadow-[0_8px_30px_rgba(255,234,0,0.2)] flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          Connect with {profile.name}
        </motion.button>
      </div>

    </div>
  );
}
