'use client';

import { X, Send, Plus, Minus, Trophy, HeartPulse, Trash2, ShoppingBag, Clock, Lock, Check, CheckCheck, Mic, Heart, Images, ZoomIn, Diamond, MessageSquare, Circle, Image as ImageIcon, Minus as MinimizeIcon, Gift, ArrowLeftRight, Zap, Star } from 'lucide-react';
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
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedLightboxIndex, setSelectedLightboxIndex] = useState(0);
  const [lightboxItems, setLightboxItems] = useState<any[]>([]);
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  const [showVaultCTA, setShowVaultCTA] = useState(false);
  const [showLimitCTA, setShowLimitCTA] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 🧠 SOVEREIGN CHAT ENGINE: Custom fetch-based, bypasses AI SDK entirely
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatData, setChatData] = useState<any[]>([]);
  const [isRequestingVoice, setIsRequestingVoice] = useState(false);


  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userId: idToUse,
          personaId: profileId,
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
              setShowVaultCTA(true);
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
          if (line.startsWith('0:')) {
            try { 
              const text = JSON.parse(line.slice(2)); 
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && last.id.startsWith('ai-')) {
                   return [...prev.slice(0, -1), { ...last, content: text }];
                }
                return [...prev, { id: 'ai-' + Date.now(), role: 'assistant', content: text, audio_script: isVoiceDetected ? '...' : null }];
              });
            } catch {}
          } else if (line.startsWith('2:')) {
            try {
              const event = JSON.parse(line.slice(2));
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
            body: JSON.stringify({ action: 'chat-context', payload: { userId: idToUse, personaId: profileId } })
        });
        const result = await res.json();
        if (result.success) {
           setMessages(result.data.messages || []);
           setVaultItems(result.data.vaultItems || []);
           setCurrentBalance(result.data.balance || 0);

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
    try {
      // 1. Deduct 1,000 credits atomically
      const spendRes = await fetch('/api/economy/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'spend', amount: 1000, type: 'voice_note_request', meta: { personaId: profileId } })
      });
      const spendData = await spendRes.json();

      if (!spendData.success) {
        setShowInsufficientFunds(true);
        return;
      }

      // 2. Refresh balance display immediately
      window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));

      // 3. Send a hidden trigger message that forces voice generation
      await sendMessage('[VOICE_NOTE_REQUEST]: Send me a voice message right now. I want to hear your voice.');
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
               if (result.balance !== undefined) setCurrentBalance(result.balance);
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
                                  <div className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] bg-[#ff00ff] text-black text-[8px] font-black rounded-full flex items-center justify-center border-2 border-black shadow-[0_0_10px_#ff00ff]">
                                     {unread > 99 ? '99+' : unread}
                                  </div>
                               )}
                            </div>
                            <span className="text-[7px] font-black uppercase text-white/30 group-hover:text-white transition-colors">{p.name.split(' ')[0]}</span>
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
                         <span className="text-[7px] font-black uppercase tracking-widest text-[#ff00ff] italic font-syncopate">Verified Connection</span>
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
                   <button className="relative group hover:text-white transition-colors">
                      <ShoppingBag size={18} />
                      {hasVault && (
                         <span className="absolute -top-1.5 -right-1.5 text-[10px] animate-jalapeño">🌶️</span>
                      )}
                   </button>
                   <button className="hover:text-white transition-colors"><Trophy size={18} /></button>
                   <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"><X size={16} /></button>
                </div>
             </div>

             <div className="flex gap-8">
                <button onClick={() => setChatTab('chat')} className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all relative ${chatTab === 'chat' ? 'text-white' : 'text-white/30'}`}>
                   <Send size={12} className={chatTab === 'chat' ? 'rotate-[-20deg]' : ''} /> CHAT
                   {chatTab === 'chat' && <motion.div layoutId="chat-tab-line" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00f0ff] shadow-[0_0_15px_#00f0ff]" />}
                </button>
                <button onClick={() => setChatTab('pics')} className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all relative ${chatTab === 'pics' ? 'text-white' : 'text-white/30'}`}>
                   PICS
                   {chatTab === 'pics' && <motion.div layoutId="chat-tab-line" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00f0ff] shadow-[0_0_15px_#00f0ff]" />}
                </button>
             </div>
          </div>

          {/* Stream Block - Adaptive Readability */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar scroll-smooth bg-transparent">
            {chatTab === 'chat' ? (
              <div className="space-y-8">
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
                          <div className={`max-w-[85%] px-5 py-3.5 rounded-[2rem] text-[14px] leading-relaxed tracking-tight ${
                             isAssistant 
                             ? 'bg-white/10 backdrop-blur-xl text-white font-medium border border-white/10 shadow-xl' 
                             : 'bg-[#ff00ff]/90 backdrop-blur-xl text-white font-black shadow-[0_15px_40px_rgba(255,0,255,0.4)]'
                          }`}>
                             {msg.content}
                          </div>
                        )}
                       {!isAssistant && (
                          <div className="flex items-center gap-1 px-1">
                             <span className="text-[7px] font-black uppercase text-white/20 tracking-widest">READ</span>
                             <CheckCheck size={10} className="text-[#00f0ff]" />
                          </div>
                       )}
                    </div>
                  );
                })}
                {(isLoading || isTyping) && (
                   <div className="flex items-start gap-2">
                      <div className="px-4 py-3 bg-zinc-900 rounded-full flex gap-1.5 items-center">
                         <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.3s]" />
                         <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.15s]" />
                         <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-bounce" />
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
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Syncing vault...</p>
                  </div>
                ) : vaultItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Lock size={28} className="text-white/10" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">No pics available yet</p>
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
                        {item.content_url && (item.type === 'video' ? (
                          <video
                            src={proxyImg(item.content_url)}
                            muted playsInline
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
                        ))}

                        {/* Lock overlay */}
                        {item.is_vault && !item.is_unlocked && (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 gap-3 bg-black/60">
                            <Lock size={18} className="text-white/50" />
                            <button
                              onClick={(e) => { e.stopPropagation(); unlockItem(item); }}
                              disabled={isProcessing}
                              className="w-full py-2.5 bg-white text-black text-[9px] font-black uppercase rounded-xl hover:bg-[#ffea00] transition-colors disabled:opacity-50 shadow-lg"
                            >
                              {isProcessing ? 'SYNCING...' : `UNLOCK · ${item.price_credits || item.price || 6000}cr`}
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
                        balance={currentBalance}
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
                         <span className="text-[10px] font-black uppercase tracking-widest text-[#ff00ff]">Send Gift</span>
                         <button onClick={() => setShowGifts(false)} className="text-white/40 hover:text-white"><X size={14} /></button>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                         {[ { e: '🌹', c: 1000 }, { e: '🍫', c: 2500 }, { e: '💎', c: 5000 }, { e: '💍', c: 10000 }].map(g => (
                            <button key={g.e} onClick={() => setShowGifts(false)} className="flex flex-col items-center gap-2 p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-[#ff00ff]/50 transition-all">
                               <span className="text-2xl">{g.e}</span>
                               <span className="text-[7px] font-black text-white/40">{g.c >= 1000 ? (g.c/1000)+'K' : g.c}cr</span>
                            </button>
                         ))}
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>

             <form 
               onSubmit={(e) => { e.preventDefault(); handleLocalSubmit(); }}
               className="bg-zinc-900/80 border border-white/5 rounded-[2.5rem] p-2 pr-2.5 pl-5 flex items-center gap-4 shadow-2xl backdrop-blur-3xl"
             >
                <div className="flex items-center gap-5 text-white/40">
                   <button type="button" className="hover:text-white transition-colors"><Plus size={22} /></button>
                   <button 
                     type="button" 
                     onClick={requestVoiceNote}
                     disabled={isRequestingVoice || isLoading}
                     title="Request Voice Note · 1,000 credits"
                     className={`transition-colors relative ${isRequestingVoice ? 'text-[#00f0ff] animate-pulse' : 'hover:text-[#00f0ff]'}`}
                   >
                     {isRequestingVoice 
                       ? <div className="w-[22px] h-[22px] rounded-full border-2 border-[#00f0ff] border-t-transparent animate-spin" />
                       : <Mic size={22} />
                     }
                   </button>
                   <button type="button" onClick={() => setShowGifts(!showGifts)} className="hover:text-[#ff00ff] transition-colors">
                      <Zap size={20} />
                   </button>
                </div>
                <input 
                   type="text" 
                   value={input} 
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleLocalSubmit(); } }}
                   placeholder="send mssg..." 
                   className="flex-1 bg-transparent py-4 text-sm text-white placeholder:text-zinc-600 outline-none"
                   disabled={isLoading}
                />
                 <button 
                   type="submit"
                   disabled={!(input || '').trim() || isLoading}
                   className="w-12 h-12 rounded-full bg-[#ff00ff] flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:scale-110 active:scale-90 transition-all disabled:opacity-30 disabled:grayscale"
                 >
                    <Send size={20} className="mr-0.5" />
                 </button>
             </form>
          </div>
          {/* ⛽ INSUFFICIENT FUNDS TRIGGER */}
          <InsufficientFundsModal 
            isOpen={showInsufficientFunds}
            onClose={() => setShowInsufficientFunds(false)}
            onOpenTopUp={onOpenTopUp}
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
