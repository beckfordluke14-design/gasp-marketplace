'use client';

import { X, Send, Plus, Minus, Trophy, HeartPulse, Trash2, ShoppingBag, Clock, Lock, Check, CheckCheck, Mic, Heart, Images, ZoomIn, Diamond, MessageSquare, Circle, Image as ImageIcon, Minus as MinimizeIcon, Gift } from 'lucide-react';
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
import { trackEvent } from '@/lib/telemetry';

interface ChatDrawerProps {
  personaId: string;
  persona: any;
  onClose: () => void;
  onMinimize: () => void;
}

export default function ChatDrawer({ personaId, persona, onClose, onMinimize }: ChatDrawerProps) {
  const { profile } = useUser();
  const [guestId, setGuestId] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
       let gid = localStorage.getItem('gasp_guest_id');
       if (!gid) {
          gid = 'guest-' + Math.random().toString(36).substring(2, 11);
          localStorage.setItem('gasp_guest_id', gid);
          console.log('[Neural Link]: New Guest GID Generated:', gid);
       }
       setGuestId(gid);
    }
  }, []);

  const idToUse = profile?.id || guestId;
  const [chatTab, setChatTab] = useState<'chat' | 'pics'>('chat');
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [activeGift, setActiveGift] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [liveVoiceUrl, setLiveVoiceUrl] = useState<string | null>(null);
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedLightboxIndex, setSelectedLightboxIndex] = useState(0);
  const [lightboxItems, setLightboxItems] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, setMessages, data: chatData, isLoading }: any = useChat({
    api: '/api/chat',
    id: personaId,
    body: { personaId, userId: idToUse },
    onResponse: () => {
      setIsTyping(false);
      setLiveVoiceUrl(null);
    },
    onFinish: async () => {
      setIsTyping(false);
      await new Promise(r => setTimeout(r, 800));
      const res = await fetch('/api/rpc/db', {
          method: 'POST',
          body: JSON.stringify({ action: 'chat-context', payload: { userId: idToUse, personaId } })
      });
      const result = await res.json();
      if (result.success && result.data.messages) {
        setMessages(result.data.messages);
      }
    }
  } as any);

  useEffect(() => {
    const loadData = async () => {
      if (!idToUse) return;
      try {
        const res = await fetch('/api/rpc/db', {
            method: 'POST',
            body: JSON.stringify({ action: 'chat-context', payload: { userId: idToUse, personaId } })
        });
        const result = await res.json();
        if (result.success) {
           setMessages(result.data.messages || []);
           setVaultItems(result.data.vaultItems || []);
        }
      } catch (e) {
        console.error('[Gasp Neural Sync] Error:', e);
      }
      setDbLoaded(true);
    };
    loadData();
  }, [personaId, idToUse]);

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

  const handleLocalSubmit = (e: any) => {
    e.preventDefault();
    if (!(input || '').trim() || !idToUse) return;
    setIsTyping(true);
    handleSubmit(e, { body: { userId: idToUse, personaId } });
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
        }
     } finally {
        setIsProcessing(false);
     }
  };

   const hasVault = vaultItems.some(v => v.is_vault);

   return (
    <div className="flex flex-col w-full md:w-[480px] h-screen bg-black border-l border-white/5 relative shadow-2xl overflow-hidden font-outfit">
      
      {/* 🏔️ HEADER: SYNDICATE HIGH-FIDELITY (Matches Screen) */}
      <div className="flex flex-col bg-black/40 backdrop-blur-3xl border-b border-white/10 shrink-0 p-6 pb-0">
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
               <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 bg-zinc-800">
                     <PersonaAvatar src={persona?.image || '/v1.png'} alt={persona?.name || 'Lila'} />
                  </div>
               </div>
               <div className="flex flex-col gap-0.5">
               <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                     {persona?.name || 'Lila'}
                  </h3>
                  <div className="px-2 py-0.5 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-full flex items-center gap-1">
                     <div className="w-1 h-1 bg-[#00f0ff] rounded-full animate-pulse" />
                     <span className="text-[7px] font-black text-[#00f0ff] uppercase tracking-widest">47 ACTIVE</span>
                  </div>
               </div>
               <div className="flex items-center gap-1.5">
                  <SparkleIcon size={8} className="text-[#ff00ff]" />
                  <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[#ff00ff] italic">PRIORITY CONNECTION ESTABLISHED</span>
               </div>
            </div>
         </div>
         
         <div className="flex items-center gap-4 text-white/40">
            <button className="hover:text-white transition-colors relative">
               <ShoppingBag size={20} />
               {hasVault && <span className="absolute -top-2 -right-2 text-xs">🌶️</span>}
            </button>
            <button className="hover:text-white transition-colors"><Trophy size={20} /></button>
            <button onClick={onMinimize} className="hover:text-white transition-colors"><MinimizeIcon size={20} /></button>
            <button onClick={onClose} className="hover:text-white transition-colors"><X size={20} /></button>
         </div>
      </div>

         {/* NAVIGATION TABS (Electric Cyan Line) */}
         <div className="flex gap-10">
            <button onClick={() => setChatTab('chat')} className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all relative ${chatTab === 'chat' ? 'text-white' : 'text-white/30'}`}>
               <Send size={12} className={chatTab === 'chat' ? 'rotate-[-20deg]' : ''} /> CHAT
               {chatTab === 'chat' && <motion.div layoutId="chat-tab-line" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00f0ff] shadow-[0_0_15px_#00f0ff]" />}
            </button>
            <button onClick={() => setChatTab('pics')} className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all relative ${chatTab === 'pics' ? 'text-white' : 'text-white/30'}`}>
               PICS {hasVault && <span className="text-xs">🌶️</span>}
               {chatTab === 'pics' && <motion.div layoutId="chat-tab-line" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00f0ff] shadow-[0_0_15px_#00f0ff]" />}
            </button>
         </div>
      </div>

      {/* 🚀 MESSAGES STREAM (Matched Bubble Aesthetics) */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar scroll-smooth bg-[#0a0a0a]">
        {chatTab === 'chat' ? (
          <>
            <div className="space-y-8">
               {messages.map((msg: any, idx: number) => {
                  const isAssistant = msg.role === 'assistant';
                  const isLast = idx === messages.length - 1;
                  const liveStreamData = isLast && isAssistant ? (chatData || []).find((d: any) => d?.type === 'voice_note' && d?.translation) : null;
                  
                  return (
                    <div key={msg.id || idx} className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} gap-2`}>
                       {msg.type === 'voice' || msg.audio_script ? (
                          <VoiceNoteBubble 
                             audioUrl={msg.media_url || liveVoiceUrl || ''} 
                             personaImage={persona?.image}
                             personaName={persona?.name}
                             translation={msg.audio_translation}
                             isUnlocked={!msg.translation_locked}
                             onUnlockTranslation={async () => true}
                          />
                       ) : msg.type === 'image' || msg.image_url ? (
                          <FreebieImageBubble 
                             imageUrl={proxyImg(msg.image_url || msg.media_url)} 
                             personaImage={persona?.image} 
                             personaName={persona?.name} 
                             caption={msg.content} 
                          />
                       ) : (
                          <div className={`max-w-[85%] px-5 py-3.5 rounded-[1.5rem] text-[14px] leading-relaxed tracking-tight ${isAssistant ? 'bg-zinc-900 text-white font-medium border border-white/5' : 'bg-[#ff00ff] text-white font-black'}`}>
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
                  <div className="flex items-start gap-2 animate-in fade-in duration-300">
                     <div className="px-4 py-3 bg-zinc-900 rounded-full flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-bounce" />
                     </div>
                  </div>
               )}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-48">
              {vaultItems.map((item, index) => (
                 <div 
                   key={item.id} 
                   onClick={() => {
                     if (!item.is_vault || item.is_unlocked) {
                        const viewableItems = vaultItems.filter(v => !v.is_vault || v.is_unlocked).map(v => ({ url: v.content_url || '', caption: v.caption }));
                        const itemIndex = viewableItems.findIndex(v => v.url === item.content_url);
                        setSelectedLightboxIndex(itemIndex >= 0 ? itemIndex : 0);
                        setLightboxItems(viewableItems);
                        setLightboxOpen(true);
                     }
                   }}
                   className="relative aspect-[3/4] bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 group shadow-2xl cursor-pointer"
                 >
                    <div className={`absolute inset-0 z-10 ${(!item.is_unlocked && item.is_vault) ? 'bg-black/80 backdrop-blur-3xl' : ''}`} />
                    {item.content_url && (
                       <Image src={proxyImg(item.content_url)} alt="Media" fill unoptimized className={`object-cover ${(!item.is_unlocked && item.is_vault) ? 'blur-2xl opacity-60' : 'opacity-100'}`} />
                    )}
                    {item.is_vault && !item.is_unlocked && (
                       <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4">
                          <Lock size={20} className="text-white/40 mb-3" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); unlockItem(item); }} 
                            className="w-full h-10 bg-white text-black text-[9px] font-black uppercase rounded-2xl hover:bg-[#ffea00] transition-colors"
                          >
                             UNLOCK 75cr
                          </button>
                       </div>
                    )}
                 </div>
              ))}
          </div>
        )}
      </div>

      {/* 🚀 INPUT HUB (Final Polish per Reference) */}
      <div className="bg-[#0a0a0a] px-6 pb-10 pt-4 relative">
         <AnimatePresence>
            {showGifts && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-6 right-6 mb-6 z-50 bg-[#111] border border-white/10 rounded-[2rem] p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 px-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-[#ff00ff]">Send Gift</span>
                     <button onClick={() => setShowGifts(false)} className="text-white/40 hover:text-white"><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                     {[ { e: '🌹', c: 10 }, { e: '🍫', c: 25 }, { e: '💎', c: 100 }, { e: '💍', c: 500 }].map(g => (
                        <button key={g.e} onClick={() => setShowGifts(false)} className="flex flex-col items-center gap-2 p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-[#ff00ff]/50 transition-all">
                           <span className="text-2xl">{g.e}</span>
                           <span className="text-[7px] font-black text-white/40">{g.c}cr</span>
                        </button>
                     ))}
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         <motion.form 
           onSubmit={handleLocalSubmit} 
           className="bg-zinc-900/80 border border-white/5 rounded-[2.5rem] p-2 pr-2.5 pl-5 flex items-center gap-4 shadow-2xl backdrop-blur-3xl"
         >
            <div className="flex items-center gap-5 text-white/40">
               <button type="button" className="hover:text-white transition-colors"><Plus size={22} /></button>
               <button type="button" onClick={() => {}} className="hover:text-white transition-colors"><Mic size={22} /></button>
               <button type="button" onClick={() => setShowGifts(!showGifts)} className="hover:text-[#ff00ff] transition-colors"><Gift size={22} /></button>
            </div>
            <input 
               type="text" 
               value={input} 
               onChange={handleInputChange} 
               placeholder="send mssg..." 
               className="flex-1 bg-transparent py-4 text-sm text-white placeholder:text-zinc-600 outline-none"
               disabled={!idToUse || isLoading}
            />
            <button 
              type="submit" 
              disabled={!(input || '').trim() || isLoading || !idToUse}
              className="w-12 h-12 rounded-full bg-[#ff00ff] flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            >
               <Send size={20} className="mr-0.5" />
            </button>
         </motion.form>
      </div>
    </div>
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
