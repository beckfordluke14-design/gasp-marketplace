'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Clock, User, Sparkles } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ChatContainerProps {
  personaId: string;
  personaName: string;
  guestId: string;
}

/**
 * THE RESUME CHAT ENGINE (Persistence Node)
 * Objective: Hydrate history and maintain thread continuity across sessions.
 */
export default function ChatContainer({ personaId, personaName, guestId }: ChatContainerProps) {
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. USE-CHAT CIRCUIT: Hydrated via Supabase History
  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading } = useChat({
    api: '/api/chat',
    body: {
      userId: guestId,
      personaId: personaId
    }
  });

  // 2. NEURAL HYDRATION: Load historical nodes before allowing input
  useEffect(() => {
    async function loadHistory() {
      console.log(`🧠 [Hydration] Resuming neural thread for ${personaName}...`);
      
      const { data: dbMessages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', guestId)
        .eq('persona_id', personaId)
        .order('created_at', { ascending: true })
        .limit(20);

      if (dbMessages && dbMessages.length > 0) {
        setMessages(dbMessages.map(m => ({
          id: m.id,
          role: m.role as any,
          content: m.content,
          createdAt: new Date(m.created_at)
        })));
      }
      
      setHistoryLoaded(true);
    }
    
    if (guestId && personaId) loadHistory();
  }, [guestId, personaId, personaName, setMessages]);

  // 3. Auto-Scroll Logic
  useEffect(() => {
    if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
             {messages.map((m) => (
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
      </div>

      {/* Input Core */}
      <div className="p-6 bg-black/60 border-t border-white/10">
         <form onSubmit={handleSubmit} className="relative flex items-center">
            <input 
              value={input}
              onChange={handleInputChange}
              disabled={!historyLoaded}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={`resume with ${personaName.toLowerCase()}...`}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-medium outline-none focus:border-[#00f0ff]/40 transition-all text-white placeholder:text-white/20 relative z-[500] pointer-events-auto"
            />
            <button 
              type="submit" 
              className="absolute right-3 p-3 bg-[#00f0ff] text-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]"
            >
               <Send size={16} />
            </button>
         </form>
      </div>
    </div>
  );
}



