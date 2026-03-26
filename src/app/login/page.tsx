'use client';

import { useState, Suspense } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';
import { Disc, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  );

  const personaAnchor = searchParams.get('p');
  const nextPath = personaAnchor ? `/?persona=${personaAnchor}` : '/feed';

  const handleIdentitySync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // 🧬 THE AUDIT TRAIL: Hit consent API before Authentication
    try {
        await fetch('/api/consent', { method: 'POST' });
    } catch (e) {
        console.warn('[Consent Log Error]: Handled.');
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(`[LOGIN_ERR]: ${authError.message.toUpperCase()}`);
      setIsLoading(false);
    } else {
      window.location.href = nextPath;
    }
  };

  const handleOAuth = async () => {
    setIsLoading(true);
    // 🧬 THE AUDIT TRAIL: Hit consent API before Authentication
    try {
        await fetch('/api/consent', { method: 'POST' });
    } catch (e) {
        console.warn('[Consent Log Error]: Handled.');
    }

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` 
      }
    });
  };

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
                {personaAnchor ? `Connect to ${personaAnchor}` : 'Gasp App Login'}
             </h2>
             <p className="text-[#00f0ff] text-[9px] font-black uppercase tracking-[0.3em] italic">
                Neural connection priority hub
             </p>
          </div>

          <div className="space-y-6">
             <button 
               onClick={handleOAuth}
               className="w-full h-14 rounded-2xl flex items-center justify-center gap-4 transition-all group active:scale-95 bg-white/5 border border-white/10 hover:bg-white/10"
             >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" />
                <span className="text-white text-[11px] font-black uppercase tracking-widest italic group-hover:text-[#ff00ff]">Sign in with Google</span>
             </button>

             <div className="flex items-center gap-4 text-white/5">
                <div className="flex-1 h-px bg-current" />
                <span className="text-[10px] uppercase font-black tracking-widest">or email login</span>
                <div className="flex-1 h-px bg-current" />
             </div>

             <form onSubmit={handleIdentitySync} className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4 italic">Identity Mail</label>
                   <input 
                     type="email" 
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-sm focus:border-[#ff00ff]/40 outline-none transition-all placeholder:text-white/10"
                     placeholder="your@email.com"
                     required
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4 italic">Security Code</label>
                   <input 
                     type="password" 
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-sm focus:border-[#ff00ff]/40 outline-none transition-all placeholder:text-white/10"
                     placeholder="••••••••"
                     required
                   />
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] text-red-500 font-black uppercase tracking-widest text-center italic">
                     {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl font-syncopate font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-30 bg-white text-black hover:bg-[#ff00ff]"
                >
                   {isLoading ? 'Synchronizing...' : 'Enter Hub'}
                </button>
             </form>

             <div className="pt-2">
                <p className="text-white/20 text-[8px] font-black uppercase tracking-[0.2em] italic text-center leading-relaxed px-4">
                   By entering, you acknowledge all personas are AI-generative for entertainment. 18+ required.
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
       
       <Suspense fallback={<div className="text-white font-syncopate text-[10px] tracking-[0.5em] animate-pulse">Initializing Identity...</div>}>
          <LoginForm />
       </Suspense>
    </div>
  );
}



