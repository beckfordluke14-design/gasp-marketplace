'use client';

import { useParams, useRouter } from 'next/navigation';
import { initialProfiles, type Profile } from '@/lib/profiles';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState, use } from 'react';
import Image from 'next/image';
import { useChat } from '@ai-sdk/react';
import { 
  ArrowLeft, 
  Send as SendIcon, 
  ShieldCheck, 
  Lock,
  Zap,
  Timer,
  CloudSun,
  Clock,
  Plus,
  Crown,
  CheckCircle2,
  X,
  MapPin,
  Image as ImageIcon,
  MessageSquare,
  History,
  Gift
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import VaultGallery from '@/components/chat/VaultGallery';
import TipModal from '@/components/chat/TipModal';
import ChatVaultItem from '@/components/chat/ChatVaultItem';

import VoiceMessage from '@/components/chat/VoiceMessage';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { useUser } from '@/components/providers/UserProvider';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// SHARED REALITY HELPER (Match Home Feed)
const getCityStatus = (profile: Profile) => {
    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: profile.timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
    
    const weatherPool: Record<string, string> = {
        'Santiago': '82°F • Clear',
        'Medellín': '74°F • Sunset',
        'Rio': '88°F • Tropical',
        'Madrid': '64°F • Starry'
    };
    
    return {
        time: timeFormatter.format(now),
        weather: weatherPool[profile.city] || '72°F • Clear'
    };
};

export default function VerdadChatPage(props: any) {
  const unwrappedParams: any = use(props.params);
  if (!unwrappedParams) return <div className="h-screen bg-black" />;
  const id = unwrappedParams.id;
  
  const { user: privyUser, profile: userProfile, ready: authReady } = useUser();
  const userId = userProfile?.id || 'guest';

  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'vault'>('chat');
  const [userBalance, setUserBalance] = useState(0);

  // Fetch real balance from the Sovereign Ledger
  useEffect(() => {
    if (!userId || userId === 'guest') return;
    fetch(`/api/economy/balance?userId=${userId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setUserBalance(d.balance); })
      .catch(() => {});
    const onRefresh = () => {
      fetch(`/api/economy/balance?userId=${userId}`)
        .then(r => r.json())
        .then(d => { if (d.success) setUserBalance(d.balance); })
        .catch(() => {});
    };
    window.addEventListener('gasp_balance_refresh', onRefresh);
    return () => window.removeEventListener('gasp_balance_refresh', onRefresh);
  }, [userId]);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [unlockedMedia, setUnlockedMedia] = useState<Record<string, string>>({}); // mediaId -> full_url
  const [dbProfile, setDbProfile] = useState<any>(null);

  // MULTI-TENANT LOOKUP: Check hardcoded fallback first, then DB
  const staticProfile = id ? initialProfiles.find(p => p.id.toLowerCase() === id.toLowerCase()) : null;
  const profile: any = staticProfile || dbProfile;
  const cityStatus = profile ? getCityStatus(profile) : { time: '00:00', weather: '...' };

  // 🧬 DB PROFILE FETCH: Load from Railway API if not in static roster
  useEffect(() => {
    if (staticProfile || !id) return; 
    fetch(`/api/admin/persona/${id}`)
      .then(r => r.json())
      .then(p => {
        if (p && p.id) {
          setDbProfile({
            ...p,
            image: p.seed_image_url || p.image || '/icons/icon-512x512.png',
            timezone: p.timezone || 'America/New_York',
            vault: [] 
          });
        }
      })
      .catch(() => {});
  }, [id, staticProfile]);

  const { messages, input, setMessages, handleInputChange, handleSubmit, isLoading, data }: any = useChat({
    api: '/api/chat',
    body: {
      userId: userId, 
      personaId: id,
      profileId: id, // compatibility
      cityContext: cityStatus 
    },
    onResponse: () => {
        setIsTyping(false);
    },
    onFinish: () => {
        setIsTyping(false);
        window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
    },
    onError: (err: any) => {
        setIsTyping(false);
        console.error('Chat Error:', err);
    }
  } as any);

  // 🧊 NEURAL HYDRATION: Load historical nodes from Railway API
  useEffect(() => {
    async function hydrateHistory() {
        try {
            console.log(`🧠 [Brain] Syncing neural history for ${profile?.name || 'persona'}...`);
            const res = await fetch(`/api/chat/history?userId=${userId}&personaId=${id}`);
            const data = await res.json();

            if (data.success && data.messages) {
                setMessages(data.messages.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    createdAt: new Date(m.createdAt),
                    content_type: m.content_type,
                    media_url: m.audio_url || m.media_url
                })));
            }
        } catch (err) {
            console.warn('[Brain] History hydration fail:', err);
        }
    }
    if (id && userId !== 'guest') hydrateHistory();
  }, [id, userId, setMessages]);

  // SYNDICATE: MARK AS READ (Handled via API in v2.1 Railway)
  useEffect(() => {
    // Legacy Supabase Sync removed.
  }, [id, messages]);

  // WHALE-HUNTER REVENUE ENGINE (Atomic Database Sync)
  const handleVaultUnlock = async (itemId: string) => {
    const item = profile?.vault?.find((i: any) => i.id === itemId);
    if (!item) return false;
    
    try {
        const res = await fetch('/api/economy/unlock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId, 
                mediaId: itemId, 
                amount: item.price || 25 
            })
        });
        const state = await res.json();
        
        if (res.ok && state.success) {
            setUnlockedMedia(prev => ({ ...prev, [itemId]: item.full }));
            window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
            return true;
        } else {
            console.error('Unlock failed', state.error);
            if (res.status === 400) setShowPaywall(true); 
            return false;
        }
    } catch (err) {
        console.error('[Economy Pulse] Unlock failed:', err);
        return false;
    }
  };

  // REAL ECONOMY UNLOCK (Step 5)
  const handleRealUnlock = async (mediaId: string) => {
    try {
        const res = await fetch('/api/economy/unlock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'mock-user-123', mediaId })
        });
        
        const result = await res.json();
        
        if (res.ok && result.success) {
            setUnlockedMedia(prev => ({ ...prev, [mediaId]: result.media_url }));
            return true;
        } else {
            console.error('Unlock failed', result.error);
            if (res.status === 400) setShowPaywall(true); 
            return false;
        }
    } catch (e) {
        console.error('Network error during unlock', e);
        return false;
    }
  };

  const handlePriorityTip = async (amount: number) => {
    return new Promise<boolean>((resolve) => {
        setTimeout(() => {
            setUserBalance(prev => prev - amount);
            
            // AUTO-GRATITUDE Logic (Mocked Insertion)
            const gratitudeMessage = {
                id: `gt-${Date.now()}`,
                role: 'assistant',
                content: `parce, thank you for the gift... it's late in ${profile?.city} but you've peaked my interest. check the gallery, i've unlocked a preview for you.`,
                is_priority: true
            };
            
            setMessages([...messages, { id: Date.now().toString(), role: 'user', content: `[Gift Sent: ${amount} Credits]`, is_priority: true }, gratitudeMessage]);
            resolve(true);
        }, 1500);
    });
  };

  const handleVerdadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(input || '').trim() || isLoading) return;

    setIsTyping(true);
    handleSubmit(e);
  };

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages, isTyping, isLoading, data]);

  if (!profile && !id) return <div className="p-20 text-center text-white uppercase font-black opacity-10">Disconnected</div>;

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans relative z-10 pointer-events-auto selection:bg-neon-purple selection:text-white">
      
      {/* 1. SIDEBAR (Desktop Only) */}
      <aside className="hidden lg:flex flex-col w-[380px] border-r border-white/5 bg-black p-8 shrink-0 overflow-y-auto relative z-20 pointer-events-auto">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-12 text-[10px] uppercase font-black tracking-[0.3em] font-outfit cursor-pointer pointer-events-auto"
        >
          <ArrowLeft size={16} />
          Marketplace
        </button>

        <div className="relative w-full aspect-[3/4] rounded-[2.5rem] overflow-hidden mb-10 border border-white/10 shadow-3xl grayscale-[0.2]">
           <ProfileAvatar src={profile?.image || '/v1.png'} alt={profile?.name} fill className="object-cover" />
           <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
           <div className="absolute top-6 left-6 px-3 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gasp-neon rounded-full shadow-[0_0_10px_rgba(0,240,255,1)]" />
              <span className="text-[8px] font-black uppercase tracking-widest text-white/80">Agency Uplink active</span>
           </div>
        </div>

        <div className="flex flex-col gap-8">
           <div className="flex flex-col">
              <h1 className="text-4xl font-outfit font-black uppercase italic tracking-tighter leading-none mb-1">
                {profile?.name} <span className="text-gasp-neon font-not-italic">{profile?.flag}</span>
              </h1>
              <p className="text-[10px] uppercase font-black tracking-widest text-white/30 italic">by {profile?.agency_name}</p>
           </div>
           
           <p className="text-white/40 text-sm leading-relaxed italic pr-6 lowercase">"{profile?.vibe}"</p>

           {/* User Wallet Info */}
           <div className="p-8 rounded-[2rem] bg-neon-purple/5 border border-neon-purple/10 shadow-xl overflow-hidden relative group cursor-pointer" onClick={() => setIsTipModalOpen(true)}>
              <div className="flex items-center justify-between mb-2">
                 <span className="text-[9px] font-black uppercase tracking-widest text-neon-purple">Credit Balance</span>
                 <Crown size={14} className="text-neon-purple animate-pulse group-hover:scale-125 transition-all" />
              </div>
              <div className="flex items-end gap-3 translate-y-2">
                 <span className="text-5xl font-outfit font-black italic tracking-tighter text-white">{userBalance}</span>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 pb-2">munchies active</span>
              </div>
           </div>
           
            {/* 🛡️ PROTOCOL LOYALTY TRACKER (v8.19) */}
            <div className="mt-4 p-6 rounded-[2rem] bg-gasp-neon/5 border border-gasp-neon/10 shadow-xl overflow-hidden relative group">
               <div className="flex items-center justify-between mb-4">
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gasp-neon">Genesis Snapshot active</span>
                  <Zap size={12} className="text-gasp-neon animate-pulse" />
               </div>
               
               <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">$GASPai Points</p>
                    <h4 className="text-3xl font-syncopate font-black italic tracking-tighter text-gasp-neon">
                       {userBalance.toLocaleString()} <span className="text-[10px] text-white/20">PTS</span>
                    </h4>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-3">
                     <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
                        <span className="text-white/30">Member Status</span>
                        <span className="text-white">Phase 01</span>
                     </div>
                     <button 
                        onClick={() => router.push('/docs/whitepaper')}
                        className="w-full py-3 rounded-xl bg-gasp-neon text-black text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                     >
                        Upgrade to Elite
                     </button>
                  </div>
               </div>
               
               {/* ⚖️ NJ-SAFE DISCLOSURE */}
               <p className="mt-4 text-[7px] font-black uppercase tracking-widest text-white/10 leading-relaxed text-center italic">
                  Points represent community rank & loyalty. No cash value.
               </p>
            </div>
            
            <button 
               onClick={() => setIsTipModalOpen(true)}
               className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 hover:border-neon-purple hover:bg-neon-purple/10 transition-all flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white mt-12"
            >
               Priority Infusion <Gift size={16} className="text-neon-purple" />
            </button>
        </div>
      </aside>

      {/* 2. MAIN CANVAS */}
      <main className="flex-1 flex flex-col relative bg-black relative z-10 pointer-events-auto">
        <header className="px-8 py-5 border-b border-white/5 flex items-center justify-between glass sticky top-0 z-[100]">
            <div className="flex items-center gap-4">
                <button onClick={() => router.push('/')} className="text-white/40 md:hidden pointer-events-auto"><ArrowLeft size={20} /></button>
                <div className="flex flex-col">
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase italic tracking-tight">{profile?.name} chat active</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Clock size={8} className="text-gasp-neon animate-pulse" />
                      <span className="text-[8px] font-black text-white/30 uppercase italic">{profile?.city}: {cityStatus.time}</span>
                   </div>
                </div>
            </div>
            
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
                        activeTab === 'chat' ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white"
                    )}
                >
                    <MessageSquare size={14} /> Feed
                </button>
                <button 
                    onClick={() => setActiveTab('vault')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
                        activeTab === 'vault' ? "bg-gasp-neon/20 text-gasp-neon shadow-[0_0_20px_rgba(0,240,255,0.1)]" : "text-white/30 hover:text-white"
                    )}
                >
                    <ImageIcon size={14} /> Vault
                </button>
            </div>
        </header>

        {/* Dynamic Content Surface */}
        <div className="flex-1 overflow-hidden relative no-scrollbar">
           <AnimatePresence mode="wait">
              {activeTab === 'chat' ? (
                <motion.div 
                    key="chat"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col h-full"
                >
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-14 flex flex-col gap-6 md:gap-10 no-scrollbar">
                            <div className="flex flex-col items-center gap-3 my-6 md:my-12 opacity-20 group cursor-default">
                               <div className="p-4 md:p-5 bg-white/5 rounded-3xl border border-dashed border-white/20 group-hover:border-gasp-neon transition-colors">
                                  <ShieldCheck className="w-8 h-8 md:w-11 md:h-11 text-white animate-pulse" />
                                </div>
                                <p className="text-[8px] md:text-[9px] uppercase font-black tracking-[0.6em] text-white text-center italic">Gasp Neutral Session // Protocol Verified</p>
                            </div>

                            {/* 🧬 CONVERSION RAIL: THE "MINI AD" (v8.19) */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mx-auto w-full max-w-xl p-8 rounded-[2.5rem] bg-gradient-to-r from-gasp-neon/10 to-neon-purple/10 border border-white/10 backdrop-blur-3xl overflow-hidden relative group mb-12"
                            >
                                <div className="absolute inset-0 bg-noise opacity-10 mix-blend-overlay" />
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="space-y-1 text-center md:text-left">
                                        <h4 className="text-lg font-syncopate font-black italic uppercase tracking-tighter text-white">Your Reward Pool</h4>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">1:1 Points Match Active • $GASPai Launch Incoming</p>
                                    </div>
                                    <button 
                                        onClick={() => router.push('/docs/whitepaper')}
                                        className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl"
                                    >
                                        View Protocol
                                    </button>
                                </div>
                            </motion.div>

                            {messages.map((msg: any) => {
                                let displayContent = msg.content;
                                const vaultMatch = displayContent.match(/\[DROP_VAULT:\s*([^\]]+)\]/);
                                if (vaultMatch) {
                                    displayContent = displayContent.replace(vaultMatch[0], '').trim();
                                }

                                if (msg.content_type === 'voice' || msg.media_url?.includes('.mp3')) {
                                    return (
                                        <div key={msg.id} className="mr-auto w-full flex flex-col gap-2 relative z-0">
                                            <VoiceMessage 
                                                audioUrl={msg.media_url} 
                                                profileName={profile?.name || 'Profile'} 
                                                isLocked={false}
                                            />
                                            {displayContent && (
                                                <div className="mr-auto px-7 py-4 text-white/50 text-xs italic lowercase opacity-40">
                                                    "{displayContent}"
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <motion.div key={msg.id} className="flex flex-col gap-2 relative z-0">
                                        <div
                                          className={cn(
                                            "max-w-[85%] md:max-w-[70%] text-[15.5px] md:text-[17px] leading-[1.8] font-medium tracking-tight whitespace-pre-wrap transition-all",
                                            msg.role === 'user' 
                                              ? "ml-auto px-7 py-5 bg-white/5 border border-white/10 rounded-[2.2rem] rounded-tr-none text-white shadow-2xl" 
                                              : "mr-auto px-7 py-6 text-white/90 lowercase relative",
                                            msg.is_priority && "border border-neon-purple shadow-[0_0_40px_rgba(188,19,254,0.3)] bg-neon-purple/5"
                                          )}
                                        >
                                          {displayContent}
                                          {msg.is_priority && (
                                            <div className="absolute -top-3 -right-3 p-1.5 bg-neon-purple rounded-lg shadow-glow-purple">
                                                <Zap size={10} className="text-white fill-current" />
                                            </div>
                                          )}
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {data?.map((d: any, i: number) => {
                                if (d.type === 'vault_trigger') {
                                    return (
                                        <ChatVaultItem 
                                            key={`vlt-${i}`} 
                                            mediaId={d.mediaId} 
                                            isUnlocked={unlockedMedia[d.mediaId] ? true : false}
                                            onUnlockRequest={handleRealUnlock} 
                                        />
                                    );
                                }
                                if (d.type === 'voice_note') {
                                    return (
                                        <div key={`vce-${i}`} className="mr-auto relative z-0">
                                            <VoiceMessage 
                                                audioUrl={d.audioUrl} 
                                                isLocked={d.isLocked} 
                                                profileName={profile?.name || 'Profile'}
                                                onUnlock={() => handleRealUnlock(d.audioUrl)}
                                            />
                                        </div>
                                    );
                                }
                                return null;
                            })}
                            
                            {(isLoading || isTyping) && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mr-auto p-1 relative z-0">
                                    {data?.some((d: any) => d.type === 'voice_note' && !d.audioUrl) ? (
                                        <VoiceMessage profileName={profile?.name || 'Profile'} />
                                    ) : (
                                        <div className="px-8 py-5 rounded-3xl bg-white/[0.03] border border-white/5">
                                            <div className="flex gap-2">
                                                <span className="w-1.5 h-1.5 bg-gasp-neon rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                            
                            {/* THE BOTTOM SPACER: Ensures clearance for the input bar */}
                            <div className="h-32 w-full shrink-0" />
                        </div>

                        {/* INPUT BAR: LOCKED TO BOTTOM OF CONTAINER */}
                        <div className="p-8 md:p-14 bg-black border-t border-white/5 relative z-50 pointer-events-auto">
                           <form onSubmit={handleVerdadSubmit} className="container max-w-4xl mx-auto flex items-center gap-6 pointer-events-auto">
                                <input 
                                    type="text"
                                    placeholder={`message ${profile?.name?.toLowerCase()}...`}
                                    value={input}
                                    onChange={handleInputChange}
                                    autoFocus
                                    className="flex-1 bg-[#080808] border border-white/5 rounded-2xl px-8 py-6 outline-none focus:border-gasp-neon/40 transition-all text-md placeholder:text-white/10 lowercase font-medium pointer-events-auto"
                                />
                                <div className="flex items-center gap-4">
                                    <button type="button" onClick={() => setIsTipModalOpen(true)} className="p-6 bg-white/5 rounded-2xl text-white/40 hover:text-neon-purple hover:bg-neon-purple/10 transition-all border border-transparent hover:border-neon-purple/20">
                                        <Gift size={24} />
                                    </button>
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        disabled={!input?.trim() || isLoading}
                                        className="bg-gasp-neon p-6 rounded-2xl text-black shadow-[0_0_40px_rgba(0,240,255,0.3)] disabled:grayscale disabled:opacity-10 transition-all pointer-events-auto"
                                    >
                                        <SendIcon size={24} />
                                    </motion.button>
                                </div>
                           </form>
                        </div>
                    </div>
                </motion.div>
              ) : (
                <motion.div 
                    key="vault"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6 md:p-14 pt-10"
                >
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-3xl font-outfit font-black italic uppercase italic tracking-tighter">Private <span className="text-gasp-neon">Media</span> Vault</h3>
                            <p className="text-[9px] uppercase font-black tracking-widest text-white/20 italic italic flex items-center gap-2">
                                <History size={12} /> Exclusively hosted by {profile?.agency_name}
                            </p>
                        </div>
                    </div>
                    
                    <VaultGallery 
                        items={profile?.vault || []} 
                        userBalance={userBalance}
                        onUnlock={handleVaultUnlock} 
                    />
                </motion.div>
              )}
           </AnimatePresence>
        </div>

        <TipModal 
            isOpen={isTipModalOpen}
            onClose={() => setIsTipModalOpen(false)}
            onTip={handlePriorityTip}
            userBalance={userBalance}
            profileName={profile?.name || ''}
        />

        {/* PAYWALL OVERLAY */}
        <AnimatePresence>
          {showPaywall && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl overflow-y-auto">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-obsidian-light border border-white/10 rounded-[4rem] p-10 md:p-14 shadow-4xl relative overflow-hidden text-center"
              >
                <X onClick={() => setShowPaywall(false)} className="absolute top-10 right-10 text-white/20 cursor-pointer" />
                <div className="flex flex-col items-center gap-8 py-6">
                   <div className="w-24 h-24 rounded-[2.5rem] bg-gasp-neon/10 border border-gasp-neon/20 flex items-center justify-center relative mb-4">
                      <Zap size={48} className="text-gasp-neon drop-shadow-neon" />
                   </div>
                   <h2 className="text-4xl font-outfit font-black italic uppercase tracking-tighter">Private Uplink <span className="text-gasp-neon">Required</span></h2>
                   <button className="w-full py-6 bg-gasp-neon text-black font-outfit font-black rounded-3xl text-[11px] uppercase tracking-[0.3em]" onClick={() => setIsTipModalOpen(true)}>
                      Priority Gift — 50 Credits
                   </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
      
      <style jsx global>{`
          .shadow-glow-purple {
              box-shadow: 0 0 20px rgba(188, 19, 254, 0.6);
          }
      `}</style>
    </div>
  );
}
