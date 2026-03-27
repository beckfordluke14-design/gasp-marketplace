'use client';

import { X, Send, Plus, Minus, Trophy, HeartPulse, Trash2, ShoppingBag, Clock, Lock, Check, CheckCheck, Mic, Heart, Images, ZoomIn, Diamond, MessageSquare, Circle, Image as ImageIcon } from 'lucide-react';
import { initialPersonas, proxyImg } from '@/lib/profiles';
import { useRef, useEffect, useState } from 'react';
import { COST_VOICE_TRANSLATION, COST_VOICE_NOTE } from '@/lib/economy/constants';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import BondProgress from './persona/BondProgress';
import VoiceNoteBubble from './chat/VoiceNoteBubble';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { useUser } from './providers/UserProvider';
import PersonaAvatar from './persona/PersonaAvatar';
import FreebieImageBubble from './chat/FreebieImageBubble';
import MediaLightbox from './chat/MediaLightbox';
import { COST_VAULT_UNLOCK, COST_PREMIUM_VAULT_UNLOCK } from '@/lib/economy/constants';


interface ChatDrawerProps {
  personaId: string;
  persona: any;
  onClose: () => void;
  onMinimize: () => void;
}

export default function ChatDrawer({ personaId, persona, onClose, onMinimize }: ChatDrawerProps) {
  const { profile, ready: authReady } = useUser();
  // 🛡️ SOVEREIGN ID RESOLUTION:
  // - Authenticated: use profile.id (UUID)
  // - Guest: use persisted gasp_guest_id from localStorage (format: 'guest-xxxxx')
  // ⚠️ NEVER use bare 'guest' — the /api/chat route checks startsWith('guest-') for the 3-msg wall
  const [guestIdLocal, setGuestIdLocal] = useState<string>('');
  useEffect(() => {
    if (!profile?.id) {
      let id = localStorage.getItem('gasp_guest_id');
      if (!id) {
        id = `guest-${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem('gasp_guest_id', id);
      }
      setGuestIdLocal(id);
    }
  }, [profile?.id]);
  const idToUse = profile?.id || guestIdLocal;

  const [chatTab, setChatTab] = useState<'chat' | 'pics'>('chat');
  const [dbMessages, setDbMessages] = useState<any[]>([]);
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [activeGift, setActiveGift] = useState<any>(null);
  const [tapCount, setTapCount] = useState(0);
  const [tapItem, setTapItem] = useState<any>(null);
  const [confirmingItem, setConfirmingItem] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [bondScore, setBondScore] = useState(0);
  const [dbLoaded, setDbLoaded] = useState(false);
  // 🎙️ LIVE VOICE CAPTURE: Store voice note from stream before DB sync races it
  const [liveVoiceUrl, setLiveVoiceUrl] = useState<string | null>(null);
  
  // 🍿 LIGHTBOX STATE
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedLightboxIndex, setSelectedLightboxIndex] = useState(0);
  const [lightboxItems, setLightboxItems] = useState<any[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, setMessages, data: chatData, isLoading }: any = useChat({
    api: '/api/chat',
    id: personaId, // Unique ID for each persona instance
    body: { 
      personaId, 
      userId: idToUse 
    },
    onResponse: () => {
      setIsTyping(false);
      // 🎙️ Clear stale live voice from previous message
      setLiveVoiceUrl(null);
    },
    onFinish: async () => {
      setIsTyping(false);
      // 🔥 NEURAL SYNC: Fetch enriched messages from Neural DB Proxy after stream finishes
      // Small delay to allow DB write to complete before sync
      await new Promise(r => setTimeout(r, 800));
      const res = await fetch('/api/rpc/db', {
          method: 'POST',
          body: JSON.stringify({ action: 'chat-context', payload: { userId: idToUse, personaId } })
      });
      const result = await res.json();
      
      if (result.success && result.data.messages && result.data.messages.length > 0) {
        setMessages(result.data.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          media_url: m.media_url,
          image_url: m.image_url,
          type: m.type,
          audio_script: m.audio_script,
          audio_translation: m.audio_translation,
          translation_locked: m.translation_locked,
          created_at: m.created_at
        } as any)));
        setVaultItems(result.data.vaultItems);
        setIsFollowing(result.data.isFollowing);
        setBondScore(result.data.bondScore);
      }
      // Clear live voice once DB messages are loaded (they now have the URL persisted)
      setLiveVoiceUrl(null);
    },
    onError: (err: any) => {
      setIsTyping(false);
      console.error('[Brain Pipeline] Neural Error:', err);
      // Handle 402 Payment Required (Neural Link Depleted) — Redirect to Login
      if (err.message?.includes('402') || err.status === 402) {
         window.location.href = `/login?p=${personaId}`;
      }
    }
  } as any);

  useEffect(() => {
    const loadData = async () => {
      if (!idToUse || idToUse === '') return;  // Guard: wait for ID to resolve

      // 🛰️ NEURAL RPC FETCH: Unified Chat Load (Bypasses RLS for Guest Discovery)
      try {
        const res = await fetch('/api/rpc/db', {
            method: 'POST',
            body: JSON.stringify({ action: 'chat-context', payload: { userId: idToUse, personaId } })
        });
        const result = await res.json();
        
        if (result.success && result.data) {
           const { messages, vaultItems, isFollowing, bondScore } = result.data;
           setMessages(messages.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                media_url: m.media_url,
                image_url: m.image_url,
                type: m.type,
                audio_script: m.audio_script,
                audio_translation: m.audio_translation,
                translation_locked: m.translation_locked,
                created_at: m.created_at
           } as any)));
           setVaultItems(vaultItems);
           setIsFollowing(isFollowing);
           setBondScore(bondScore);
        }
      } catch (e) {
        console.error('[Gasp Neural Sync] Cloud Sync Refused:', e);
      }
      
      setDbLoaded(true);
    };
    loadData();
  }, [personaId, idToUse]);

  // 🎙️ LIVE VOICE CAPTURE: Watch chatData stream for voice_note events
  // This is the replacement for onData (more stable across AI SDK versions)
  useEffect(() => {
    if (!chatData || !Array.isArray(chatData)) return;
    const voiceEvent = chatData.find((d: any) => d?.type === 'voice_note' && d?.audioUrl);
    if (voiceEvent?.audioUrl && voiceEvent.audioUrl !== liveVoiceUrl) {
      console.log('🎙️ [ChatDrawer] Live voice detected in chatData:', voiceEvent.audioUrl);
      setLiveVoiceUrl(voiceEvent.audioUrl);
    }
  }, [chatData]);

  useEffect(() => {
    // 🚦 GATED SCROLL: Only auto-scroll to bottom if we are in the chat tab and new data arrives
    if (scrollRef.current && chatTab === 'chat') {
        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages, chatData, isLoading, chatTab]);

  useEffect(() => {
    // 🧠 NEURAL RESET: Clear scroll position when switching between Chat and Vault
    if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
    }
  }, [chatTab]);

  const handleLocalSubmit = (e: any) => {
    e.preventDefault();
    if (!input.trim()) return;
    // 🛡️ SOVEREIGN GUARD: Never submit without a valid user ID
    if (!idToUse || idToUse === '') {
      console.warn('[ChatDrawer] Blocked submit: userId not yet resolved');
      return;
    }
    setIsTyping(true);
    handleSubmit(e);
  };

  const handleFollowToggle = async () => {
     if (!idToUse) return;
     try {
       const res = await fetch('/api/rpc/db', {
           method: 'POST',
           body: JSON.stringify({ action: 'toggle-follow', payload: { userId: idToUse, personaId, isFollowing } })
       });
       const result = await res.json();
       if (result.success) {
          setIsFollowing(result.isFollowing);
          window.dispatchEvent(new CustomEvent('gasp_sync_follows'));
       }
     } catch (e) { console.error(e); }
  };

  const unlockItem = async (item: any) => {
     setIsProcessing(true);
     try {
        const res = await fetch('/api/economy/unlock', {
           method: 'POST',
           body: JSON.stringify({ userId: idToUse, itemId: item.id })
        });
        const result = await res.json();
        if (result.success) {
           setVaultItems(prev => prev.map(v => v.id === item.id ? { ...v, is_unlocked: true } : v));
           setConfirmingItem(null);
        }
     } finally {
        setIsProcessing(false);
     }
  };

  return (
    <div className="flex flex-col w-full md:w-[480px] h-screen bg-black border-l border-white/5 relative shadow-2xl overflow-hidden">
      {/* 🏔️ TOP HEADER: NEON SYNCHRONIZED IDENTITY */}
      <div className="flex flex-col bg-black/40 backdrop-blur-3xl border-b border-white/10 shrink-0">
         <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
               <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#ff00ff]/30 shadow-[0_0_20px_rgba(255,0,255,0.2)]">
                     <PersonaAvatar src={persona?.image || '/v1.png'} alt={persona?.name || 'Persona'} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00ff00] border-2 border-black animate-pulse shadow-[0_0_10px_#00ff00]" />
               </div>
               
                <div className="flex flex-col">
                   <h3 className="text-sm font-syncopate font-black uppercase italic text-white leading-none mb-2">{persona?.name || 'Unknown Persona'}</h3>
                   <div onClick={() => setChatTab('pics')} className="flex items-center gap-2 cursor-pointer group/node">
                      {vaultItems.some(v => v.is_vault && !v.is_unlocked) ? (
                        <motion.div 
                          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }} 
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-5 h-5 rounded-lg bg-[#ff6a00]/20 border border-[#ff6a00]/40 flex items-center justify-center shadow-[0_0_15px_rgba(255,106,0,0.3)] relative"
                        >
                           <ShoppingBag size={10} className="text-[#ff6a00]" />
                           <span className="absolute -top-1 -right-1 text-[8px]">🌶️</span>
                        </motion.div>
                      ) : (
                        <div className="w-5 h-5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                           <ImageIcon size={10} className="text-white/20" />
                        </div>
                      )}
                      <span className={`text-[7px] font-black uppercase tracking-[0.2em] italic ${vaultItems.some(v => v.is_vault && !v.is_unlocked) ? 'text-[#ff6a00]' : 'text-white/40'}`}>
                        {vaultItems.some(v => v.is_vault && !v.is_unlocked) ? 'SPICY ARCHIVE 🌶️' : 'VAULT NODES'}
                      </span>
                   </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
               <button onClick={handleFollowToggle} className={`h-9 px-5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${isFollowing ? 'bg-white/5 text-white/40 border border-white/10' : 'bg-[#ffea00] text-black shadow-[0_0_15px_rgba(255,234,0,0.3)]'}`}>
                  {isFollowing ? 'CONNECTED' : '+ CONNECT'}
               </button>
               <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                  <button onClick={onMinimize} className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:text-white"><Minus size={18} /></button>
                  <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:text-[#ff00ff]"><X size={18} /></button>
               </div>
            </div>
         </div>
         
         {/* 🧬 BOND PROGRESS: NEURAL DEPTH */}
         <div className="px-6 pb-4">
            <BondProgress score={bondScore} />
         </div>
      </div>

      <div className="flex items-center border-b border-white/5 bg-black/20 shrink-0">
        <button onClick={() => setChatTab('chat')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${chatTab==='chat'?'text-white bg-white/5 border-b-2 border-[#00f0ff]':'text-white/30 hover:text-white/50'}`}>Chat</button>
        <button onClick={() => setChatTab('pics')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${chatTab==='pics'?'text-white bg-white/5 border-b-2 border-[#ff00ff]':'text-white/30 hover:text-white/50'}`}>Vault Archive</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 pb-64 relative">
        {chatTab === 'chat' ? (
          <>
            {!dbLoaded && <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20"><Diamond className="animate-spin" size={20} /><span className="text-[8px] font-black uppercase tracking-widest">establishing link...</span></div>}
            
            {messages.map((msg: any, idx: number) => {
              const isAssistant = msg.role === 'assistant';
              const isLast = idx === messages.length - 1;
              
              const liveCapturedUrl = isLast && isAssistant && !msg.media_url ? liveVoiceUrl : null;
              const hasVoice = msg.type === 'voice' || msg.media_url?.includes('.mp3') || !!liveCapturedUrl;
              const voiceUrl = msg.media_url || liveCapturedUrl || null;
              const liveStreamData = isLast && isAssistant ? (chatData || []).find((d: any) => d?.type === 'voice_note' && d?.translation) : null;
              const translation = msg.audio_translation || liveStreamData?.translation;

              return (
                <div key={msg.id || idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>
                  
                  {/* TEXT BUBBLE */}
                  {msg.content && !msg.content.startsWith('[SYSTEM]') && (
                    <div className={`max-w-[85%] px-5 py-3 rounded-[1.6rem] text-[13px] leading-relaxed shadow-2xl relative ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-[#ff00ff] to-[#7f00ff] text-white font-bold' 
                        : 'bg-[#111111] text-white/90 border border-white/5 shadow-inner'
                    }`}>
                      {msg.content}
                      {msg.role === 'user' && (idx % 2 === 0) && <div className="absolute top-1 right-2 opacity-30"><Check size={10} /></div>}
                      {msg.role === 'user' && (idx % 2 !== 0) && <div className="absolute top-1 right-2 opacity-30"><CheckCheck size={10} /></div>}
                    </div>
                  )}

                  {/* VOICE NOTE BUBBLE */}
                  {hasVoice && voiceUrl && (
                    <VoiceNoteBubble 
                      audioUrl={voiceUrl} 
                      personaImage={persona.image} 
                      personaName={persona.name}
                      translation={translation}
                      isUnlocked={!msg.translation_locked}
                      onUnlockTranslation={async () => {
                         const res = await fetch('/api/economy/unlock', {
                            method: 'POST',
                            body: JSON.stringify({ userId: idToUse, mediaId: msg.id, type: 'translation' })
                         });
                         const result = await res.json();
                         return result.success;
                      }}
                    />
                  )}

                  {/* IMAGE BUBBLE */}
                  {(msg.image_url || (msg.media_url && !msg.media_url.includes('.mp3'))) && (
                     <FreebieImageBubble imageUrl={msg.image_url || msg.media_url} personaImage={persona.image} personaName={persona.name} />
                  )}
                </div>
              );
            })}
            {(isLoading || isTyping) && (
               <div className="flex flex-col items-start gap-2">
                  <div className="px-5 py-3 bg-white/5 rounded-full flex gap-1.5 items-center">
                     <span className="w-1 h-1 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.3s]" />
                     <span className="w-1 h-1 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.15s]" />
                     <span className="w-1 h-1 bg-[#00f0ff] rounded-full animate-bounce" />
                  </div>
               </div>
            )}
          </>
        ) : (
          <div className={`grid grid-cols-2 gap-4 ${chatTab === 'pics' ? 'pb-24 pt-4' : 'pb-48'}`}>
              {vaultItems.map((item, index) => (
                 <div key={item.id} className="relative aspect-[3/4] bg-white/5 rounded-3xl overflow-hidden border border-white/5 group shadow-2xl" onContextMenu={(e) => e.preventDefault()}>
                    <div className={`absolute inset-0 z-10 ${(!item.is_unlocked && item.is_vault) ? 'bg-black/40 backdrop-blur-3xl' : 'bg-transparent'}`} />
                    {item.content_url && (
                       <Image src={proxyImg(item.content_url)} alt="Media" fill unoptimized className={`object-cover ${(!item.is_unlocked && item.is_vault) ? 'blur-2xl opacity-60' : 'blur-0 opacity-100'} select-none`} />
                    )}
                    <div className="absolute inset-0 z-20" onContextMenu={(e) => e.preventDefault()} />
                    <div className="absolute top-4 left-4 z-30 flex gap-2">
                        {item.is_vault && (
                           <div className="px-2 py-1 rounded-full bg-[#ff00ff]/20 border border-[#ff00ff]/40 text-[#ff00ff] text-[6px] font-black uppercase tracking-widest flex items-center gap-1 backdrop-blur-md">
                              <Diamond size={8} /> PRIVATE
                           </div>
                        )}
                    </div>
                    {item.is_vault && (
                       <div className="absolute bottom-4 inset-x-4 z-30">
                         {item.is_unlocked ? (
                            <button onClick={() => {
                                 const unlockedItems = vaultItems.filter(v => v.is_unlocked).map(v => ({ url: v.content_url || '', caption: v.caption }));
                                 const itemIndex = unlockedItems.findIndex(v => v.url === item.content_url);
                                 setSelectedLightboxIndex(itemIndex >= 0 ? itemIndex : 0);
                                 setLightboxItems(unlockedItems);
                                 setLightboxOpen(true);
                              }} className="w-full bg-[#00ff00]/20 border border-[#00ff00]/40 text-[#00ff00] text-[8px] font-black uppercase tracking-widest py-3 rounded-2xl italic backdrop-blur-md">VIEW 💎</button>
                         ) : (
                            <button onClick={() => setConfirmingItem(item)} className="w-full h-12 bg-white text-black text-[9px] font-black uppercase tracking-[0.15em] rounded-2xl shadow-2xl hover:bg-[#ffea00] italic">UNLOCK - 40cr</button>
                         )}
                       </div>
                    )}
                 </div>
              ))}
          </div>
        )}
      </div>

      <AnimatePresence>
         {confirmingItem && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-10 select-none">
               <div className="flex flex-col items-center gap-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-[#ffea00]/10 border border-[#ffea00]/40 flex items-center justify-center shadow-[0_0_30px_rgba(255,234,0,0.2)]"><Lock size={32} className="text-[#ffea00]" /></div>
                  <h3 className="text-2xl font-syncopate font-black uppercase italic text-white leading-none">Decrypt Node?</h3>
                  <button onClick={() => unlockItem(confirmingItem)} disabled={isProcessing} className="h-14 w-64 bg-[#ffea00] text-black font-black uppercase tracking-widest rounded-2xl">{isProcessing ? 'SYNCING...' : 'DECRYPT 40cr'}</button>
                  <button onClick={() => setConfirmingItem(null)} className="text-white/40 font-black uppercase tracking-widest text-[10px]">Back</button>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      <MediaLightbox isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} activeIndex={selectedLightboxIndex} items={lightboxItems} onNavigate={(index) => setSelectedLightboxIndex(index)} />

      <div className="absolute bottom-0 inset-x-0 p-8 pt-4 bg-gradient-to-t from-black via-black/95 to-transparent pb-10 z-50">
         {chatTab === 'chat' && (
            <motion.form 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleLocalSubmit} 
              className="flex items-center gap-2 bg-white/[0.07] border border-white/10 rounded-3xl px-3 py-3 shadow-2xl backdrop-blur-2xl mb-4"
            >
               <button type="button" onClick={() => setShowGifts(!showGifts)} className="w-9 h-9 rounded-2xl bg-white/5 text-white/40 hover:text-[#ff00ff] flex items-center justify-center transition-colors"><HeartPulse size={18} /></button>
               <input 
                 type="text" 
                 value={input} 
                 onChange={handleInputChange} 
                 placeholder={isLoading ? "Neural stream active..." : "send message..."} 
                 className="flex-1 bg-transparent outline-none text-xs text-white placeholder:text-white/20" 
                 disabled={isLoading}
               />
               <button type="submit" disabled={!input.trim() || isLoading} className="p-3 rounded-2xl bg-[#ff00ff] text-black disabled:opacity-50 disabled:bg-white/10 transition-all active:scale-90">
                  <Send size={16} />
               </button>
            </motion.form>
         )}
         <div className="flex justify-around mt-6 px-4">
            <button onClick={() => setChatTab('chat')} className={`flex flex-col items-center gap-2 ${chatTab==='chat' ? 'text-[#ff00ff]' : 'text-white/20'}`}><MessageSquare size={20} /><span className="text-[6px] font-black uppercase tracking-widest">Chat</span></button>
            <button onClick={() => setChatTab('pics')} className={`flex flex-col items-center gap-2 ${chatTab==='pics' ? 'text-[#ffea00]' : 'text-white/20'}`}><Images size={20} /><span className="text-[6px] font-black uppercase tracking-widest">Vault</span></button>
         </div>
      </div>
    </div>
  );
}
