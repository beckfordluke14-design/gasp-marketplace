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

  // 🔑 SOVEREIGN SYNC: Initialize synchronously to prevent disabled button race condition
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
  const [showGifts, setShowGifts] = useState(false);
  const [activeGift, setActiveGift] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [liveVoiceUrl, setLiveVoiceUrl] = useState<string | null>(null);
  
  // 🌍 GLOBAL LOCALE STATE
  const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedLightboxIndex, setSelectedLightboxIndex] = useState(0);
  const [lightboxItems, setLightboxItems] = useState<any[]>([]);
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  const [showVaultCTA, setShowVaultCTA] = useState(false);
  const [showLimitCTA, setShowLimitCTA] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 🧠 SOVEREIGN CHAT ENGINE: Custom fetch-based, bypasses AI SDK entirely
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatData, setChatData] = useState<any[]>([]);
  const [isRequestingVoice, setIsRequestingVoice] = useState(false);
  const [isDepleted, setIsDepleted] = useState(false);
  const [personaState, setPersonaState] = useState<PersonaDailyState | null>(null);


  // 🎁 GIFT PROTOCOL: Charges credits and sends a notification
  const sendGift = async (emoji: string, cost: number) => {
    if (isProcessing) return;
    
    // 🛡️ LOCK GUEST: Guests must have credits or sign up
    const balance = userProfile?.credit_balance || 0;
    if (idToUse.startsWith('guest-') && balance < cost) {
       setShowInsufficientFunds(true);
       return;
    }

    if (balance < cost) {
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
        // 🧬 PERSONA AWARENESS: Send a literal trigger for the AI to react to
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
    
    // 🧬 VARIATION ENGINE: Dynamic speed based on randomizer
    const speedMult = personaState?.responseSpeedMultiplier || (0.8 + Math.random() * 1.5);


    // 🛡️ FRONTEND CREDIT ENFORCEMENT: Block transmit if balance is depleted
    const COST_MESSAGE_TEXT = 50;
    const balance = userProfile?.credit_balance || 0;
    if (!idToUse.startsWith('guest-') && balance < COST_MESSAGE_TEXT) {
       setShowInsufficientFunds(true);
       return;
    }

    const userMsg = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    
    // 🛡️ REACTION DELAY (Reading/Thinking): Dots are NOT shown yet.
    setIsTyping(false);

    let activeConfig = { delayMultiplier: 1, typingStyle: 'monolith' };

    try {
      // ⏳ HUMAN REACTION: 0.8s to 2.5s base, adjusted by persona speed
      const reactionDelay = (800 + Math.random() * 1700) / speedMult;
      await wait(reactionDelay);

      // 🦾 START TYPING: Dots appear now.
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
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('[Gasp Chat] API error:', res.status, errText);
        // 🛡️ LIMIT TRIGGER: Show specific CTA for 402 (DEPLETED / Insufficient)
        if (res.status === 402) {
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
        const lines = (buffer || '').split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('2:')) {
            try {
              const event = JSON.parse(line.slice(2));
              if (event?.type === 'config') {
                 activeConfig = event;
                 if (event.isVoice) isVoiceDetected = true;
                 
                 // 🧬 RANDOMIZED RESPONSE DELAY: scaled by persona state
                 const baseDelay = 1000 + Math.random() * 2000;
                 const finalDelay = baseDelay / (activeConfig.delayMultiplier * speedMult);
                 await wait(finalDelay);
              }
              if (event?.type === 'voice_note') {
                 console.log('📡 [Sovereign Stream] Voice Event Received:', !!event.audioUrl ? 'READY' : 'PENDING');
                 isVoiceDetected = true;
                 if (event.audioUrl) {
                    setLiveVoiceUrl(event.audioUrl);
                    setChatData(prev => [...prev, event]);
                    setMessages(prev => {
                        const last = prev[prev.length - 1];
                        if (last?.role === 'assistant') {
                           return [...prev.slice(0, -1), { 
                             ...last, 
                             media_url: event.audioUrl, 
                             audio_script: event.nativeScript || '...',
                             type: 'voice' 
                           }];
                        }
                        return prev;
                    });
                 }
              }
            } catch {}
          } else if (line.startsWith('0:')) {
            try { 
              const text = JSON.parse(line.slice(2)); 
              
              // 🧪 FRAGMENTATION RANDOMIZER (Internal Burst Logic)
              const style = activeConfig.typingStyle || 'monolith';
              const forceBurst = style === 'burst' || (Math.random() < 0.2 && text.length > 100);
              const fragments = forceBurst ? text.split(/[.!?]\s+/).filter((f: string) => f.trim().length > 0) : [text];

              if (fragments.length > 1) {
                 for (let i = 0; i < fragments.length; i++) {
                    let frag = fragments[i];
                    // Re-add punctuation if missing due to split
                    if (forceBurst && !frag.match(/[.!?]$/)) frag += '.';

                    setMessages(prev => [...prev, { 
                        id: `ai-${Date.now()}-${i}`, 
                        role: 'assistant', 
                        content: frag,
                        audio_script: (i === fragments.length - 1 && (isVoiceDetected || (activeConfig as any).isVoice)) ? '...' : null 
                    }]);
                    
                    if (i < fragments.length - 1) {
                        // ⏳ INTER-BUBBLE PAUSE: Stop typing, then start again (texting feel)
                        setIsTyping(false);
                        const silentPause = (1000 + Math.random() * 1500) / speedMult;
                        await wait(silentPause);
                        
                        setIsTyping(true);
                        const resumeTyping = (800 + Math.random() * 1200) / speedMult;
                        await wait(resumeTyping);
                    }
                 }
              } else {
                 setMessages(prev => {
                   const last = prev[prev.length - 1];
                   if (last?.role === 'assistant' && last.id.startsWith('ai-')) {
                      return [...prev.slice(0, -1), { ...last, content: text }];
                   }
                   return [...prev, { id: 'ai-' + Date.now(), role: 'assistant', content: text, audio_script: (isVoiceDetected || (activeConfig as any).isVoice) ? '...' : null }];
                 });
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      console.error('[Syndicate Terminal] Stream Error:', err);
      setMessages(prev => [...prev, { id: 'err-' + Date.now(), role: 'assistant', content: 'hold on okay , give me a sec' }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      // 💸 Trigger instant balance refresh in the header after credit burn
      window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
    }

  }, [messages, isLoading, idToUse, profileId]);


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

           // Fetch following status
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
        console.error('[Gasp Neural Sync] Error:', e);
      }

      // 🎰 INITIALIZE PERSONALITY VARIATION
      const state = getPersonaDailyState(profileId);
      setPersonaState(state);

      setDbLoaded(true);
    };
    loadData();
  }, [profileId, idToUse]);


  useEffect(() => {
    if (!chatData || !Array.isArray(chatData)) return;
    const voiceEvent = chatData.find((d: any) => d?.type === 'voice_note' && d?.audioUrl);
    if (voiceEvent?.audioUrl && voiceEvent.audioUrl !== liveVoiceUrl) {
      setLiveVoiceUrl(voiceEvent.audioUrl);
    }
  }, [chatData]);

  useEffect(() => {
    if (scrollRef.current && chatTab === 'chat') {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, chatData, isLoading, chatTab]);

  const handleLocalSubmit = () => {
    sendMessage(input);
  };

  // 🎙️ VOICE NOTE REQUEST: Charges 1,000 credits and forces a voice note response
  const requestVoiceNote = async () => {
    if (isRequestingVoice || isLoading) return;
    const guestId = typeof window !== 'undefined' ? localStorage.getItem('gasp_guest_id') : null;
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
      // 1. Deduct 1,000 credits atomically
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

      // 2. Refresh balance display immediately
      window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));

      // 3. Send the specific script request
      await sendMessage(isSpanish ? `[SAY]: "${scriptText}". Di esto exactamente en una nota de voz.` : `[SAY]: "${scriptText}". Say this exactly in a voice note.`);
      setInput(''); // Clear input after successful request


    } catch (err: any) {
      console.error('[VoiceRequest] Failed:', err.message);
    } finally {
      setIsRequestingVoice(false);
    }
  };



  const unlockItem = async (item: any) => {
     setIsProcessing(true);
     try {
        const res = await fetch('/api/economy/unlock', {
           method: 'POST',
           body: JSON.stringify({ userId: idToUse, mediaId: item.id, type: 'vault' })
        });
        const result = await res.json();
        if (result.success) {
           setVaultItems(prev => prev.map(v => v.id === item.id || v.mediaId === item.id ? { ...v, is_unlocked: true } : v));
           // 💸 Trigger instant balance refresh in the header
           window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
        } else {
            if (result.error?.includes('balance') || result.error?.includes('funds') || result.error?.includes('Insufficient')) {
               setShowVaultCTA(true);
            } else {
               alert(`Error: ${result.error || 'Connection error'}`);
            }
         }
      } catch (e: any) {
         console.error('[Gasp Unlock] Error:', e);
         alert(`Connection lost: ${e.message || 'Check Network'}`);
      } finally {
         setIsProcessing(false);
      }
  };

   const hasVault = vaultItems.some(v => v.is_vault);

    return (
      <>
        {/* MOBILE BACKDROP Overlay */}
        <div 
          className="fixed inset-0 z-[950] bg-black/60 lg:hidden pointer-events-auto backdrop-blur-sm shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"
          onClick={onClose}
        />
        
        {/* Main Sheet Container - Immersive Transparency */}
        <div className="fixed inset-x-2 md:inset-x-0 bottom-1.5 md:bottom-0 z-[1000] lg:relative lg:inset-auto lg:z-auto flex flex-col w-[calc(100%-1rem)] md:w-[480px] h-[85dvh] lg:h-screen bg-black/40 backdrop-blur-3xl border-t lg:border-t-0 lg:border-l border-white/10 rounded-[2.5rem] lg:rounded-0 shadow-[0_-20px_100px_rgba(0,0,0,0.8)] overflow-hidden font-outfit transition-all duration-700">
          
          {/* Header Block */}
          <div className="flex flex-col bg-black/40 backdrop-blur-3xl border-b border-white/10 shrink-0 p-6 pb-0">
             
             {/* 🧬 DYNAMIC FAVORITE SWITCHER (Horizontal Slide) */}
             <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-6 pt-2 border-b border-white/5 mb-4 px-2">
                <AnimatePresence>
                   {profiles.filter(p => followingIds.includes(p.id) && p.id !== profileId).map((p) => {
                      const unread = unreadCounts[p.id] || 0;
                      return (
                         <motion.button
                            key={p.id}
                            onClick={() => onSelectProfile(p.id)}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative shrink-0 flex flex-col items-center gap-1.5 group"
                         >
                            <div className="relative">
                               <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 p-0.5 bg-black/20 group-hover:border-[#ff00ff]/50 transition-all">
                                  <img src={p.image} className="w-full h-full object-cover rounded-full" />
                               </div>
                               
                               {/* 🧧 SMART UNREAD BADGE (99+ Logic) */}
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
                   
                   {/* ➕ ADD FAVORITE HINT (If room) */}
                   {followingIds.length < 5 && (
                      <button 
                        onClick={() => onClose()}
                        className="shrink-0 w-12 h-12 rounded-full border border-dashed border-white/10 flex items-center justify-center text-white/10 hover:text-white/40 hover:border-white/20 transition-all"
                      >
                         <Plus size={16} />
                      </button>
                   )}
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
                         <h3 className="text-lg font-black uppercase text-white leading-none tracking-tighter italic">{profile?.name || ''}</h3>
                         <div className="px-2 py-0.5 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-full flex items-center gap-1">
                            <div className="w-1 h-1 bg-[#00f0ff] rounded-full animate-pulse shadow-[0_0_5px_#00f0ff]" />
                            <span className="text-[7px] font-black text-[#00f0ff] uppercase tracking-widest">ACTIVE</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-60">
                         <SparkleIcon size={8} className="text-[#ff00ff]" />
                         <span className="text-[7px] font-black uppercase tracking-widest text-[#ff00ff] italic font-syncopate">
                            {isSpanish ? 'Conexión Verificada' : 'Verified Connection'}
                         </span>
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
                         } catch (err) {
                           setIsFollowing(!next);
                         }
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${isFollowing ? 'bg-[#ffea00]/10 border-[#ffea00]/40 text-[#ffea00] shadow-[0_0_15px_rgba(255,234,0,0.2)]' : 'bg-white/5 border-white/10 hover:text-white'}`}
                   >
                      <Star size={16} fill={isFollowing ? 'currentColor' : 'none'} />
                   </button>
                    <button onClick={() => setChatTab('pics')} className={`relative group transition-colors ${chatTab === 'pics' ? 'text-[#ff00ff]' : 'text-white/40 hover:text-white'}`}>
                       <ShieldAlert size={18} />
                       {hasVault && (
                          <span className="absolute -top-1.5 -right-1.5 text-[7px] font-black bg-[#ff00ff] text-white px-1 rounded animate-pulse shadow-[0_0_10px_#ff00ff]">
                            !!
                          </span>
                       )}
                       {/* TOOLTIP */}
                       <div className="absolute -bottom-8 right-0 px-2 py-1 bg-black border border-white/10 text-[6px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {isSpanish ? 'Archivo Restringido' : 'Restricted Archive'}
                       </div>
                    </button>
                   <button className="hover:text-white transition-colors opacity-30"><Trophy size={18} /></button>
                   <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"><X size={16} /></button>
                </div>
             </div>

              <div className="flex gap-8">
                 <button onClick={() => setChatTab('chat')} className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all relative ${chatTab === 'chat' ? 'text-white' : 'text-white/30'}`}>
                    <MessageSquare size={13} className={chatTab === 'chat' ? 'text-[#00f0ff]' : ''} /> {isSpanish ? 'CHAT' : 'CHAT'}
                    {chatTab === 'chat' && <motion.div layoutId="chat-tab-line" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00f0ff] shadow-[0_0_15px_#00f0ff]" />}
                 </button>
                 <button onClick={() => setChatTab('pics')} className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all relative ${chatTab === 'pics' ? 'text-white' : 'text-white/30'}`}>
                    {isSpanish ? 'ARCHIVO' : 'ARCHIVE'}
                    {chatTab === 'pics' && <motion.div layoutId="chat-tab-line" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00f0ff] shadow-[0_0_15px_#00f0ff]" />}
                 </button>
              </div>
          </div>

          {/* Stream Block - Adaptive Readability */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar scroll-smooth bg-transparent">
            {chatTab === 'chat' ? (
              <div className="space-y-8">
                <div className="flex flex-col items-center justify-center gap-3 py-6 border-b border-white/5 opacity-40">
                   <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/40 italic">
                      {isSpanish ? 'Conectado al Archivo' : 'Connected to the Archive'}
                   </p>
                </div>

                {messages.map((msg: any, idx: number) => {
                  const isAssistant = msg.role === 'assistant';
                  return (
                    <div key={msg.id || idx} className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} gap-2`}>
                       {/* EXCLUSIVE RENDERING LOGIC: Voice OR Text, not both */}
                       {msg.type === 'voice' || msg.audio_script ? (
                          <VoiceNoteBubble 
                             audioUrl={msg.media_url || liveVoiceUrl || ''} 
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
                                 isAssistant 
                                 ? 'bg-white/5 backdrop-blur-3xl text-white/90 font-medium border border-white/10 shadow-2xl relative overflow-hidden group' 
                                 : 'bg-[#ff00ff]/90 backdrop-blur-xl text-white font-black shadow-[0_15px_40px_rgba(255,0,255,0.4)]'
                              }`}>
                                 {isAssistant && (
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#ffea00]/30 to-transparent" />
                                 )}
                                 {msg.content}
                              </div>
                           </div>
                        )}
                       {!isAssistant && (
                          <div className="flex items-center gap-1 px-1">
                             <span className="text-[7px] font-black uppercase text-white/20 tracking-widest">{isSpanish ? 'LEÍDO' : 'READ'}</span>
                             <CheckCheck size={10} className="text-[#00f0ff]" />
                          </div>
                       )}
                    </div>
                  );
                })}
                {/* 🦾 NEURAL SYNC HAPTICS (REAL TEXTING FEEL) */}
                {(isTyping || isRequestingVoice) && (
                   <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex items-center gap-2 px-2">
                         <div className={`w-1 h-1 rounded-full ${isRequestingVoice ? 'bg-[#ff00ff]' : 'bg-[#00f0ff]'} animate-pulse shadow-[0_0_8px_currentColor]`} />
                         {isRequestingVoice && (
                            <span className="text-[7px] font-black uppercase tracking-widest text-[#ff00ff] italic">
                               {isSpanish ? 'Generando Voz...' : 'Generating Voice...'}
                            </span>
                         )}
                      </div>
                      <div className="flex items-start gap-2">
                         <div className="px-4 py-3 bg-white/5 backdrop-blur-3xl border border-white/5 rounded-full flex gap-1.5 items-center">
                            {isRequestingVoice ? (
                               <div className="flex items-center gap-3 pr-2">
                                  <motion.div 
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="text-[#ff00ff]"
                                  >
                                     <Mic size={16} />
                                  </motion.div>
                                  <div className="flex gap-1 items-end h-3">
                                     {[0, 1, 2, 3, 4].map(i => (
                                        <motion.div 
                                          key={i}
                                          animate={{ height: [4, 12, 4] }}
                                          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                                          className="w-0.5 bg-[#ff00ff]/60 rounded-full"
                                        />
                                     ))}
                                  </div>
                               </div>
                            ) : (
                               <>
                                  <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.3s] shadow-[0_0_8px_#00f0ff]" />
                                  <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.15s] shadow-[0_0_8px_#00f0ff]" />
                                  <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-bounce shadow-[0_0_8px_#00f0ff]" />
                               </>
                            )}
                         </div>
                      </div>
                   </div>
                )}

                {/* 🧧 CONVERSION CTA: High-status signup for guests */}
                {showLimitCTA && (
                   <div className="pb-10">
                      <ChatCTA 
                        type="signup" 
                        onAction={() => login()} 
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
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">
                       {isSpanish ? 'Sincronizando bóveda...' : 'Syncing vault...'}
                    </p>
                  </div>
                ) : vaultItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Lock size={28} className="text-white/10" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">
                       {isSpanish ? 'No hay fotos disponibles' : 'No pics available yet'}
                    </p>
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
                          }
                        }}
                        className="relative aspect-[3/4] bg-zinc-900/80 rounded-2xl overflow-hidden border border-white/5 shadow-xl cursor-pointer group"
                      >
                        {/* Media preview — blurred if locked */}
                        {item.content_url && (item.type === 'video' || item.content_url.toLowerCase().endsWith('.mp4')) ? (
                          <video
                            src={proxyImg(item.content_url)}
                            muted playsInline autoPlay loop
                            className={`absolute inset-0 w-full h-full object-cover transition-all ${item.is_vault && !item.is_unlocked ? 'blur-2xl scale-110 opacity-50' : 'opacity-100'}`}
                          />
                        ) : (
                          <Image
                            src={proxyImg(item.content_url)}
                            alt="Vault Media"
                            fill
                            unoptimized
                            className={`object-cover transition-all ${item.is_vault && !item.is_unlocked ? 'blur-2xl scale-110 opacity-50' : 'opacity-100'}`}
                          />
                        )}

                        {/* Lock overlay */}
                        {item.is_vault && !item.is_unlocked && (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 gap-3 bg-black/60">
                            <Lock size={18} className="text-white/50" />
                            <button
                              onClick={(e) => { e.stopPropagation(); unlockItem(item); }}
                              disabled={isProcessing}
                              className="w-full py-2.5 bg-white text-black text-[9px] font-black uppercase rounded-xl hover:bg-[#ffea00] transition-colors disabled:opacity-50 shadow-lg"
                            >
                              {isProcessing 
                                 ? (isSpanish ? 'SINCRONIZANDO...' : 'SYNCING...') 
                                 : (isSpanish ? 'DESBLOQUEAR' : 'UNLOCK') + ` · ${item.price_credits || item.price || 6000}cr`}
                            </button>
                          </div>
                        )}

                        {/* Unlocked badge */}
                        {(!item.is_vault || item.is_unlocked) && (
                          <div className="absolute top-2 right-2 z-20 bg-black/60 rounded-full p-1">
                            <Check size={10} className="text-[#00f0ff]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ⛽ TOP UP CTA: Triggered by failed purchase */}
                {showVaultCTA && (
                   <div className="mt-8">
                      <ChatCTA 
                        type="topup" 
                        onAction={onOpenTopUp} 
                        balance={userProfile?.credit_balance || 0}
                      />
                   </div>
                )}
              </div>
            )}
          </div>

          {/* Input Block - Bottom Overlay */}
          <div className="bg-black/10 backdrop-blur-xl pb-[env(safe-area-inset-bottom,40px)] px-6 pt-4 relative border-t border-white/5">
             <AnimatePresence>
                {showGifts && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-6 right-6 mb-6 z-50 bg-[#111] border border-white/10 rounded-[2rem] p-6 shadow-2xl">
                      <div className="flex items-center justify-between mb-4 px-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-[#ff00ff]">{isSpanish ? 'Enviar Regalo' : 'Send Gift'}</span>
                         <button onClick={() => setShowGifts(false)} className="text-white/40 hover:text-white"><X size={14} /></button>
                      </div>
                      <div className="grid grid-cols-5 gap-3">
                         {[ 
                           { e: '☕', c: 500 }, 
                           { e: '🍹', c: 1500 }, 
                           { e: '🍽️', c: 7000 }, 
                           { e: '🍾', c: 25000 }, 
                           { e: '✈️', c: 100000 }
                         ].map(g => (
                            <button key={g.e} onClick={() => sendGift(g.e, g.c)} className="flex flex-col items-center gap-2 py-4 px-1 bg-black/40 border border-white/5 rounded-2xl hover:border-[#ff00ff]/50 transition-all">
                               <span className="text-2xl">{g.e}</span>
                               <span className="text-[7.5px] font-black text-white px-2 py-0.5 bg-white/5 rounded-full">{g.c.toLocaleString()} {isSpanish ? 'CRÉDITOS' : 'CREDITS'}</span>
                            </button>
                         ))}
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>

              <div className="relative group/input p-[1px] rounded-[2.5rem] overflow-hidden border border-white/10 focus-within:border-[#00f0ff]/50 transition-all">
                 
                 <form 
                   onSubmit={(e) => { e.preventDefault(); handleLocalSubmit(); }}
                   className={`relative z-10 bg-[#0a0a0a] rounded-[2.5rem] p-2 pr-2.5 pl-5 flex items-center gap-4 shadow-2xl backdrop-blur-3xl transition-all ${isDepleted ? 'grayscale opacity-50' : ''}`}
                 >
                    <div className="flex items-center gap-5 text-white/40">
                       <button type="button" className="hover:text-white transition-colors" disabled={isDepleted}><Plus size={22} /></button>
                       <button 
                         type="button" 
                         onClick={requestVoiceNote}
                         disabled={isRequestingVoice || isLoading || isDepleted}
                         title="Request Voice Note · 1,000 credits"
                         className={`transition-colors relative ${isRequestingVoice ? 'text-[#00f0ff] animate-pulse' : 'hover:text-[#00f0ff]'}`}
                       >
                         {isRequestingVoice 
                           ? <div className="w-[22px] h-[22px] rounded-full border-2 border-[#00f0ff] border-t-transparent animate-spin" />
                           : <Mic size={22} />
                         }
                       </button>
                       <button type="button" onClick={() => (isDepleted ? setShowLimitCTA(true) : setShowGifts(!showGifts))} className="hover:text-[#ff00ff] transition-colors">
                          <Gift size={22} className={showGifts ? 'text-[#ff00ff] drop-shadow-[0_0_10px_#ff00ff]' : ''} />
                       </button>
                    </div>
                    <div className="flex-1 relative flex items-center">
                       <input 
                          type="text" 
                          value={input} 
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleLocalSubmit(); } }}
                          placeholder={isDepleted ? (isSpanish ? "MENSAJERÍA DESACTIVADA..." : "MESSAGING DISABLED...") : (isSpanish ? `chatear con ${profile?.name}...` : `chat w/ ${profile?.name}...`)} 
                          className="w-full bg-transparent py-4 text-sm text-white placeholder:text-zinc-600 outline-none"
                          disabled={isLoading || isDepleted}
                       />
                    </div>
                    <button 
                      type="submit"
                      disabled={!(input || '').trim() || isLoading || isDepleted}
                      className="w-12 h-12 rounded-full bg-[#ff00ff] flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:scale-110 active:scale-90 transition-all disabled:opacity-30 disabled:grayscale"
                    >
                       <Send size={20} className="mr-0.5" />
                    </button>
                 </form>
              </div>
          </div>
          {/* ⛽ INSUFFICIENT FUNDS TRIGGER */}
          <InsufficientFundsModal 
            isOpen={showInsufficientFunds}
            onClose={() => setShowInsufficientFunds(false)}
            onOpenTopUp={onOpenTopUp}
            personaName={profile?.name}
          />
        </div>
      </>
    );
}

function SparkleIcon({ size, className }: { size: number, className: string }) {
  return (
    <div className={className}>
       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
       </svg>
    </div>
  );
}
