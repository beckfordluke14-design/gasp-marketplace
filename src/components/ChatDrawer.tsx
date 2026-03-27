'use client';

import { X, Send, Plus, Coins, Minus, Trophy, HeartPulse, Trash2, ShoppingBag, Clock, Lock, Check, CheckCheck, Mic, Heart, Images, ZoomIn, Diamond } from 'lucide-react';
import { initialPersonas, proxyImg } from '@/lib/profiles';
import { useRef, useEffect, useState } from 'react';
import { COST_VOICE_TRANSLATION, COST_VOICE_NOTE } from '@/lib/economy/constants';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import BondProgress from './persona/BondProgress';
import VoiceNoteBubble from './chat/VoiceNoteBubble';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { useUser } from './providers/UserProvider';
import PersonaAvatar from './persona/PersonaAvatar';
import ChatVaultItem from './chat/ChatVaultItem';
import FreebieImageBubble from './chat/FreebieImageBubble';
import { COST_VAULT_UNLOCK, COST_PREMIUM_VAULT_UNLOCK } from '@/lib/economy/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

interface ChatDrawerProps {
  personaId: string;
  persona?: any;
  onClose: () => void;
  onMinimize: () => void;
}

export default function ChatDrawer({ personaId, persona, onClose, onMinimize }: ChatDrawerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isPersonaReading, setIsPersonaReading] = useState(false);
  const [isDelivered, setIsDelivered] = useState(false);
  const [guestId, setGuestId] = useState<string>('');
  const [bondScore, setBondScore] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [showVault, setShowVault] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showSignUpWall, setShowSignUpWall] = useState(false);
  const [dbMessages, setDbMessages] = useState<any[]>([]);
  const [voiceRequested, setVoiceRequested] = useState(false);
  const [showVoiceTip, setShowVoiceTip] = useState(false);
  const [activeChatters, setActiveChatters] = useState(42);
  const [tickerMsg, setTickerMsg] = useState('');
  const [localInput, setLocalInput] = useState('');
  const [activeGift, setActiveGift] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  // Freebie system
  const [freebieItems, setFreebieItems] = useState<any[]>([]);
  const [sentFreebieIds, setSentFreebieIds] = useState<Set<string>>(new Set());
  // Pics tab
  const [chatTab, setChatTab] = useState<'chat' | 'pics'>('chat');
  const [picPosts, setPicPosts] = useState<any[]>([]);
  const [loadingPics, setLoadingPics] = useState(false);
  const [expandedPic, setExpandedPic] = useState<string | null>(null);
  const [picZoomed, setPicZoomed] = useState(false);
  const [likedPicIds, setLikedPicIds] = useState<Set<string>>(new Set());
  const [chatTabNotif, setChatTabNotif] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const { messages, handleInputChange, setMessages, isLoading }: any = useChat({
    api: '/api/chat',
    body: { userId: guestId || 'guest_sync', personaId: personaId },
    onResponse: () => { setIsTyping(false); setIsPersonaReading(false); },
    onFinish: () => { setIsTyping(false); setIsPersonaReading(false); }
  } as any);

  useEffect(() => {
    let id = user?.id || localStorage.getItem('gasp_guest_id');
    if (!id) {
       id = 'guest-' + Math.random().toString(36).substr(2, 9);
       localStorage.setItem('gasp_guest_id', id);
    }
    setGuestId(id);
    if (id.startsWith('guest-')) {
       setMessageCount(parseInt(localStorage.getItem('gasp_msg_count') || '0', 10));
    }
    
    // 🤝 DATABASE CONNECTION SYNC
    const checkFollow = async () => {
       if (!id || !personaId) return;
       const { data } = await supabase.from('user_relationships').select('*').eq('user_id', id).eq('persona_id', personaId).maybeSingle();
       setIsFollowing(!!data);
    };
    checkFollow();

    const h = new Date().getHours();
    setActiveChatters(Math.floor(Math.random() * 20) + ((h > 20 || h < 4) ? 80 : 30));
  }, [user, personaId]);

  const handleFollowToggle = async () => {
    if (!guestId || !personaId) return;
    
    if (isFollowing) {
       await supabase.from('user_relationships').delete().eq('user_id', guestId).eq('persona_id', personaId);
    } else {
       await supabase.from('user_relationships').upsert({ user_id: guestId, persona_id: personaId, affinity_score: 1 });
    }
    
    setIsFollowing(!isFollowing);
    window.dispatchEvent(new Event('gasp_sync_follows')); // 📡 Update layouts
  };

  const loadData = async () => {
    if (!guestId || !personaId) return;
    const { data: msgData } = await supabase.from('chat_messages').select('*').eq('persona_id', personaId).eq('user_id', guestId).order('created_at', { ascending: true });
    if (msgData) setDbMessages(msgData);
    const { data: statData } = await supabase.from('user_persona_stats').select('bond_score').eq('persona_id', personaId).eq('user_id', guestId).maybeSingle();
    if (statData) setBondScore(statData.bond_score);
    const { data: walletData } = await supabase.from('wallets').select('balance').eq('user_id', guestId).maybeSingle();
    if (walletData) setWalletBalance(walletData.balance);
    const { data: vData } = await supabase.from('posts').select('*').eq('persona_id', personaId).eq('is_vault', true).order('created_at', { ascending: false });
    const { data: uData } = await supabase.from('user_vault_unlocks').select('post_id').eq('user_id', guestId);
    if (vData) {
      const unlockedIds = (uData || []).map(u => u.post_id);
      setVaultItems(vData.map(v => ({ ...v, is_unlocked: unlockedIds.includes(v.id) })));
    }
  };

  useEffect(() => {
    if (personaId && guestId) loadData();
    const channel = supabase.channel(`chat-${personaId}-${guestId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `persona_id=eq.${personaId}` }, (payload) => {
          if (payload.new.user_id !== guestId || payload.new.role === 'user') return;
          setDbMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [personaId, guestId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [dbMessages, messages, isLoading, isPersonaReading, isTyping]);

  const executeNeuralSend = async (msgContent: string, imageUrl?: string, forceVoice?: boolean) => {
    const cleanMsg = msgContent.trim();
    if (!cleanMsg && !imageUrl) return;
    const userMsg = { id: 'local-' + Date.now(), role: 'user', content: cleanMsg, image_url: imageUrl, created_at: Date.now() };
    setMessages((prev: any) => [...prev, { ...userMsg, status: 'sent' }]);
    setLocalInput('');

    try {
        await new Promise(r => setTimeout(r, 400));
        setMessages((prev: any) => prev.map((m: any) => m.id === userMsg.id ? { ...m, status: 'delivered' } : m));
        await new Promise(r => setTimeout(r, 600));
        setMessages((prev: any) => prev.map((m: any) => m.id === userMsg.id ? { ...m, status: 'read' } : m));
        setIsPersonaReading(true);
        await new Promise(r => setTimeout(r, 1200));
        setIsPersonaReading(false);
        setIsTyping(true);

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [...messages, userMsg], userId: guestId, personaId, forceVoice })
        });
        if (!response.ok) throw new Error();
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        const assistantId = 'ai-' + Date.now();
        setMessages((prev: any) => [...prev, { id: assistantId, role: 'assistant', content: '', voice_pending: false, _streamDone: false, created_at: Date.now() }]);

        while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('0:')) {
                    try { assistantContent += JSON.parse(line.slice(2)); } catch { assistantContent += line.slice(2); }
                } else if (line.startsWith('2:')) {
                    try {
                        const media = JSON.parse(line.slice(2));
                        if (media.type === 'voice_note' && media.audioUrl) {
                            setMessages((prev: any) => prev.map((m: any) => m.id === assistantId ? { 
                                ...m, voice_pending: false, media_url: media.audioUrl, audio_translation: media.translation, translation_locked: true
                            } : m));
                        }
                    } catch (err) { console.error('Media sync failure:', err); }
                }
            }
            setMessages((prev: any) => prev.map((m: any) => m.id === assistantId ? { ...m, content: assistantContent } : m));
        }
        setIsTyping(false);
        setMessages((prev: any) => prev.map((m: any) => m.id === assistantId ? { ...m, _streamDone: true } : m));
    } catch (e) { console.error(e); } finally { setIsTyping(false); setIsPersonaReading(false); }
  };

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guestId.startsWith('guest-') && messageCount >= 3) { setShowSignUpWall(true); return; }
    if (guestId.startsWith('guest-')) {
       const n = messageCount + 1;
       setMessageCount(n);
       localStorage.setItem('gasp_msg_count', n.toString());
       if (n >= 3) setTimeout(() => setShowSignUpWall(true), 2500);
    }
    await executeNeuralSend(localInput, undefined, voiceRequested);
  };

  // 🏁 THE WHALE RAIN: TAP ACCUMULATOR
  const [tapCount, setTapCount] = useState<number>(0);
  const [tapItem, setTapItem] = useState<any>(null);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  const sendGift = async (g: any) => {
     if (tapTimer.current) clearTimeout(tapTimer.current);
     setTapItem(g);
     setTapCount(prev => prev + 1);
     tapTimer.current = setTimeout(async () => {
        const finalCount = tapCount + 1;
        setTapCount(0);
        setTapItem(null);
        setShowGifts(false);
        const totalPrice = g.price * finalCount;
        const totalBond = g.bond * finalCount;
        const { data } = await supabase.rpc('process_spend', { p_user_id: guestId, p_amount: totalPrice, p_type: 'gift', p_persona_id: personaId });
        if (!data?.success) { alert(`Insufficient Credits! Sending ${finalCount}x ${g.icon} costs ${totalPrice}c.`); return; }
        setActiveGift({ icon: g.icon, count: finalCount, id: Date.now() });
        setTimeout(() => setActiveGift(null), 3000);
        setBondScore(prev => prev + totalBond);
        await executeNeuralSend(`[GIFT]: Sent ${finalCount}x ${g.icon} ${g.name.toLowerCase()}.`);
     }, 1000);
  };

  const [confirmingItem, setConfirmingItem] = useState<any>(null);

  const unlockVaultItem = async (item: any) => {
    setConfirmingItem(null);
    const isVideo = item.content_url?.includes('.mp4') || item.content_type === 'video';
    const cost = isVideo ? COST_PREMIUM_VAULT_UNLOCK : COST_VAULT_UNLOCK;
    const { data } = await supabase.rpc('process_spend', { p_user_id: guestId, p_amount: cost, p_type: 'vault_unlock', p_persona_id: personaId });
    if (!data?.success) { alert(`Insufficient Credits! Costs ${cost}c.`); return; }
    await supabase.from('user_vault_unlocks').insert([{ user_id: guestId, post_id: item.id }]);
    setWalletBalance(prev => prev !== null ? prev - cost : prev);
    setVaultItems(prev => prev.map(v => v.id === item.id ? { ...v, is_unlocked: true } : v));
    await executeNeuralSend(`[SYSTEM]: Unlocked vault item: ${item.caption || "Secret Visual"}. React to it.`);
  };

  if (!persona) return null;

  return (
    <div className="relative h-full mt-0 md:h-[calc(100dvh-8.5rem)] md:mt-[8.5rem] w-full md:w-[480px] bg-[#050505]/95 backdrop-blur-3xl border-l border-white/5 z-[300] shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col pointer-events-auto transition-all duration-500 md:rounded-l-[2rem] overflow-hidden">
      <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl shrink-0 relative z-[200]">
        <div className="flex items-center gap-4">
            {/* 🧬 NEURAL PULSE: STORY NODE */}
            <div 
              onClick={() => setShowStory(true)}
              className="relative cursor-pointer group"
            >
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                 className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#ff00ff] via-[#00f0ff] to-[#ffea00] p-[1px] opacity-100 blur-[1px]"
               />
               <div className="w-12 h-12 rounded-full overflow-hidden border border-black relative z-10 bg-black shadow-2xl">
                  <PersonaAvatar src={persona.image} alt={persona.name} />
               </div>
               {/* 🟢 GREEN STATUS PULSE */}
               <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[#00ff00] border-2 border-black shadow-[0_0_10px_#00ff00] animate-pulse z-20" />
            </div>

            <div>
               <div className="flex items-center gap-2 leading-none">
                 <h3 className="text-[13px] md:text-lg font-black uppercase italic text-white tracking-tighter">{persona.name.toLowerCase()}</h3>
               </div>
               
               {/* 💎 SECURE CACHE NODE: FORBIDDEN PROFESSIONAL VIBE */}
               <div 
                 onClick={() => setChatTab('pics')}
                 className="flex items-center gap-2 mt-2 cursor-pointer group/node"
               >
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-4 h-4 rounded-full bg-[#ff00ff]/10 border border-[#ff00ff]/30 flex items-center justify-center shadow-[0_0_10px_#ff00ff22]"
                  >
                     <Diamond size={8} className="text-[#ff00ff]" />
                  </motion.div>
                  <span className="text-[7px] md:text-[8px] text-white/40 group-hover/node:text-[#ff00ff] font-black uppercase tracking-[0.2em] transition-all italic leading-none">
                     SECURE ARCHIVE • {vaultItems.length || '---'} NODES
                  </span>
               </div>
            </div>
        </div>

        <div className="flex items-center gap-4">
           {/* 🤝 CONNECTION BOX (FOLLOW) */}
           <button 
             onClick={handleFollowToggle}
             className={`h-9 px-5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
               isFollowing 
                 ? 'bg-white/5 text-white/40 border border-white/10 opacity-60' 
                 : 'bg-[#ffea00] text-black hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,234,0,0.3)]'
             }`}
           >
              {isFollowing ? 'CONNECTED' : '+ CONNECT'}
           </button>

           <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <button onClick={onMinimize} className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:text-white transition-all"><Minus size={18} /></button>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:text-[#ff00ff] transition-all"><X size={18} /></button>
           </div>
        </div>
      </div>

      <div className="flex items-center border-b border-white/5 bg-black/20 shrink-0">
        <button onClick={() => setChatTab('chat')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${chatTab==='chat'?'text-white border-b-2 border-[#00f0ff]':'text-white/30'}`}>Chat</button>
        <button onClick={() => setChatTab('pics')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${chatTab==='pics'?'text-white border-b-2 border-[#ff00ff]':'text-white/30'}`}>Pics</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 pb-64">
        {[...dbMessages, ...messages].map((msg: any) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {!msg.media_url && msg.content && !msg.content.startsWith('[SYSTEM]') && (
              <div className={`max-w-[85%] px-5 py-3 rounded-[1.6rem] text-xs leading-relaxed shadow-xl ${msg.role === 'user' ? 'bg-[#ff00ff] text-black font-bold' : 'bg-white/5 text-white border border-white/5'}`}>
                {msg.content}
              </div>
            )}
          </div>
        ))}
        {isTyping && <div className="p-3 bg-white/5 rounded-full w-12 flex gap-1"><div className="w-1 h-1 bg-[#00f0ff] rounded-full animate-bounce"/><div className="w-1 h-1 bg-[#00f0ff] rounded-full animate-bounce delay-100"/><div className="w-1 h-1 bg-[#00f0ff] rounded-full animate-bounce delay-200"/></div>}
      </div>

      <div className="absolute bottom-0 inset-x-0 p-8 pt-4 bg-gradient-to-t from-black via-black/90 to-transparent pb-10">
         <AnimatePresence>
            {activeGift && (
              <motion.div key={activeGift.id} initial={{ scale: 0.5, y: 100, opacity: 0 }} animate={{ scale: [1, 2, 0.8], y: -500, opacity: [0, 1, 0] }} transition={{ duration: 2.5 }} className="fixed left-1/2 -translate-x-1/2 bottom-32 flex flex-col items-center z-[2000] pointer-events-none">
                 <span className="text-[120px]">{activeGift.icon}</span>
                 <span className="text-4xl font-syncopate font-black text-[#ff00ff] italic mt-[-20px]">X{activeGift.count}</span>
              </motion.div>
            )}
            {showGifts && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute bottom-28 left-4 right-4 bg-black/80 backdrop-blur-3xl border border-[#ff00ff]/30 rounded-3xl p-4 grid grid-cols-4 gap-2 z-[500]">
                 {[
                    { name: 'Red Bull', icon: '⚡', price: 25, bond: 5 }, 
                    { name: 'Tequila', icon: '🥃', price: 50, bond: 10 }, 
                    { name: 'Rose', icon: '🌹', price: 100, bond: 25 }, 
                    { name: 'Diamond', icon: '💎', price: 500, bond: 150 }
                 ].map(g => (
                   <button key={g.name} onClick={() => sendGift(g as any)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 hover:bg-[#ff00ff]/10 relative overflow-hidden group">
                      <span className="text-xl group-hover:scale-125 transition-transform">{g.icon}</span>
                      <span className="text-[8px] font-black uppercase text-white/50">{g.price}c</span>
                      {tapItem?.name === g.name && tapCount > 0 && <div className="absolute inset-0 bg-[#ff00ff]/20 flex items-center justify-center animate-pulse"><span className="text-lg font-black text-white italic">x{tapCount}</span></div>}
                   </button>
                 ))}
              </motion.div>
            )}
         </AnimatePresence>

         <form onSubmit={handleLocalSubmit} className="flex items-center gap-2 bg-white/[0.07] border border-white/10 rounded-3xl px-3 py-3 shadow-2xl backdrop-blur-2xl">
            <button type="button" onClick={() => setShowGifts(!showGifts)} className="w-9 h-9 rounded-2xl bg-white/5 text-white/40 hover:text-[#ff00ff] flex items-center justify-center"><HeartPulse size={18} /></button>
            <input type="text" value={localInput} onChange={(e) => setLocalInput(e.target.value)} placeholder="send mssg..." className="flex-1 bg-transparent outline-none text-xs text-white" />
            <button type="submit" disabled={!localInput.trim()} className="p-3 rounded-2xl bg-[#ff00ff] text-black shadow-[0_0_20px_#ff00ff44]"><Send size={16} /></button>
         </form>
      </div>

      <AnimatePresence>
        {showVault && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 z-[600] bg-black border-l border-white/5 flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div><h3 className="font-syncopate font-black uppercase text-2xl text-white">Private Archive</h3><p className="text-[#ffea00] text-[10px] uppercase font-bold">Encrypted Nodes</p></div>
                <button onClick={() => setShowVault(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 pb-32">
               {vaultItems.map((item) => (
                 <div key={item.id} className="relative aspect-[3/4] bg-white/5 rounded-2xl overflow-hidden border border-white/10 group">
                    <div className="absolute inset-0 bg-black/60 z-10 backdrop-blur-xl group-hover:backdrop-blur-sm" />
                    {item.content_url && <img src={proxyImg(item.content_url)} className="absolute inset-0 w-full h-full object-cover blur-md" />}
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4">
                       <Lock size={24} className="text-[#ff00ff] mb-2" />
                       <span className="text-white text-[10px] font-black uppercase text-center line-clamp-2">{item.caption || "Secret Visual"}</span>
                    </div>
                    <div className="absolute bottom-3 inset-x-3 z-30">
                       <button onClick={() => setConfirmingItem(item)} className="w-full bg-[#ff00ff] text-black font-black uppercase text-[10px] py-3 rounded-xl shadow-[0_5px_15px_rgba(255,0,255,0.3)]">Unlock - {item.content_url?.includes('.mp4')?150:40}c</button>
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>
        )}
        {confirmingItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[2000] bg-black/95 flex items-center justify-center p-8 backdrop-blur-2xl">
             <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-[#ff00ff]/10 flex items-center justify-center mx-auto"><Lock size={24} className="text-[#ff00ff]" /></div>
                <div><h3 className="text-lg font-syncopate font-black text-white italic uppercase">Confirm Unlock</h3><p className="text-[10px] text-white/40 uppercase mt-2">Spend Credits for Private Content?</p></div>
                <div className="space-y-3 pt-4">
                   <button onClick={() => unlockVaultItem(confirmingItem)} className="w-full h-14 bg-[#ff00ff] text-black text-[10px] font-black uppercase rounded-2xl">Confirm - {confirmingItem.content_url?.includes('.mp4')?150:40}c</button>
                   <button onClick={() => setConfirmingItem(null)} className="w-full h-10 text-[9px] font-black text-white/20 uppercase">Cancel</button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🧬 STORY MODAL OVERLAY */}
      <AnimatePresence>
        {showStory && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-[1000] bg-black"
          >
             <PersonaAvatar src={persona.image} alt={persona.name} className="w-full h-full object-cover opacity-60" />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
             
             <div className="absolute top-12 inset-x-8 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 5 }} className="h-full bg-white shadow-[0_0_10px_#fff]" onAnimationComplete={() => setShowStory(false)} />
             </div>

             <div className="absolute bottom-20 inset-x-8 text-center space-y-4">
                <h2 className="text-3xl font-syncopate font-black italic text-white uppercase tracking-tighter leading-none">{persona.name}'s Pulse</h2>
                <div className="flex items-center justify-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#00ff00] shadow-[0_0_8px_#00ff00]" />
                   <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] italic">Active in {persona.city || 'the vault'}</span>
                </div>
                <p className="text-sm text-white font-medium italic leading-relaxed px-4 opacity-80">"Vibing in the shadows tonight. Who's ready to see the full set? $GASPAI logic active."</p>
             </div>

             <button 
               onClick={() => setShowStory(false)}
               className="absolute top-16 right-8 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
             >
                <X size={20} />
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
