'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Flame, Users, TrendingDown, Database, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * 🛰️ SYNDICATE ADMIN: System Vitals
 * Objective: Real-time monitoring of shadow burn deflationary stats and global node health.
 */
export default function AdminVitals() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVitals = async () => {
    try {
      const adminKey = localStorage.getItem('admin_gasp_key');
      const res = await fetch('/api/admin/system?action=vitals', {
          headers: { 'x-admin-key': adminKey || '' }
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Identity Verification Failed');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVitals();
    const interval = setInterval(fetchVitals, 60000); // Pulse check every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-12 h-12 rounded-full border-2 border-[#ff00ff] border-t-transparent animate-spin" 
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-10 text-center space-y-6">
        <ShieldCheck size={64} className="text-red-500 opacity-20" />
        <h1 className="text-3xl font-syncopate font-black text-red-500 uppercase italic">Access Denied</h1>
        <p className="text-white/40 text-sm italic max-w-md uppercase tracking-widest">{error}. Ensure your Master Secret Key is entered in the Command Hub.</p>
        <Link href="/admin" className="px-8 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all">Return to Command Hub</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white font-outfit p-8 md:p-20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#ff00ff11,transparent)] pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="space-y-4">
                    <Link href="/admin" className="flex items-center gap-2 text-white/40 hover:text-[#ff00ff] transition-colors text-[10px] font-black uppercase tracking-widest underline decoration-[#ff00ff]/20">
                        <ArrowLeft size={12} />
                        Back to Hub
                    </Link>
                    <h1 className="text-5xl md:text-8xl font-syncopate font-black italic tracking-tighter leading-none">
                        System <span className="text-[#ff00ff]">Vitals</span>
                    </h1>
                    <p className="text-xs text-white/30 uppercase tracking-[0.3em] italic">Real-time Deflationary Pulse • v1.404</p>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-3xl">
                    <Activity className="text-green-500 animate-pulse" size={24} />
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[.2em] text-white/30">Network Status</p>
                        <p className="text-[10px] font-black uppercase text-green-500">Sovereign Node Online</p>
                    </div>
                </div>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Inflow Pulse', val: data.burn.total_burned_credits.toLocaleString(), icon: <Flame className="text-orange-500" />, blur: 'bg-orange-500/10 border-orange-500/20' },
                    { label: 'Total $GASPai Issued', val: data.burn.total_points_issued.toLocaleString(), icon: <Zap className="text-[#00f0ff]" />, blur: 'bg-[#00f0ff]/10 border-[#00f0ff]/20' },
                    { label: '$GASPai in Circulation', val: data.totalPointsInCirculation.toLocaleString(), icon: <TrendingDown className="text-purple-500" />, blur: 'bg-purple-500/10 border-purple-500/20' },
                    { label: 'Total Identities', val: data.totalUsers.toLocaleString(), icon: <Users className="text-[#ff00ff]" />, blur: 'bg-[#ff00ff]/10 border-[#ff00ff]/20' }
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className={`p-8 rounded-[2rem] border ${stat.blur} backdrop-blur-3xl space-y-4 shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-all`}
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                            {stat.icon}
                        </div>
                        <h3 className="text-3xl font-syncopate font-black italic tracking-tighter italic">{stat.val}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Burn Protocol Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 p-10 rounded-[3rem] bg-white/[0.03] border border-white/10 space-y-8 relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 p-10 opacity-[0.02]">
                        <Database size={200} />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-2xl font-syncopate font-black italic uppercase tracking-tighter italic">Shadow Burn Integrity</h3>
                        <p className="text-sm text-white/40 max-w-xl leading-relaxed italic">
                            Every time a user spends credits, our 🧬 **Pulse Protocol** executes a 1:1 match in the deflationary ledger. 
                            This burns the underlying asset value and mints an equivalent number of **GASP Points** as a governance layer reward.
                        </p>
                    </div>

                    <div className="space-y-4 bg-black/40 p-8 rounded-3xl border border-white/5 backdrop-blur-sm relative z-10">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em]">Integrity Check</span>
                            <span className="text-[10px] font-black uppercase text-green-500 tracking-[0.3em]">Verification Successful</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }} animate={{ width: '99%' }} transition={{ duration: 2 }}
                                className="h-full bg-gradient-to-r from-[#ff00ff] to-[#00f0ff]" 
                            />
                        </div>
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.4em] text-white/10 italic">
                            <span>Sovereign Hash: {Math.random().toString(36).substring(7).toUpperCase()}...</span>
                            <span>{new Date().toISOString()}</span>
                        </div>
                    </div>
                </div>

                <div className="p-10 rounded-[3rem] bg-gradient-to-br from-[#ff00ff]/10 to-transparent border border-[#ff00ff]/20 flex flex-col justify-between space-y-8 h-full">
                    <div className="space-y-4">
                        <h3 className="text-xl font-syncopate font-black italic uppercase italic leading-tight">Identity Load</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed">
                            Capacity threshold for April 4th traffic surge.
                        </p>
                    </div>
                    <div className="flex flex-col items-center justify-center flex-1">
                        <div className="text-6xl font-syncopate font-black italic text-[#ff00ff] drop-shadow-[0_0_20px_#ff00ff88]">
                            {data.totalUsers}
                        </div>
                        <p className="text-[8px] font-black uppercase tracking-[.4em] text-white/20 mt-4">Active Profiles</p>
                    </div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all font-syncopate"
                    >
                        Sync Pulse
                    </button>
                </div>
            </div>
        </div>
    </main>
  );
}
