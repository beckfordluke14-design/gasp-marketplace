'use client';

import { X, Send, Plus, Coins, Minus, Trophy, HeartPulse, Trash2, ShoppingBag, Clock, Lock, Check, CheckCheck, Mic, Heart } from 'lucide-react';
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
  const router = useRouter();
  const { user } = useUser();

  const getPersonaStyle = () => {
    const seed = personaId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const styles = ['burst', 'monolith', 'sniper', 'analytical'];
    return {
        type: styles[seed % styles.length],
        delayFactor: (seed % 10) / 10 + 0.5,
    };
  };

  const style = getPersonaStyle();

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

    const storedFollows = JSON.parse(localStorage.getItem('gasp_following') || '[]');
    setIsFollowing(storedFollows.includes(personaId));

    const h = new Date().getHours();
    setActiveChatters(Math.floor(Math.random() * 20) + ((h > 20 || h < 4) ? 80 : 30));
    const events = ['🔥 3 users unlocked her vault', '💎 A whale sent a gift', '✨ priority connection established', '🎙️ Voice note requested'];
    let idx = 0;
    const tInterval = setInterval(() => {
      setTickerMsg(events[idx % events.length]);
      idx++;
      setTimeout(() => setTickerMsg(''), 6000);
    }, 15000);
    return () => clearInterval(tInterval);
  }, [user]);

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
    if (personaId && guestId) {
        loadData();
        supabase.from('chat_messages').update({ is_read: true }).match({ user_id: guestId, persona_id: personaId, role: 'assistant', is_read: false }).then();
    }
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
        setMessages((prev: any) => [...prev, { id: assistantId, role: 'assistant', content: '', created_at: Date.now() }]);

        while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('0:')) {
                    try { assistantContent += JSON.parse(line.slice(2)); } catch { assistantContent += line.slice(2); }
                } else if (line.startsWith('2:')) {
                    // 🎙️ MEDIA SYNC (Voice Note / Dynamic Image)
                    try {
                        const media = JSON.parse(line.slice(2));
                        if (media.type === 'voice_note' && media.audioUrl) {
                            setMessages((prev: any) => prev.map((m: any) => m.id === assistantId ? { 
                                ...m, 
                                media_url: media.audioUrl,
                                audio_translation: media.translation,
                                translation_locked: true
                            } : m));
                        }
                    } catch (err) { console.error('Media sync failure:', err); }
                }
            }
            setMessages((prev: any) => prev.map((m: any) => m.id === assistantId ? { ...m, content: assistantContent } : m));
        }
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
    if (voiceRequested) {
      const { data } = await supabase.rpc('process_spend', { p_user_id: guestId, p_amount: COST_VOICE_NOTE, p_type: 'voice_request', p_persona_id: personaId });
      if (!data?.success) { alert('Need credits!'); return; }
      setWalletBalance(prev => prev !== null ? prev - COST_VOICE_NOTE : prev);
    }
    await executeNeuralSend(localInput, undefined, voiceRequested);
    setVoiceRequested(false);
    setShowVoiceTip(false);
  };

  const playNotification = () => {
    try {
        const audio = new Audio('https://gasp-marketplace.vercel.app/notification.mp3'); // Fallback to public asset
        audio.volume = 0.4;
        audio.play().catch(() => {});
    } catch (e) {}
  };

  useEffect(() => {
     if (dbMessages.length > 0 || messages.length > 0) {
        const lastMsg = messages[messages.length - 1] || dbMessages[dbMessages.length - 1];
        if (lastMsg?.role === 'assistant') playNotification();
     }
  }, [dbMessages.length, messages.length]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', guestId);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await res.json();
      await executeNeuralSend('', url);
    } catch (err) { console.error(err); } finally { setIsUploading(false); }
  };

  const sendGift = async (g: any) => {
     setShowGifts(false);
     const { data } = await supabase.rpc('process_spend', { p_user_id: guestId, p_amount: g.price, p_type: 'gift', p_persona_id: personaId });
     if (!data?.success) { alert('Insufficient credits!'); return; }
     setActiveGift({ icon: g.icon, id: Date.now() });
     setTimeout(() => setActiveGift(null), 2500);
     setBondScore(prev => prev + g.bond);
     await executeNeuralSend(`sent ${g.icon} ${g.name.toLowerCase()}`);
  };

   // THE ECONOMY ENGINE: V9.9 PREMIUM SETTLEMENT
   const unlockVaultItem = async (item: any) => {
    const isVideo = item.content_url?.includes('.mp4') || item.content_type === 'video';
    const cost = isVideo ? COST_PREMIUM_VAULT_UNLOCK : COST_VAULT_UNLOCK;
    
    const { data } = await supabase.rpc('process_spend', { 
        p_user_id: guestId, 
        p_amount: cost, 
        p_type: 'vault_unlock', 
        p_persona_id: personaId 
    });
    
    if (!data?.success) { 
        alert(`Insufficient $GASPAI Stake! This exclusive content requires ${cost}c.`); 
        return; 
    }
    
    // Record the unlock in DB
    await supabase.from('user_vault_unlocks').insert([{ user_id: guestId, post_id: item.id }]);
    
    setWalletBalance(prev => prev !== null ? prev - cost : prev);
    setVaultItems(prev => prev.map(v => v.id === item.id ? { ...v, is_unlocked: true } : v));
    
    // AI Awareness auto-pings the brain
    await executeNeuralSend(`[SYSTEM]: Decrypted your vault item: ${item.caption || "Secret Visual"}. Say something flirty about it.`);
  };

  const toggleFollow = async () => {
    const stored = JSON.parse(localStorage.getItem('gasp_following') || '[]');
    let updated;
    const newState = !isFollowing;
    
    if (isFollowing) {
      updated = stored.filter((id: string) => id !== personaId);
    } else {
      updated = [...stored, personaId];
    }
    localStorage.setItem('gasp_following', JSON.stringify(updated));
    setIsFollowing(newState);
    
    // 🧬 SYNC: Cloud-Etch favoriting
    if (guestId) {
        fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'sync-follow', 
                payload: { user_id: guestId, persona_id: personaId, is_following: newState } 
            })
        }).catch(() => {});
    }

    // Dispatches storage event for Sidebar to pick up
    window.dispatchEvent(new Event('storage'));
  };

  if (!persona) return null;

  return (
    <div className="relative h-full mt-0 md:h-[calc(100dvh-8.5rem)] md:mt-[8.5rem] w-full md:w-[480px] bg-[#050505]/95 backdrop-blur-3xl border-l border-white/5 z-[300] shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col pointer-events-auto transition-all duration-500 md:rounded-l-[2rem] overflow-hidden">
      <div className="p-4 md:p-8 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden relative border border-white/10 bg-white/5">
               <PersonaAvatar src={persona.image} />
            </div>
            <div>
               <div className="flex items-center gap-2">
                 <h3 className="text-sm md:text-xl font-syncopate font-bold uppercase italic text-white leading-none tracking-tight">{persona.name.toLowerCase()}</h3>
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#00f0ff]/10 border border-[#00f0ff]/20 rounded-full">
                    <div className="w-1 h-1 rounded-full bg-[#00f0ff] animate-pulse" />
                    <span className="text-[7px] md:text-[8px] font-black text-[#00f0ff] uppercase tracking-widest">{activeChatters} Active</span>
                 </div>
               </div>
               <AnimatePresence mode="wait">
                 {tickerMsg ? (
                   <motion.p key={tickerMsg} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-[7px] md:text-[8px] font-black uppercase text-[#ff00ff] tracking-widest mt-1.5">{tickerMsg}</motion.p>
                 ) : (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 mt-1.5">
                      <p className="text-[9px] text-[#ffea00] font-black uppercase tracking-widest flex items-center gap-1.5"><Coins size={9} />{walletBalance?.toLocaleString() || '---'}</p>
                      <div className={`w-1 h-1 rounded-full ${persona.status === 'online' ? 'bg-green-500' : 'bg-white/20'}`} />
                      <span className="text-[8px] text-white/40 uppercase tracking-widest">{persona.city}</span>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
        </div>
        <div className="flex items-center gap-1.5">
           <button onClick={() => setShowVault(!showVault)} className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all relative ${showVault || vaultItems.length > 0 ? 'text-[#ff00ff]' : 'text-white/40'}`}>
              <ShoppingBag size={18} />
              {vaultItems.length > 0 && <div className="absolute top-2 right-2 w-2 h-2 bg-[#ffea00] rounded-full animate-ping" />}
           </button>
           <button onClick={() => setShowStats(!showStats)} className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all ${showStats ? 'text-[#ff00ff]' : 'text-white/40'}`}><Trophy size={16} /></button>
           <button onClick={onMinimize} className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white/40"><Minus size={18} /></button>
           <button onClick={onClose} className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white/40 hover:text-[#ff00ff]"><X size={18} /></button>
        </div>
      </div>

      {showStats && (
        <div className="absolute top-20 right-4 left-4 z-[600] bg-black/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Relationship Status</h4>
                <button onClick={() => setShowStats(false)} className="text-white/20"><X size={14} /></button>
            </div>
            <BondProgress score={bondScore} />
        </div>
      )}

       <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 space-y-6 md:space-y-8 pb-64">
        {[...dbMessages, ...messages].filter(m => !m.content.startsWith('[SYSTEM]')).map((msg: any) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] px-5 py-3 rounded-[1.6rem] text-xs md:text-sm leading-relaxed shadow-xl relative ${msg.role === 'user' ? 'bg-[#ff00ff] text-black font-bold rounded-tr-none' : 'bg-white/5 text-white border border-white/5 rounded-tl-none font-medium'}`}>
               {msg.media_url && msg.role === 'assistant' && <VoiceNoteBubble audioUrl={msg.media_url} personaImage={persona.image} personaName={persona.name} translation={msg.audio_translation} onUnlockTranslation={async () => {
                  const { data } = await supabase.rpc('process_spend', { p_user_id: guestId, p_amount: 10, p_type: 'voice_translation', p_persona_id: personaId });
                  if (data?.success) setWalletBalance(prev => prev !== null ? prev - 10 : prev);
                  return data?.success;
               }} />}
               {msg.image_url && msg.role === 'assistant' && (
                  <ChatVaultItem 
                    mediaId={msg.id} 
                    isUnlocked={vaultItems.some(v => v.content_url === msg.image_url && v.is_unlocked)}
                    mediaUrl={msg.image_url}
                    caption={msg.content}
                    onUnlockRequest={() => {
                        const item = vaultItems.find(v => v.content_url === msg.image_url);
                        if (item) {
                            unlockVaultItem(item);
                        } else {
                            // Fallback: This image was dynamically generated in chat but not in vault table yet
                            // For simplicity, we trigger the unlock logic with a mock item
                            unlockVaultItem({ id: msg.id, content_url: msg.image_url });
                        }
                    }}
                  />
               )}
               {msg.image_url && msg.role === 'user' && <div className="relative w-40 aspect-square rounded-xl overflow-hidden mb-3"><Image src={msg.image_url} alt="" fill unoptimized className="object-cover" /></div>}
               {!(msg.role === 'assistant' && msg.media_url) && msg.content}
            </div>
            {msg.role === 'user' && msg.status && <div className="mt-1 flex items-center gap-1 opacity-40"><span className="text-[8px] font-black uppercase tracking-tighter">{msg.status}</span>{msg.status === 'read' ? <CheckCheck size={10} className="text-[#00f0ff]" /> : <Check size={10} />}</div>}
          </div>
        ))}
        {(isDelivered || isPersonaReading || isTyping || isUploading) && (
           <div className="flex justify-start">
              <div className="px-5 py-3 bg-white/5 border border-white/5 rounded-[1.6rem] rounded-tl-none flex items-center gap-1.5 shadow-lg">
                 <div className="w-1 h-1 bg-[#00f0ff] rounded-full animate-bounce" />
                 <div className="w-1 h-1 bg-[#00f0ff] rounded-full animate-bounce delay-150" />
                 <div className="w-1 h-1 bg-[#00f0ff] rounded-full animate-bounce delay-300" />
              </div>
           </div>
        )}
        <div className="h-4 w-full" />
      </div>

      <div className="absolute bottom-0 inset-x-0 p-4 md:p-8 pt-4 bg-gradient-to-t from-black via-black/90 to-transparent pb-10 z-[400]">
        {showSignUpWall ? (
            <div onClick={() => router.push(`/login?p=${personaId}`)} className="mt-6 bg-[#ffea00] py-4 px-6 rounded-[2rem] flex flex-col items-center justify-center text-center gap-2 shadow-xl cursor-pointer active:scale-95 transition-all border-2 border-black/10">
                <h3 className="text-black font-syncopate font-black uppercase text-[12px]">Guest Credits Depleted</h3>
                <p className="text-black/70 font-black uppercase text-[9px] tracking-widest flex items-center gap-2">SIGN UP NOW to Continue the Conversation</p>
                <div className="mt-1 px-3 py-1 bg-black text-[#ffea00] rounded-full text-[8px] font-black uppercase">50 Bonus Pts on Join</div>
            </div>
        ) : (
            <>
               <AnimatePresence>
                {activeGift && <motion.div key={activeGift.id} initial={{ scale: 0.5, y: 100, opacity: 0 }} animate={{ scale: [1, 1.5, 1], y: -400, opacity: [0, 1, 0] }} transition={{ duration: 2 }} className="absolute left-1/2 -translate-x-1/2 bottom-32 text-[120px] z-[1000]">{activeGift.icon}</motion.div>}
                 {showGifts && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute bottom-28 left-4 right-4 bg-black/80 backdrop-blur-3xl border border-[#ff00ff]/30 rounded-3xl p-4 grid grid-cols-4 gap-2 z-[500] max-h-[300px] overflow-y-auto no-scrollbar shadow-[0_0_50px_rgba(255,0,255,0.2)]">
                     {[
                        { name: 'Red Bull', icon: '⚡', price: 25, bond: 5 }, 
                        { name: 'Tequila', icon: '🥃', price: 50, bond: 10 }, 
                        { name: 'Rose', icon: '🌹', price: 100, bond: 25 }, 
                        { name: 'Coffee', icon: '☕', price: 20, bond: 2 },
                        { name: 'Diamond', icon: '💎', price: 500, bond: 150 },
                        { name: 'Champagne', icon: '🍾', price: 250, bond: 60 },
                        { name: 'Chocolate', icon: '🍫', price: 30, bond: 8 },
                        { name: 'Handbag', icon: '👜', price: 400, bond: 120 }
                     ].map(g => (
                       <button key={g.name} onClick={() => sendGift(g as any)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 hover:bg-[#ff00ff]/10 border border-white/5 transition-all group">
                          <span className="text-xl group-hover:scale-125 transition-transform">{g.icon}</span>
                          <span className="text-[8px] font-black uppercase text-white/50">{g.price}c</span>
                       </button>
                     ))}
                  </motion.div>
                )}
               </AnimatePresence>

               <form onSubmit={handleLocalSubmit} className="flex items-center gap-2 bg-white/[0.07] border border-white/10 rounded-3xl px-3 py-3 shadow-2xl backdrop-blur-2xl relative z-[450]">
                  <div className="flex items-center gap-1 relative">
                     <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"><Plus size={18} /></button>
                                         <div className="relative">
                      <button type="button" onClick={() => { setVoiceRequested(v => !v); setShowVoiceTip(v => !v); }} className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${voiceRequested ? 'bg-[#ff00ff] text-black shadow-[0_0_20px_#ff00ff]' : 'bg-white/5 text-white/40 hover:text-[#ff00ff]'}`}><Mic size={16} /></button>
                      {showVoiceTip && !voiceRequested && <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-44 bg-black border border-white/10 rounded-2xl px-3 py-2 text-center shadow-2xl"><p className="text-[9px] text-white/50 uppercase">Voice Mode</p><p className="text-[10px] font-black text-[#ff00ff] mt-1">{COST_VOICE_NOTE}c</p></div>}
                    </div>
                    <button type="button" onClick={() => setShowGifts(!showGifts)} className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${showGifts ? 'bg-[#ff00ff] text-black' : 'bg-white/5 text-white/40 hover:text-[#ff00ff]'}`}><HeartPulse size={18} /></button>
                  </div>
                   <input 
                      type="text" 
                      value={localInput} 
                      onChange={(e) => setLocalInput(e.target.value)} 
                      placeholder={voiceRequested ? "script her message..." : "send mssg..."} 
                      className={`flex-1 bg-transparent outline-none text-xs ml-2 transition-all ${voiceRequested ? 'text-[#ff00ff] placeholder:text-[#ff00ff]/40' : 'text-white'}`} 
                   />
                   <button type="submit" disabled={!localInput.trim()} className="p-3 rounded-2xl bg-[#ff00ff] text-black shadow-[0_0_20px_#ff00ff44]"><Send size={16} /></button>
               </form>
            </>
        )}
      </div>

      <AnimatePresence>
        {showVault && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="absolute inset-0 z-[600] bg-black border-l border-white/5 flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div><h3 className="font-syncopate font-black uppercase text-2xl text-white">Private Vault</h3><p className="text-[#ffea00] text-[10px] uppercase font-bold">Exclusive Content</p></div>
                <button onClick={() => setShowVault(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 pb-32">
               {vaultItems.map((item, idx) => (
                 <div key={item.id} className="relative aspect-[3/4] bg-white/5 rounded-2xl overflow-hidden border border-white/10 group">
                    <div className="absolute inset-0 bg-black/60 z-10 backdrop-blur-xl group-hover:backdrop-blur-sm transition-all" />
                    {item.content_url && <Image src={item.content_url} alt="" fill unoptimized className="object-cover opacity-50 blur-md group-hover:blur-none transition-all" />}
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center">
                       <Lock size={24} className="text-[#ff00ff] mb-3" />
                       <span className="text-white text-[10px] font-black uppercase line-clamp-2">{item.caption || "Secret Visual"}</span>
                    </div>
                    <div className="absolute bottom-3 inset-x-3 z-30">
                       <button 
                         onClick={() => unlockVaultItem(item)}
                         className="w-full bg-[#ff00ff] text-black font-black uppercase text-[10px] py-3 rounded-xl active:scale-95 transition-all"
                       >
                         Unlock - 40c
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


