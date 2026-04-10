'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, X, Send, User, ShieldCheck, 
  HelpCircle, Mail, AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';

/**
 * 🛠️ GASP SUPPORT DRAWER v1.0
 * Low-visibility, high-conversion support flow.
 * Auto-links Guest ID and Privy data for triage.
 */

import { usePathname } from 'next/navigation';

export default function SupportDrawer() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'problem' | 'email' | 'success'>('problem');
  
  // 🛡️ CONVERSION INTEGRITY: Do not show support on the funnel page
  if (pathname === '/funnel') return null;

  const [problem, setProblem] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: "Welcome to GASP Support. How can I help you today, Papi? 🌪️" }
  ]);
  const [inputValue, setInputValue] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async () => {
    if (!problem || !email) return;
    setIsSubmitting(true);
    
    try {
      const gid = localStorage.getItem('gasp_guest_id');
      const pid = localStorage.getItem('privy_id'); // If using privy
      
      const res = await fetch('/api/support/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: gid || pid || 'anonymous',
          email,
          problem,
          messages,
          metadata: {
            url: window.location.href,
            platform: navigator.platform,
            privyId: pid,
          }
        })
      });

      if (res.ok) {
        setStep('success');
      }
    } catch (err) {
      console.error('[Support Error]:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMsgs = [...messages, { role: 'user', content: inputValue }];
    setMessages(newMsgs);
    setInputValue('');

    if (step === 'problem') {
       setProblem(inputValue);
       setTimeout(() => {
         setMessages(prev => [...prev, { 
           role: 'assistant', 
           content: "Understood. I've logged the issue. What's your email so we can reach out if we need more info? 📧" 
         }]);
         setStep('email');
       }, 800);
    } else if (step === 'email') {
       setEmail(inputValue);
       // Final step will trigger submission
    }
  };

  useEffect(() => {
    if (step === 'email' && email) {
       handleSubmit();
    }
  }, [email]);

  return (
    <>
      {/* 🚀 GHOST ICON: DISCREET & HIGH-STATUS */}
      <motion.button
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 left-6 z-[60] w-10 h-10 bg-black/40 backdrop-blur-xl border border-white/5 rounded-full flex items-center justify-center shadow-2xl group hover:border-white/20 transition-all"
      >
        <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
        <HelpCircle size={14} className="text-white/20 group-hover:text-white/60 transition-colors" />
      </motion.button>

      {/* 🛰️ SUPPORT DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[350px] max-w-[calc(100vw-3rem)] h-[500px] z-[70] bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden backdrop-blur-3xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#ff00ff] flex items-center justify-center shadow-lg">
                     <ShieldCheck size={20} className="text-white" />
                  </div>
                  <div>
                     <h3 className="text-xs font-black text-white uppercase tracking-widest">GASP Support</h3>
                     <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Automated Terminal</span>
                  </div>
               </div>
               <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
                  <X size={18} />
               </button>
            </div>

            {/* Chat Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
               {messages.map((m, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                     <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm font-medium ${
                       m.role === 'user' 
                         ? 'bg-white text-black font-semibold' 
                         : 'bg-white/5 text-white/80 border border-white/10'
                     }`}>
                        {m.content}
                     </div>
                  </motion.div>
               ))}

               {step === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center p-6 bg-[#ffea00]/5 border border-[#ffea00]/20 rounded-3xl gap-3 text-center"
                   >
                     <CheckCircle2 size={32} className="text-[#ffea00]" />
                     <div className="space-y-1">
                        <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none">Ticket Manifested</p>
                        <p className="text-[9px] font-bold text-white/40 leading-relaxed">
                           Our syndicate team has your flight data. <br/> Reach out via email soon.
                        </p>
                     </div>
                  </motion.div>
               )}

               {isSubmitting && (
                  <div className="flex justify-center py-4">
                     <Loader2 className="w-6 h-6 text-[#ffea00] animate-spin" />
                  </div>
               )}
            </div>

            {/* Input Footer */}
            {step !== 'success' && (
               <form onSubmit={handleSend} className="p-5 border-t border-white/5 bg-black/40">
                  <div className="relative group">
                     <input 
                       value={inputValue}
                       onChange={(e) => setInputValue(e.target.value)}
                       placeholder={step === 'problem' ? "Describe the issue..." : "Enter your email..."}
                       className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl text-[13px] text-white focus:outline-none focus:border-[#ff00ff]/50 transition-all placeholder:text-white/20 font-medium pr-14"
                     />
                     <button 
                       type="submit"
                       className="absolute right-2 top-2 bottom-2 w-10 flex items-center justify-center bg-white text-black rounded-xl hover:bg-[#ffea00] transition-all active:scale-95"
                     >
                        <Send size={16} />
                     </button>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-4 opacity-30">
                     <div className="flex items-center gap-1.5 grayscale">
                        <AlertCircle size={10} className="text-white" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-white">Auto-linked Session ID</span>
                     </div>
                  </div>
               </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
