'use client';

import { X, Send, Plus, Minus, Trophy, HeartPulse, Trash2, ShoppingBag, Clock, Lock, Check, CheckCheck, Mic, Heart, Images, ZoomIn, Diamond, MessageSquare, Circle, Image as ImageIcon, Minus as MinimizeIcon, Gift, ArrowLeftRight, Zap, Star, ShieldAlert, Activity } from 'lucide-react';
import { initialProfiles, proxyImg } from '@/lib/profiles';
import { useRef, useEffect, useState, useCallback } from 'react';
import { COST_VOICE_TRANSLATION, COST_VOICE_NOTE } from '@/lib/economy/constants';
import Image from 'next/image';

import BondProgress from './profile/BondProgress';
import VoiceNoteBubble from './chat/VoiceNoteBubble';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from './providers/UserProvider';
import ProfileAvatar from './profile/ProfileAvatar';
import FreebieImageBubble from './chat/FreebieImageBubble';
import MediaLightbox from './chat/MediaLightbox';
import BrandingOverlay from './ui/BrandingOverlay';
import { getPersonaDailyState, type PersonaDailyState } from '@/lib/masterRandomizer';
import { COST_VAULT_UNLOCK, COST_PREMIUM_VAULT_UNLOCK } from '@/lib/economy/constants';

import { trackEvent } from '@/lib/telemetry';
import InsufficientFundsModal from './economy/InsufficientFundsModal';
import ChatCTA from './chat/ChatCTA';

interface ChatDrawerProps {
  profileId: string;
  profile: any;
  onClose: () => void;
  onMinimize: () => void;
  onOpenTopUp: () => void;
  followingIds?: string[];
  profiles?: any[];
  unreadCounts?: Record<string, number>;
  onSelectProfile?: (id: string) => void;
}

