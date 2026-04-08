'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Clock, Sparkles, Mic, Gift } from 'lucide-react';
import VoiceNoteBubble from './VoiceNoteBubble';

interface ChatContainerProps {
  profileId: string;
  profileName: string;
  guestId: string;
}

/**
 * THE RESUME CHAT ENGINE (Persistence Node)
 * Objective: Hydrate history and maintain thread continuity across sessions.
 * NOTE: useChat is cast 'as any' throughout because @ai-sdk/react v3+ changed the API surface.
 */
export default function ChatContainer({ profileId, profileName, guestId }: ChatContainerProps) {
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. USE-CHAT CIRCUIT — cast as any to survive AI SDK v3 API changes
  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading, data }: any = useChat({
    api: '/api/chat',
    id: `${profileId}-${guestId}`,
    body: {
      userId: guestId,
      personaId: profileId,
    },
  } as any);

  // 2. NEURAL HYDRATION: Load historical messages from Railway PostgreSQL via Internal API
  useEffect(() => {
    async function loadHistory() {
      if (!guestId || !profileId) return;
      
      try {
        const res = await fetch(`/api/chat/history?userId=${guestId}&personaId=${profileId}`);
        const data = await res.json();
        
        if (data.success && data.messages) {
          setMessages(data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: new Date(m.createdAt),
            // 🧠 DNA Persistence
            audio_url: m.audio_url,
            audio_script: m.audio_script
          })));
        }
      } catch (err) { console.error('[Railway Hydration Fail]:', err); }

      setHistoryLoaded(true);
    }

    loadHistory();
  }, [guestId, profileId, setMessages]);

  // 3. Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLocalSubmit = (e: any) => {
    e.preventDefault();
    if (!input?.trim() || !guestId) return;
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
      {/* Thread Status Header */}
      <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Persistent Neural Link Active</span>
         </div>
         <Clock size={14} className="text-white/20" />
      </div>

      {/* Message Matrix */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        {!historyLoaded ? (
           <div className="h-full flex items-center justify-center gap-3">
              <Sparkles className="animate-spin text-[#00f0ff]" size={20} />
              <p className="text-[9px] font-black uppercase tracking-widest text-[#00f0ff]">Re-connecting Pulse...</p>
           </div>
        ) : (
           <AnimatePresence>
             {(messages || []).map((m: any) => {
                // 🧬 SOVEREIGN SIDE-CHANNEL INGRESS (V5.40 - Persistent Protocol)
                // We check the 'data' stream for voice note attachments for this specific message.
                // Priority: Use Persistent DB columns first, otherwise the ephemeral 'data' stream.
                const voiceMetadata = m.audio_url 
                   ? { type: 'voice-note', audioUrl: m.audio_url, audio_script: m.audio_script }
                   : (messages as any).indexOf(m) === messages.length - 1 ? (data as any)?.[data?.length - 1] : null;

                const isVoiceMessage = voiceMetadata && (voiceMetadata.type === 'voice-note' || voiceMetadata.audioUrl);
                const isRecording = m.role === 'assistant' && !isVoiceMessage && messages.indexOf(m) === messages.length - 1 && isLoading;

                const isGift = m.content?.startsWith('[SENT_GIFT]');
                const giftText = isGift ? m.content.replace('[SENT_GIFT]:', '').trim() : m.content;

                return (
                  <motion.div
                    initial={{ opacity: 0, scale: isGift ? 0.5 : 1, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    key={m.id}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} gap-2 relative`}
                  >
                    {!isGift ? (
                      <div className={`max-w-[85%] px-5 py-3 rounded-[2.5rem] shadow-xl ${
                        m.role === 'user'
                        ? 'bg-[#00f0ff] text-black font-bold rounded-tr-none border border-[#00f0ff]/20'
                        : 'bg-white/5 text-white border border-white/5 rounded-tl-none font-medium'
                      }`}>
                        <div className="text-[14px] leading-relaxed whitespace-pre-wrap">
                          {giftText}
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* 🎆 NEURAL BURST: Sparkles firing from behind the gift */}
                        <AnimatePresence>
                           {(messages.indexOf(m) === messages.length - 1 && !m.audio_url) && (
                              <GiftParticles />
                           )}
                        </AnimatePresence>

                        <motion.div 
                          initial={{ rotate: -5, scale: 0.8 }}
                          animate={{ rotate: [0, -4, 4, -4, 4, 0], scale: 1 }}
                          transition={{ 
                            duration: 0.6, 
                            type: 'spring', 
                            stiffness: 300, 
                            damping: 15 
                          }}
                          className="max-w-[85%] px-6 py-4 bg-gradient-to-br from-[#ff00ff] to-[#7000ff] border border-white/20 rounded-[2.5rem] rounded-tr-none shadow-[0_0_50px_rgba(255,0,255,0.4)] flex items-center gap-3 relative overflow-hidden group ml-auto"
                        >
                           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                           <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-[0_0_20px_white]">
                              <Gift size={18} className="text-[#ff00ff]" />
                           </div>
                           <div>
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 block mb-1">Syndicate Gift Dispatched</span>
                              <div className="text-[14px] font-black text-white leading-tight uppercase tracking-tighter italic">
                                {giftText}
                              </div>
                           </div>
                        </motion.div>
                      </div>
                    )}

                    {isRecording && (
                       <motion.div 
                         initial={{ opacity: 0, x: -10 }}
                         animate={{ opacity: 1, x: 0 }}
                         className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 w-fit"
                       >
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]" />
                          <Mic size={14} className="text-white/40" />
                          <span className="text-[11px] text-white/40 italic">Recording technical pulse...</span>
                       </motion.div>
                    )}

                    {isVoiceMessage && (
                       <div className="w-full max-w-[85%]">
                          <VoiceNoteBubble 
                            audioUrl={voiceMetadata.audioUrl}
                            audioData={voiceMetadata.audioData}
                            profileName={profileName}
                            isUnlocked={true}
                            timestamp={m.createdAt ? new Date(m.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase() : ''}
                          />
                       </div>
                    )}
                  </motion.div>
                );
              })}

              {/* 🛑 TACTILE FEEDBACK: TYPING INDICATOR (V5.17) */}
              {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start items-start gap-2"
                >
                   <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-full flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-bounce" />
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-5 py-3 bg-white/5 rounded-full flex gap-1.5 items-center">
              <span className="w-1 h-1 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 bg-[#00f0ff] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 bg-[#00f0ff] rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Input Core */}
      <div className="p-6 bg-black/60 border-t border-white/10">
         <form onSubmit={handleLocalSubmit} className="relative flex items-center">
            <input
              value={input || ''}
              onChange={handleInputChange}
              disabled={!historyLoaded || isLoading}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={`message ${profileName.toLowerCase()}...`}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-medium outline-none focus:border-[#00f0ff]/40 transition-all text-white placeholder:text-white/20 relative z-[500] pointer-events-auto"
            />
            <button
              type="submit"
              disabled={!input?.trim() || isLoading}
              className="absolute right-3 p-3 bg-[#00f0ff] text-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-40"
            >
               <Send size={16} />
            </button>
         </form>
      </div>
    </div>
  );
}
