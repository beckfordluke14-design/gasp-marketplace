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

  const personaAnchor = searchParams.get('p');
  const nextPath = personaAnchor ? `/?persona=${personaAnchor}` : '/';

  useEffect(() => {
    if (ready && authenticated) {
        console.log('[Login] Identity verified. Synchronizing node to:', nextPath);
        router.push(nextPath);
    }
  }, [ready, authenticated, router, nextPath]);

  // Handle specific login types with fallback
  const handleLogin = (method?: string) => {
    console.log('[Sovereign Login] Initializing neural bridge node:', method || 'universal');
    try {
      if (method) {
        login({ loginMethod: method as any });
      } else {
        login();
      }
    } catch (e: any) {
      console.error('[Sovereign Login] Bridge protocol error:', e.message);
      login(); // Forced fallback to universal modal
    }
  };

  if (!ready) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-t-[#ff00ff] border-r-transparent border-b-[#00f0ff] border-l-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(255,0,255,0.2)]" />
        <div className="text-white/20 font-syncopate text-[8px] uppercase tracking-[0.5em] animate-pulse">Synchronizing Neural Node...</div>
      </div>
    );
  }

  return (
    <motion.div 
         initial={{ opacity: 0, scale: 0.9 }} 
         animate={{ opacity: 1, scale: 1 }} 
         className="relative z-10 w-full max-w-md"
       >
          <div className="bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 md:p-14 shadow-[0_0_120px_rgba(0,0,0,0.8)] overflow-hidden relative group">
             {/* Glow Accents */}
             <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#ff00ff]/10 rounded-full blur-[60px] group-hover:bg-[#ff00ff]/20 transition-colors duration-1000 pointer-events-none" />
             <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#00f0ff]/10 rounded-full blur-[60px] group-hover:bg-[#00f0ff]/20 transition-colors duration-1000 pointer-events-none" />
             
             <div className="flex flex-col items-center mb-12 text-center relative z-10">
                <div className="w-20 h-20 bg-gradient-to-tr from-[#ff00ff] to-[#00f0ff] rounded-3xl flex items-center justify-center rotate-12 mb-10 shadow-[0_0_50px_rgba(255,0,255,0.3)] group-hover:rotate-[102deg] transition-transform duration-1000">
                   <Disc size={40} className="-rotate-12 group-hover:-rotate-[102deg] transition-transform duration-1000 text-black" />
                </div>
                                <h2 className="text-3xl font-syncopate font-black uppercase italic tracking-tighter text-white mb-3">
                    Sovereign Protocol
                 </h2>
                 <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-[#ff00ff] to-transparent mb-4" />
                 <p className="text-[#00f0ff] text-[10px] font-black uppercase tracking-[0.4em] italic opacity-80">
                    Sovereign Identity Hub
                 </p>
              </div>

              <div className="space-y-4 relative z-50 w-full">
                 {/* 🛡️ Primary Social Entry: Google */}
                 <button 
                   onClick={() => handleLogin('google')}
                   className="w-full h-16 rounded-2xl bg-white text-black font-syncopate font-black uppercase text-[10px] tracking-[0.1em] shadow-[0_10px_30px_rgba(255,255,255,0.05)] hover:bg-[#00e0ff] hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center px-6 gap-4 group/btn relative z-50"
                 >
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                      <span className="text-white text-[12px] font-bold">G</span>
                    </div>
                    <span className="flex-1 text-left">Continue with Google</span>
                 </button>

                 {/* 🛡️ Secondary Social Nodes: Twitter + Discord */}
                 <div className="grid grid-cols-2 gap-3 relative z-50">
                    <button 
                      onClick={() => handleLogin('twitter')}
                      className="h-14 rounded-2xl bg-[#1d9bf0]/10 border border-[#1d9bf0]/20 text-[#1d9bf0] font-black uppercase text-[9px] tracking-widest hover:bg-[#1d9bf0] hover:text-white transition-all flex items-center justify-center gap-2 relative z-50"
                    >
                      Twitter
                    </button>
                    <button 
                      onClick={() => handleLogin('discord')}
                      className="h-14 rounded-2xl bg-[#5865f2]/10 border border-[#5865f2]/20 text-[#5865f2] font-black uppercase text-[9px] tracking-widest hover:bg-[#5865f2] hover:text-white transition-all flex items-center justify-center gap-2 relative z-50"
                    >
                      Discord
                    </button>
                 </div>

                 <div className="flex items-center gap-4 py-2">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/10">or</span>
                    <div className="h-px flex-1 bg-white/5" />
                 </div>

                 {/* 🛡️ Direct Neural Entry (Email/Wallet Modal) */}
                 <button 
                   onClick={() => handleLogin()}
                   className="w-full h-16 rounded-2xl bg-transparent border border-white/10 text-white hover:text-[#ff00ff] font-syncopate font-black uppercase text-[9px] tracking-[0.2em] hover:bg-white/5 hover:border-[#ff00ff]/40 transition-all flex items-center justify-center gap-3 italic relative z-50"
                 >
                    <KeyRound size={16} className="text-[#ff00ff]" /> Initialize Universal ID
                 </button>

                <div className="pt-6 border-t border-white/5 mt-8 items-center flex flex-col gap-4">
                   <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-full ring-1 ring-white/5">
                      <UserCheck size={12} className="text-[#00f0ff]" />
                      <span className="text-[8px] uppercase font-black tracking-[0.2em] text-white/40">Privacy Protected by Privy v1.0</span>
                   </div>
                   
                   <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.15em] italic text-center leading-relaxed">
                      Zero-friction neural connection. <br />
                      Your data stays <span className="text-[#ff00ff]">Sovereign</span>.
                   </p>
                </div>
             </div>
          </div>
          
          {/* Footer link to privacy */}
          <div className="mt-8 text-center flex items-center justify-center gap-6 opacity-30 hover:opacity-100 transition-opacity">
            <a href="/privacy" className="text-[9px] font-black uppercase tracking-widest hover:text-[#ff00ff]">Privacy Charter</a>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <a href="/terms" className="text-[9px] font-black uppercase tracking-widest hover:text-[#00f0ff]">Terms of Use</a>
          </div>
    </motion.div>
  );
}

export default function EntryProtocol() {
  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 relative overflow-hidden font-outfit">
       {/* Background Grid/Pattern */}
       <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,#ff00ff05,transparent_50%)]" />
       <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

       {/* Floating Orbs */}
       <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-[#ff00ff]/5 rounded-full blur-[100px] animate-pulse" />
       <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-[#00f0ff]/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
       
       <Suspense fallback={<div className="text-white font-syncopate text-[10px] tracking-[0.5em] animate-pulse uppercase">Syncing Node...</div>}>
          <LoginForm />
       </Suspense>
    </div>
  );
}