export default function ChatDrawer({ 
  profileId, 
  profile, 
  onClose, 
  onMinimize, 
  onOpenTopUp,
  followingIds = [],
  profiles = [],
  unreadCounts = {},
  onSelectProfile = () => {}
}: ChatDrawerProps) {
  const { profile: userProfile, login } = useUser();

  const [guestId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'guest-ssr';
    let gid = localStorage.getItem('gasp_guest_id');
    if (!gid) {
      gid = 'guest-' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('gasp_guest_id', gid);
    }
    return gid;
  });

  const idToUse = userProfile?.id || guestId;
  const [chatTab, setChatTab] = useState<'chat' | 'pics'>('chat');
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isPersonaRecording, setIsPersonaRecording] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [activeGift, setActiveGift] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [liveVoiceUrl, setLiveVoiceUrl] = useState<string | null>(null);
  
  const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedLightboxIndex, setSelectedLightboxIndex] = useState(0);
  const [lightboxItems, setLightboxItems] = useState<any[]>([]);
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  const [showVaultCTA, setShowVaultCTA] = useState(false);
  const [showLimitCTA, setShowLimitCTA] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatData, setChatData] = useState<any[]>([]);
  const [isRequestingVoice, setIsRequestingVoice] = useState(false);
  const [isDepleted, setIsDepleted] = useState(false);
  const [personaState, setPersonaState] = useState<PersonaDailyState | null>(null);
  const [bondScore, setBondScore] = useState(0);
  const [itemToUnlock, setItemToUnlock] = useState<any | null>(null);

  const sendGift = async (emoji: string, cost: number) => {
    if (isProcessing) return;
    const balance = userProfile?.credit_balance ?? 0;
    if (balance < cost && dbLoaded) {
       setShowInsufficientFunds(true);
       return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/economy/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: idToUse, action: 'spend', amount: cost, type: 'gift', meta: { gift: emoji, personaId: profileId } })
      });
      const data = await res.json();
      if (data.success) {
        setShowGifts(false);
        const giftItems: {[key: string]: string} = { '☕': 'Coffee', '🍹': 'Drink', '🍽️': 'Dinner', '🍾': 'Bottle Service', '✈️': 'Private Jet' };
        const giftName = giftItems[emoji] || 'Gift';
        const giftMsg = `[SENT_GIFT]: I just bought you a ${giftName} ${emoji}. Enjoy it.`;
        await sendMessage(giftMsg);
        window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
      } else {
        alert(data.error || 'Identity rejection on settlement.');
      }
    } catch (e: any) {
      console.error('[Gift] Settlement Error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const speedMult = personaState?.responseSpeedMultiplier || (0.8 + Math.random() * 1.5);
    const COST_MESSAGE_TEXT = 50;
    const balance = userProfile?.credit_balance ?? 0;
    
    // 🛡️ CREDIT WALL: Only trigger if profile is FULLY LOADED and balance is CONFIRMED low.
    // Do NOT fire if userProfile is null (still loading) — that's a false positive.
    if (dbLoaded && userProfile !== null && userProfile !== undefined && balance < COST_MESSAGE_TEXT) {
       setShowInsufficientFunds(true);
       return;
    }

    const userMsg = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setIsTyping(false);

    let activeConfig = { delayMultiplier: 1, typingStyle: 'monolith' };

    try {
      const reactionDelay = (800 + Math.random() * 1700) / speedMult;
      await wait(reactionDelay);
      setIsTyping(true);
      const startTypingDelay = (1000 + Math.random() * 2000) / speedMult;
      await wait(startTypingDelay);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userId: idToUse,
          personaId: profileId,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: typeof window !== 'undefined' ? (localStorage.getItem('gasp_locale') || 'en') : 'en',
          userBalance: balance,
        }),
      });

      if (!res.ok) {
        if (res.status === 402) {
           const errText = await res.text();
           if (errText.includes('DEPLETED')) {
              setShowLimitCTA(true);
            } else {
               setShowInsufficientFunds(true);
            }
        } else {
           setMessages(prev => [...prev, { id: 'err-' + Date.now(), role: 'assistant', content: 'hold on okay , give me a sec' }]);
        }
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let isVoiceDetected = false;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('2:')) {
            try {
              const event = JSON.parse(line.slice(2));
              if (event?.type === 'config') {
                 activeConfig = event;
                 if (event.isVoice) {
                    isVoiceDetected = true;
                    setIsPersonaRecording(true);
                 }
                 const baseDelay = 1000 + Math.random() * 2000;
                 const finalDelay = baseDelay / (activeConfig.delayMultiplier * speedMult);
                 await wait(finalDelay);
              }
            } catch (err) {}
          } else if (line.startsWith('d:')) {
            try {
              const event = JSON.parse(line.slice(2));
              if (event?.type === 'voice_note') {
                 isVoiceDetected = true;
                 if (event.audioUrl) {
                    setMessages(prev => {
                        const last = prev[prev.length - 1];
                        if (last?.role === 'assistant') {
                           return [...prev.slice(0, -1), { 
                             ...last, 
                             media_url: event.audioUrl, 
                             audio_script: event.audio_script || '...',
                             type: 'voice' 
                           }];
                        }
                        return prev;
                    });
                 }
              }
              if (event?.type === 'balance_refresh') {
                 window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
              }
            } catch (err) {}
          } else if (line.startsWith('0:')) {
            try { 
              const text = JSON.parse(line.slice(2)); 
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && last.id.startsWith('ai-')) {
                   return [...prev.slice(0, -1), { ...last, content: text }];
                }
                return [...prev, { id: 'ai-' + Date.now(), role: 'assistant', content: text, audio_script: (isVoiceDetected || (activeConfig as any).isVoice) ? '...' : null }];
              });
            } catch (err) {}
          }
        }
      }
    } catch (err: any) {
      console.error('[Terminal Error]:', err);
      // 🚀 AUTO-RESUME: Find the last unanswered user message and retry silently
      // This prevents the user from having to double-text to wake the persona back up
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
      if (lastUserMsg) {
        setTimeout(() => {
          sendMessage(lastUserMsg.content);
        }, 4000);
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setIsPersonaRecording(false);
      window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
    }
  }, [messages, isLoading, idToUse, profileId, personaState]);

  useEffect(() => {
    const loadData = async () => {
      if (!idToUse) return;
      try {
        const res = await fetch('/api/rpc/db', {
            method: 'POST',
            body: JSON.stringify({ action: 'chat-context', payload: { userId: idToUse, guestId, personaId: profileId } })
        });
        const result = await res.json();
        if (result.success) {
           setMessages(result.data.messages || []);
           setVaultItems(result.data.vaultItems || []);
           setIsDepleted(result.data.isDepleted || false);
           setBondScore(result.data.bondScore || 0);

           const gid = localStorage.getItem('gasp_guest_id');
           if (gid) {
             const fRes = await fetch('/api/rpc/db', {
               method: 'POST',
               body: JSON.stringify({ action: 'check-follow', payload: { userId: gid, personaId: profileId } })
             });
             const fJson = await fRes.json();
             if (fJson.success) setIsFollowing(fJson.isFollowing);
           }
        }
      } catch (e) {
        console.error('[Neural Sync Error]:', e);
      }
      const state = getPersonaDailyState(profileId);
      setPersonaState(state);
      setDbLoaded(true);
    };
    loadData();
  }, [profileId, idToUse, guestId]);

  useEffect(() => {
    if (scrollRef.current && chatTab === 'chat') {
        setTimeout(() => {
            const anchor = document.getElementById('chat-bottom-anchor');
            if (anchor) {
                anchor.scrollIntoView({ behavior: 'smooth', block: 'end' });
            } else {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }
        }, 100);
    }
  }, [messages, isLoading, chatTab, isTyping, isPersonaRecording, isRequestingVoice]);

  const handleLocalSubmit = () => {
    sendMessage(input);
  };

  const requestVoiceNote = async () => {
    if (isRequestingVoice || isLoading) return;
    const userId = idToUse;
    if (!userId || userId.startsWith('guest-')) {
      setShowLimitCTA(true);
      return;
    }

    setIsRequestingVoice(true);
    const scriptText = input.trim();
    if (!scriptText) {
       alert(isSpanish ? 'Escribe lo que quieres que diga primero.' : 'Type what you want her to say first.');
       setIsRequestingVoice(false);
       return;
    }

    try {
      const spendRes = await fetch('/api/economy/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'spend', amount: 1000, type: 'voice_note_request', meta: { personaId: profileId, script: scriptText } })
      });
      const spendData = await spendRes.json();
      if (!spendData.success) {
        setShowInsufficientFunds(true);
        return;
      }
      window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
      await sendMessage(isSpanish ? `[SAY]: "${scriptText}". Di esto exactamente en una nota de voz.` : `[SAY]: "${scriptText}". Say this exactly in a voice note.`);
      setInput('');
    } catch (err: any) {
      console.error('[VoiceRequest] Failed:', err.message);
    } finally {
      setIsRequestingVoice(false);
    }
  };

  const unlockItem = async (item: any) => {
     // 🧬 ADAPTIVE GATEWAY: Check balance BEFORE showing confirmation
     const cost = item.price_credits || 6000;
     const currentBalance = userProfile?.credit_balance || 0;

     if (currentBalance < cost) {
        // Force them into the offer wall immediately (The aggressive Window Shopper Trap)
        setShowInsufficientFunds(true);
        setItemToUnlock(null); 
        return;
     }

     // 🛡️ CONFIRMATION PROTOCOL: If they can afford it, ask twice
     if (!itemToUnlock || itemToUnlock.id !== item.id) {
        setItemToUnlock(item);
        return;
     }

     setIsProcessing(true);
     try {
        const res = await fetch('/api/economy/unlock', {
           method: 'POST',
           body: JSON.stringify({ userId: idToUse, mediaId: item.id, type: 'vault' })
        });
        const result = await res.json();
        if (result.success) {
           setVaultItems(prev => prev.map(v => v.id === item.id || v.mediaId === item.id ? { ...v, is_unlocked: true } : v));
           window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
           setItemToUnlock(null);
        } else {
            if (result.error?.includes('balance') || result.error?.includes('funds') || result.error?.includes('Insufficient')) {
               setShowInsufficientFunds(true);
            } else {
               alert(`Error: ${result.error || 'Connection error'}`);
            }
         }
      } catch (e: any) {
         console.error('[Gasp Unlock] Error:', e);
      } finally {
         setIsProcessing(false);
      }
  };

  const hasVault = vaultItems.some(v => v.is_vault);

    return (
      <>
        <div className="fixed inset-0 z-[950] bg-black/60 lg:hidden pointer-events-auto backdrop-blur-sm" onClick={onClose} />
        <div className="fixed inset-x-2 md:inset-x-0 bottom-1.5 md:bottom-0 z-[1000] lg:relative lg:inset-auto lg:z-auto flex flex-col w-[calc(100%-1rem)] md:w-[480px] h-[85dvh] lg:h-screen bg-black/40 backdrop-blur-3xl border-t lg:border-t-0 lg:border-l border-white/10 rounded-[2.5rem] lg:rounded-0 shadow-[0_-20px_100px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-700">
          
          <div className="flex flex-col bg-black/40 backdrop-blur-3xl border-b border-white/10 shrink-0 p-6 pb-0">
             <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-6 pt-2 border-b border-white/5 mb-4 px-2">
                <AnimatePresence>
                   {profiles.filter(p => followingIds.includes(p.id) && p.id !== profileId).map((p) => {
                      const unread = unreadCounts[p.id] || 0;
                      return (
                         <motion.button key={p.id} onClick={() => onSelectProfile(p.id)} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative shrink-0 flex flex-col items-center gap-1.5 group">
                            <div className="relative">
                               <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 p-0.5 bg-black/20 group-hover:border-[#ff00ff]/50 transition-all">
                                  <img src={p.image} className="w-full h-full object-cover rounded-full" alt={p.name} />
                               </div>
                               {unread > 0 && (
                                 <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#ff00ff] text-black text-[8px] font-black rounded-full flex items-center justify-center border-2 border-black shadow-[0_0_10px_rgba(255,0,255,0.6)] z-10 animate-in fade-in zoom-in duration-300">
                                    {unread > 99 ? '99+' : unread}
                                 </div>
                               )}
                            </div>
                            <span className="text-[7px] font-black uppercase text-white/30 group-hover:text-white transition-colors">{(p.name || 'ANON')?.split(' ')?.[0]}</span>
                         </motion.button>
                      );
                   })}
                </AnimatePresence>
             </div>

             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                   <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 bg-zinc-800 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                         <ProfileAvatar src={profile?.image || '/v1.png'} alt={profile?.name || ''} />
                      </div>
                   </div>
                   <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                         <h3 className="text-lg font-black uppercase text-white leading-none tracking-tighter italic">{profile?.name || ''}, {profile?.age || ''}</h3>
                         <div className="px-2 py-0.5 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-full flex items-center gap-1">
                            <div className="w-1 h-1 bg-[#00f0ff] rounded-full animate-pulse shadow-[0_0_5px_#00f0ff]" />
                            <span className="text-[7px] font-black text-[#00f0ff] uppercase tracking-widest">ACTIVE</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-60">
                         <span className="text-[7px] font-black uppercase tracking-widest text-[#ff00ff] italic">
                            {isSpanish ? 'Conexión Verificada' : 'Verified Connection'}
                         </span>
                      </div>
                      <div className="mt-1.5 w-full max-w-[140px]">
                         <BondProgress score={bondScore} variant="compact" />
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-3 text-white/40">
                   <button 
                      onClick={async (e) => {
                         e.stopPropagation();
                         const gid = localStorage.getItem('gasp_guest_id');
                         if (!gid) return;
                         const next = !isFollowing;
                         setIsFollowing(next);
                         try {
                           await fetch('/api/rpc/db', {
                             method: 'POST',
                             body: JSON.stringify({ action: 'toggle-follow', payload: { userId: gid, personaId: profileId, isFollowing: !next } })
                           });
                           window.dispatchEvent(new Event('gasp_sync_follows'));
                         } catch (err) { setIsFollowing(!next); }
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${isFollowing ? 'bg-[#ffea00]/10 border-[#ffea00]/40 text-[#ffea00]' : 'bg-white/5 border-white/10'}`}
                   >
                      <Star size={16} fill={isFollowing ? 'currentColor' : 'none'} />
                   </button>
                    <button onClick={() => setChatTab('pics')} className={`relative group transition-colors ${chatTab === 'pics' ? 'text-[#ff00ff]' : 'text-white/40'}`}>
                       <ShieldAlert size={18} />
                       {hasVault && <span className="absolute -top-1.5 -right-1.5 text-[7px] font-black bg-[#ff00ff] text-white px-1 rounded animate-pulse shadow-[0_0_10px_#ff00ff]">!!</span>}
                    </button>
                   <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><X size={16} /></button>
                </div>
             </div>

              <div className="flex gap-8">
                 <button onClick={() => setChatTab('chat')} className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 relative ${chatTab === 'chat' ? 'text-white' : 'text-white/30'}`}>
                    <MessageSquare size={13} /> {isSpanish ? 'CHAT' : 'CHAT'}
                    {chatTab === 'chat' && <motion.div layoutId="chat-tab-line" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00f0ff] shadow-[0_0_15px_#00f0ff]" />}
                 </button>
                 <button onClick={() => setChatTab('pics')} className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 relative ${chatTab === 'pics' ? 'text-white' : 'text-white/30'}`}>
                    {isSpanish ? 'ARCHIVO' : 'ARCHIVE'} <span className="animate-pulse">🌶️</span>
                    {chatTab === 'pics' && <motion.div layoutId="chat-tab-line" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#ff00ff] shadow-[0_0_15px_#ff00ff]" />}
                 </button>
              </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar scroll-smooth">
            {chatTab === 'chat' ? (
              <div className="space-y-8">
                {messages.map((msg: any, idx: number) => {
                  const isAssistant = msg.role === 'assistant';
                  return (
                    <div key={msg.id || idx} className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} gap-2`}>
                       {(msg.type === 'voice' || msg.audio_script) && msg.media_url ? (
                          <VoiceNoteBubble 
                             audioUrl={msg.media_url} 
                             profileImage={profile?.image}
                             profileName={profile?.name}
                             translation={msg.audio_translation}
                             isUnlocked={!msg.translation_locked}
                             isEnglish={profile?.language?.startsWith('en')}
                             onUnlockTranslation={async () => true}
                          />
                       ) : msg.type === 'image' || msg.image_url ? (
                          <FreebieImageBubble 
                             imageUrl={proxyImg(msg.image_url || msg.media_url)} 
                             profileImage={profile?.image} 
                             profileName={profile?.name} 
                             caption={msg.content} 
                          />
                        ) : (
                           <div className={`max-w-[85%] flex flex-col gap-2`}>
                              {isAssistant && (
                                  <div className="flex items-center gap-1.5 px-2 opacity-50">
                                     <span className="text-[8px] font-black uppercase tracking-widest text-white/40 italic">{profile?.name}</span>
                                  </div>
                              )}
                              <div className={`px-5 py-3.5 rounded-[2rem] text-[14px] leading-relaxed tracking-tight ${
                                 isAssistant ? 'bg-white/5 border border-white/10 text-white/90 font-medium' : 'bg-[#ff00ff]/90 text-white font-black shadow-lg'
                              }`}>
                                 {msg.content}
                              </div>
                           </div>
                        )}
                       {!isAssistant && (
                          <div className="flex items-center gap-1 px-1 opacity-20">
                             <span className="text-[7px] font-black uppercase tracking-widest">{isSpanish ? 'LEÍDO' : 'READ'}</span>
                             <CheckCheck size={10} className="text-[#00f0ff]" />
                          </div>
                       )}
                    </div>
                  );
                })}
                
                {/* 🦾 NEURAL SYNC HAPTICS */}
                {/* 🧬 NEURAL FEEDBACK: Typing / Recording Indicator */}
                 {(isTyping || isPersonaRecording) && (
                    <div className="flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                       <div className="w-10 h-10 rounded-full border border-white/5 overflow-hidden shrink-0 mt-2 relative">
                          <Image src={proxyImg(profile?.image)} alt={profile?.name || ''} fill className="object-cover blur-[2px]" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                             {isPersonaRecording ? <Mic size={14} className="text-[#00f0ff] animate-pulse" /> : <div className="w-1 h-1 bg-white rounded-full animate-bounce" />}
                          </div>
                       </div>
                       <div className="space-y-1.5 flex flex-col items-start max-w-[80%]">
                          <div className="bg-white/5 border border-white/10 px-5 py-3.5 rounded-[1.8rem] rounded-tl-none shadow-xl flex items-center gap-3">
                             <div className="flex gap-1.5">
                                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} className={`w-1.5 h-1.5 rounded-full ${isPersonaRecording ? 'bg-[#00f0ff]' : 'bg-white/40'}`} />
                                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} className={`w-1.5 h-1.5 rounded-full ${isPersonaRecording ? 'bg-[#00f0ff]' : 'bg-white/40'}`} />
                                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} className={`w-1.5 h-1.5 rounded-full ${isPersonaRecording ? 'bg-[#00f0ff]' : 'bg-white/40'}`} />
                             </div>
                             <span className={`text-[10px] font-black uppercase tracking-widest italic ${isPersonaRecording ? 'text-[#00f0ff]' : 'text-white/40'}`}>
                                {isPersonaRecording 
                                  ? (isSpanish ? 'GRABANDO NOTA...' : 'RECORDING VOICE...') 
                                  : (isSpanish ? 'ESCRIBIENDO...' : 'TYPING...')}
                             </span>
                                  {isPersonaRecording ? (<div className="flex items-center gap-2"><motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 1 }} className="text-[#ff00ff]">
                                     <Mic size={16} />
                                  </motion.div>
                                  <div className="flex gap-1 items-end h-3">
                                     {[0, 1, 2, 3, 4].map(i => (
                                        <motion.div key={i} animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }} className="w-0.5 bg-[#ff00ff]/60 rounded-full" />
                                     ))}
                                  </div>
                               </div>
                            ) : (
                               <div className="flex gap-1">
                                  <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.3s]" />
                                  <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.15s]" />
                                  <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-bounce" />
                               </div>
                            )}
                         </div>
                      </div>
                   </div>
                )}
                <div id="chat-bottom-anchor" className="h-[150px] shrink-0" />
                
                {/* 🧧 CONVERSION CTA: Injected when limit is hit */}
                {isDepleted && (
                   <div className="pb-10 pt-4 animate-in zoom-in fade-in duration-700">
                      <ChatCTA 
                        type={idToUse.startsWith('guest-') ? 'signup' : 'topup'} 
                        onAction={() => idToUse.startsWith('guest-') ? login() : onOpenTopUp()} 
                        personaName={profile?.name} 
                      />
                   </div>
                )}
              </div>
            ) : (
              <div className="pb-20">
                {!dbLoaded ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="flex gap-2">
                      <span className="w-2 h-2 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-[#00f0ff] rounded-full animate-bounce" />
                    </div>
                  </div>
                ) : vaultItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-20">
                    <Lock size={28} />
                    <p className="text-[9px] font-black uppercase tracking-widest">{isSpanish ? 'No hay fotos' : 'No pics'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {vaultItems.map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (!item.is_vault || item.is_unlocked) {
                            const viewableItems = vaultItems.filter((v: any) => !v.is_vault || v.is_unlocked).map((v: any) => ({ url: v.content_url || '', caption: v.caption }));
                            const itemIndex = viewableItems.findIndex((v: any) => v.url === item.content_url);
                            setSelectedLightboxIndex(itemIndex >= 0 ? itemIndex : 0);
                            setLightboxItems(viewableItems);
                            setLightboxOpen(true);
                          } else {
                            // 🏹 WINDOW SHOPPER TRAP: Clicking the blurred card directly triggers the unlock flow
                            unlockItem(item);
                          }
                        }}
                        className="relative aspect-[3/4] bg-zinc-900/80 rounded-2xl overflow-hidden border border-white/5 cursor-pointer group"
                      >
                        <Image src={proxyImg(item.content_url)} alt="Vault Media" fill unoptimized className={`object-cover transition-all ${item.is_vault && !item.is_unlocked ? 'blur-2xl opacity-50' : ''}`} />
                        {item.is_vault && !item.is_unlocked && (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 gap-3 bg-black/60">
                            {itemToUnlock?.id === item.id ? (
                               <div className="w-full space-y-3 animate-in fade-in zoom-in duration-300">
                                  <div className="text-center">
                                     <p className="text-[10px] font-black uppercase text-[#ffea00] tracking-widest mb-1">{isSpanish ? 'CONFIRMAR COMPRA' : 'CONFIRM PURCHASE'}</p>
                                     <p className="text-[7px] text-white/40 uppercase tracking-widest italic">{isSpanish ? 'SALDO ACTUAL:' : 'CURRENT BALANCE:'} {userProfile?.credit_balance?.toLocaleString() || 0} CR</p>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); unlockItem(item); }} disabled={isProcessing} className="w-full py-3 bg-[#ffea00] text-black text-[10px] font-black uppercase rounded-xl shadow-[0_0_20px_rgba(255,234,0,0.4)] flex items-center justify-center gap-2">
                                     {isProcessing ? <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Diamond size={12} fill="currentColor" />}
                                     {isSpanish ? `SÍ, DESBLOQUEAR (${item.price_credits || 6000} CR)` : `YES, UNLOCK (${item.price_credits || 6000} CR)`}
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); setItemToUnlock(null); }} className="w-full py-2 bg-white/5 border border-white/10 text-white/40 text-[8px] font-black uppercase rounded-xl hover:text-white transition-all">
                                     {isSpanish ? 'CANCELAR' : 'CANCEL'}
                                  </button>
                               </div>
                            ) : (
                               <>
                                  <Lock size={18} className="text-white/50 group-hover:text-[#ffea00] transition-colors" />
                                  <button onClick={(e) => { e.stopPropagation(); unlockItem(item); }} className="w-full py-2.5 bg-white text-black text-[9px] font-black uppercase rounded-xl hover:bg-[#ffea00] disabled:opacity-50 shadow-lg">
                                     {isProcessing ? '...' : (isSpanish ? 'DESBLOQUEAR' : 'UNLOCK') + ` · ${item.price_credits || 6000}cr`}
                                  </button>
                               </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-black/10 backdrop-blur-xl pb-[env(safe-area-inset-bottom,40px)] px-6 pt-4 relative border-t border-white/5 shrink-0">
              <AnimatePresence>
                {showGifts && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-6 right-6 mb-6 z-50 bg-[#111] border border-white/10 rounded-[2rem] p-6 shadow-2xl">
                      <div className="grid grid-cols-5 gap-3">
                         {[ { e: '☕', c: 500 }, { e: '🍹', c: 1500 }, { e: '🍽️', c: 7000 }, { e: '🍾', c: 25000 }, { e: '✈️', c: 100000 } ].map(g => (
                            <button 
                                key={g.e} 
                                onClick={(e) => { e.stopPropagation(); sendGift(g.e, g.c); }} 
                                disabled={isProcessing}
                                className="flex flex-col items-center gap-2 py-4 px-1 bg-black/60 border border-white/5 rounded-2xl hover:border-[#ff00ff]/50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                             >
                               <span className="text-2xl">{g.e}</span>
                               <span className="text-[7.5px] font-black text-white px-2 py-0.5 bg-white/10 rounded-full">{g.c.toLocaleString()}</span>
                            </button>
                         ))}
                      </div>
                   </motion.div>
                )}
              </AnimatePresence>

              <div className="relative group/input p-[1px] rounded-[2.5rem] overflow-hidden border border-white/10 focus-within:border-[#00f0ff]/50 transition-all">
                 <form onSubmit={(e) => { e.preventDefault(); handleLocalSubmit(); }} className={`relative z-10 bg-[#0a0a0a] rounded-[2.5rem] p-2 pr-2.5 pl-5 flex items-center gap-4 shadow-2xl`}>
                    <div className="flex items-center gap-5 text-white/40">
                       <button type="button" onClick={requestVoiceNote} disabled={isRequestingVoice || isLoading} className={`transition-colors ${isRequestingVoice ? 'text-[#00f0ff] animate-pulse' : 'hover:text-[#00f0ff]'}`}>
                         <Mic size={22} />
                       </button>
                       <button type="button" onClick={() => (isDepleted ? setShowInsufficientFunds(true) : setShowGifts(!showGifts))} className="hover:text-[#ff00ff]">
                          <Gift size={22} className={showGifts ? 'text-[#ff00ff]' : ''} />
                       </button>
                    </div>
                    <div className="flex-1 relative flex items-center">
                       <input 
                         type="text" 
                         value={input} 
                         onChange={(e) => setInput(e.target.value)} 
                         placeholder={isDepleted ? (isSpanish ? "DESBLOQUEAR CHAT..." : "UNLOCK CHAT...") : (isSpanish ? `chatear con ${profile?.name}...` : `chat w/ ${profile?.name}...`)} 
                         className="w-full bg-transparent py-4 text-sm text-white placeholder:text-zinc-600 outline-none" 
                         disabled={isLoading} 
                       />
                    </div>
                    <button type="submit" disabled={!(input || '').trim() || isLoading} className="w-12 h-12 rounded-full bg-[#ff00ff] flex items-center justify-center text-black shadow-lg hover:scale-110 active:scale-90 transition-all disabled:opacity-30">
                       <Send size={20} className="mr-0.5" />
                    </button>
                 </form>
              </div>
          </div>
          <InsufficientFundsModal isOpen={showInsufficientFunds} onClose={() => setShowInsufficientFunds(false)} onOpenTopUp={onOpenTopUp} personaName={profile?.name} />
          {lightboxOpen && <MediaLightbox items={lightboxItems} initialIndex={selectedLightboxIndex} onClose={() => setLightboxOpen(false)} />}
        </div>
      </>
    );
}
