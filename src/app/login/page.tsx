'use client';

import { useState, Suspense } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, ShieldAlert, KeyRound, UserCheck } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/components/providers/UserProvider';

function LoginForm() {
  const { login, authenticated, ready, user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  );

  const personaAnchor = searchParams.get('p');
  const nextPath = personaAnchor ? `/?persona=${personaAnchor}` : '/feed';

  useEffect(() => {
    if (ready && authenticated) {
        router.push(nextPath);
    }
  }, [ready, authenticated, router, nextPath]);

  if (!ready) return <div className="text-white/20 font-syncopate text-[10px] tracking-widest animate-pulse">Neural Sync in Progress...</div>;


  return (
    <motion.div 
         initial={{ opacity: 0, y: 20, scale: 0.95 }} 
         animate={{ opacity: 1, y: 0, scale: 1 }} 
         className="relative z-10 w-full max-w-md bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_100px_rgba(0,0,0,1)]"
       >
          <div className="flex flex-col items-center mb-10 text-center">
             <div className="w-16 h-16 bg-[#ff00ff] rounded-2xl flex items-center justify-center rotate-45 mb-8 shadow-[0_0_40px_rgba(255,0,255,0.4)]">
                <Disc size={32} className="-rotate-45 text-black" />
             </div>
             <h2 className="text-2xl font-syncopate font-black uppercase italic tracking-tighter text-white mb-2 italic">
                Gasp App Login
             </h2>
             <p className="text-[#00f0ff] text-[9px] font-black uppercase tracking-[0.3em] italic">
                Neural connection priority hub
             </p>
          </div>

          <div className="space-y-6">
             <button 
               onClick={login}
               className="w-full h-16 rounded-2xl bg-[#ff00ff] text-black font-syncopate font-black uppercase text-xs tracking-[0.2em] shadow-[0_0_50px_rgba(255,0,255,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 italic"
             >
                <KeyRound size={20} /> Initialize Identity
             </button>

             <div className="flex items-center gap-4 text-white/5">
                <div className="flex-1 h-px bg-current" /><span className="text-[10px] uppercase font-black tracking-widest text-white/20">Secured via Privy Hub</span><div className="flex-1 h-px bg-current" />
             </div>

             <div className="pt-2">
                <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.2em] italic text-center leading-relaxed">
                   Social login. Wallet connection. Self-custody. <br />
                   Welcome to the <span className="text-white">Collective</span>.
                </p>
             </div>
          </div>
    </motion.div>
  );
}

export default function EntryProtocol() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-outfit">
       <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#ff00ff]/5 via-transparent to-[#00f0ff]/5" />
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff00ff]/10 rounded-full blur-[120px] opacity-20" />
       
       <Suspense fallback={<div className="text-white font-syncopate text-[10px] tracking-[0.5em] animate-pulse uppercase">Initializing Identity...</div>}>
          <LoginForm />
       </Suspense>
    </div>
  );
}
