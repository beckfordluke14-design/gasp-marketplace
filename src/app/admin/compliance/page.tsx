'use client';

import { useState } from 'react';
import { ShieldAlert, RefreshCcw, CheckCircle2, ServerCrash } from 'lucide-react';

/**
 * HIDDEN COMPLIANCE DASHBOARD
 * /admin/compliance
 * This route forces a clean state for the high-risk payment processor review team.
 */
export default function ComplianceAdmin() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

  const handleReset = async () => {
    setLoading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const res = await fetch('/api/admin/reset-compliance', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus({ type: 'success', message: 'Vault locked. Account 10,000 pts seeded. Pass: review' });
      } else {
        setStatus({ type: 'error', message: data.error || 'Server error during state wipe.' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Fatal Network Error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-6 font-mono selection:bg-red-500/30">
      
      <div className="max-w-md w-full bg-[#0a0a0a] border border-red-500/20 rounded-[2rem] p-8 md:p-12 shadow-[0_0_50px_rgba(255,0,0,0.1)] relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('/bg-grid.svg')] opacity-5 pointer-events-none" />

        <div className="relative z-10 space-y-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.2)]">
                <ShieldAlert size={36} className="text-red-500" />
            </div>

            <div className="space-y-2">
                <h1 className="text-2xl font-black uppercase tracking-widest text-red-500">Compliance Reset</h1>
                <p className="text-white/40 text-[10px] md:text-xs leading-relaxed uppercase tracking-widest">
                    This triggers a destructive <b>Railway Core</b> wipe. It will recreate the <code className="text-white/80">compliance@gasp.fun</code> account, load 10,000 Credits, lock all vault access, and seed 3 Unsplash mock items.
                </p>
            </div>

            <button 
                onClick={handleReset} 
                disabled={loading}
                className={`w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all ${
                    loading 
                    ? 'bg-red-500/20 text-red-500/50 cursor-not-allowed' 
                    : 'bg-red-600 text-white hover:bg-red-500 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(220,38,38,0.5)]'
                }`}
            >
                {loading ? (
                    <>
                        <RefreshCcw size={16} className="animate-spin" />
                        Executing Wipe...
                    </>
                ) : (
                    'Reset Account State'
                )}
            </button>

            {status.type !== 'idle' && (
                <div className={`w-full p-4 rounded-xl border flex items-start gap-3 text-left ${status.type === 'success' ? 'bg-[#00ff41]/5 border-[#00ff41]/20 text-[#00ff41]' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                    {status.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5" /> : <ServerCrash size={18} className="mt-0.5" />}
                    <p className="text-[10px] uppercase font-bold tracking-wider leading-relaxed">{status.message}</p>
                </div>
            )}

            {/* CCBILL UNDERWRITER NAV BLOCK */}
            <div className="w-full mt-6 pt-6 border-t border-red-500/20 flex flex-col gap-3 font-sans">
                <p className="text-[9px] uppercase tracking-[0.2em] font-black text-red-500 mb-2">Legal Routing (Reviewer Access)</p>
                <div className="grid grid-cols-2 gap-2 text-left">
                    <a href="/terms" className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/5 transition-all text-white/60 hover:text-white text-[10px] uppercase font-black tracking-widest flex items-center gap-2">Terms</a>
                    <a href="/privacy" className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/5 transition-all text-white/60 hover:text-white text-[10px] uppercase font-black tracking-widest flex items-center gap-2">Privacy</a>
                    <a href="/refunds" className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/5 transition-all text-white/60 hover:text-white text-[10px] uppercase font-black tracking-widest flex items-center gap-2 col-span-2 text-center justify-center text-red-400">Refunds & Cancellation Policy</a>
                </div>
            </div>
        </div>
      </div>

      <div className="mt-6 text-center text-white/20 text-[9px] font-bold uppercase tracking-widest">
        Support inquiries: <a href="/contact" className="hover:text-red-500 transition-colors">Contact Support Hub</a> <br/>
        © 2026 AllTheseFlows LLC
      </div>

    </div>
  );
}



