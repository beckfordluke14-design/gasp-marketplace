'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

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
  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading }: any = useChat({
    api: '/api/chat',
    id: `${profileId}-${guestId}`,
    body: {
      userId: guestId,
      personaId: profileId,
    },
  } as any);

  // 2. NEURAL HYDRATION: Load historical messages from Supabase
  useEffect(() => {
    async function loadHistory() {
      if (!guestId || !profileId) return;
      
      const { data: dbMessages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', guestId)
        .eq('persona_id', profileId)
        .order('created_at', { ascending: true })
        .limit(20);

      if (dbMessages && dbMessages.length > 0) {
        setMessages(dbMessages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: new Date(m.created_at),
        })));
      }

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
             {(messages || []).map((m: any) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-5 py-3 rounded-[1.5rem] text-xs leading-relaxed shadow-xl ${
                    m.role === 'user'
                    ? 'bg-[#00f0ff] text-black font-bold rounded-tr-none'
                    : 'bg-white/5 text-white border border-white/5 rounded-tl-none font-medium'
                  }`}>
                    {m.content}
                  </div>
                </motion.div>
             ))}
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
