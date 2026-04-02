'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  RefreshCw, 
  ArrowRight, 
  UserCircle2, 
  Plus, 
  Minus,
  Database,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 🛰️ SOVEREIGN RECON CENTER: USER MANAGEMENT (ADMIN)
 * High-Velocity view of all profile nodes and their treasury balances.
 * Built for 100% oversight and manual reconciliation.
 */
export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [adjustValue, setAdjustValue] = useState(1000);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchUsers = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (e) {
            console.error('[Admin] Recon failed:', e);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAdjustCredits = async (userId: string, amount: number) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, amount, action: 'adjust_credits' })
            });
            const data = await res.json();
            if (data.success) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, credit_balance: data.newBalance } : u));
                if (selectedUser?.id === userId) {
                   setSelectedUser({ ...selectedUser, credit_balance: data.newBalance });
                }
            }
        } catch (e) {
            console.error('[Admin] Adjustment failed:', e);
        }
    };

    const filteredUsers = users.filter(u => 
        (u.nickname || u.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.id || '').toLowerCase().includes(search.toLowerCase())
    );

    const totalCreditsInCirculation = users.reduce((acc, u) => acc + (u.credit_balance || 0), 0);
    const averageBalance = users.length > 0 ? Math.floor(totalCreditsInCirculation / users.length) : 0;

    return (
        <div className="min-h-screen bg-black text-white font-outfit p-8 md:p-12 selection:bg-[#ff00ff]/30 selection:text-white">
            
            {/* 🛰️ HEADER RECON */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 max-w-7xl mx-auto">
                <div className="space-y-4">
                    <Link href="/admin" className="flex items-center gap-2 text-[#00f0ff] uppercase text-[10px] font-black tracking-widest hover:translate-x-[-4px] transition-transform">
                        <ArrowLeft size={12} /> {('Back to Vitals').toUpperCase()}
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-[#ff00ff]/10 border border-[#ff00ff]/30 flex items-center justify-center text-[#ff00ff] shadow-[0_0_50px_rgba(255,0,255,0.1)]">
                           <Users size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-syncopate font-black italic tracking-tighter uppercase leading-none">RECON CENTER</h1>
                            <p className="text-[#ff00ff] text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic shadow-[0_0_15px_#ff00ff66]">Profile Node Audit Console</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <StatCard label="Total Nodes" value={users.length} icon={Database} color="#00f0ff" />
                    <StatCard label="Total Credits" value={totalCreditsInCirculation.toLocaleString()} icon={Zap} color="#ffea00" />
                    <StatCard label="Avg Balance" value={averageBalance.toLocaleString()} icon={TrendingUp} color="#ff00ff" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                
                {/* 🛰️ USER LIST BLADE */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 group hover:border-[#00f0ff]/30 transition-all shadow-2xl backdrop-blur-xl">
                        <Search className="text-white/20 group-focus-within:text-[#00f0ff] transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY USERKEY OR NICKNAME..."
                            className="bg-transparent border-none outline-none flex-1 text-[11px] font-black uppercase tracking-widest text-white placeholder-white/10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button 
                            onClick={fetchUsers}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center bg-black/40 border border-white/5 hover:bg-white hover:text-black transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px] overflow-y-auto no-scrollbar pb-32 pr-2">
                        <AnimatePresence mode="popLayout">
                            {filteredUsers.map((u, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={u.id}
                                    onClick={() => setSelectedUser(u)}
                                    className={`p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:border-white/20 cursor-pointer group transition-all relative overflow-hidden ${selectedUser?.id === u.id ? 'bg-white/10 border-[#00f0ff]/40 shadow-[0_0_30px_rgba(0,240,255,0.1)]' : ''}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="shrink-0 w-12 h-12 rounded-2xl overflow-hidden border border-white/10 group-hover:border-white/30 transition-all bg-black">
                                           <img src={u.image || `https://avatar.vercel.sh/${u.id}`} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h3 className="text-[12px] font-black uppercase italic tracking-tighter truncate text-white">{u.nickname || 'Syndicate Member'}</h3>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[7px] font-black text-[#00f0ff] uppercase tracking-widest">
                                                   <Zap size={8} fill="#00f0ff" /> {(u.credit_balance || 0).toLocaleString()}
                                                </div>
                                            </div>
                                            <code className="text-[8px] font-mono text-white/30 tracking-widest uppercase truncate block">KEY: {u.id}</code>
                                            <p className="text-[7px] text-white/20 uppercase font-black tracking-widest mt-2">{u.country || 'EX'} // SYNCED {new Date(u.updated_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight size={14} className="text-[#00f0ff]" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* 🛰️ INSPECTOR BLADE */}
                <div className="lg:col-span-4 sticky top-12 h-fit">
                    <AnimatePresence mode="wait">
                        {selectedUser ? (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-3xl shadow-2xl overflow-hidden relative group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#00f0ff]/5 to-transparent pointer-events-none" />
                                
                                <div className="flex flex-col items-center gap-6 text-center relative z-10">
                                    <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-[#00f0ff]/40 shadow-[0_0_40px_rgba(0,240,255,0.2)]">
                                        <img src={selectedUser.image || `https://avatar.vercel.sh/${selectedUser.id}`} className="w-full h-full object-cover shadow-2xl" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-syncopate font-black italic uppercase leading-none">{selectedUser.nickname || 'Shadow Member'}</h2>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{selectedUser.country || 'Global'} / {selectedUser.flag || '🌐'}</span>
                                            <ShieldCheck size={12} className="text-[#00f0ff]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-black/40 border border-white/5 space-y-4 relative z-10">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[8px] font-black uppercase text-white/20 tracking-[0.3em] font-syncopate italic">USERKEY ID:</span>
                                        <div className="flex items-center justify-between gap-2 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-pointer" onClick={() => navigator.clipboard.writeText(selectedUser.id)}>
                                            <code className="text-[10px] font-mono text-white/60 truncate tracking-wider">{selectedUser.id}</code>
                                            <div className="shrink-0 text-[#00f0ff] opacity-40 group-hover:opacity-100 transition-opacity text-[8px] font-black">COPY</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[8px] font-black uppercase text-[#ffea00] tracking-[0.3em] font-syncopate italic">TREASURY BALANCE:</span>
                                        <div className="p-4 bg-[#ffea00]/5 rounded-xl border border-[#ffea00]/20 flex items-center justify-between group">
                                            <span className="text-2xl font-syncopate font-black italic text-white leading-none">{(selectedUser.credit_balance || 0).toLocaleString()}</span>
                                            <Zap size={20} className="text-[#ffea00]" />
                                        </div>
                                    </div>
                                </div>

                                {/* 🧪 MANUAL RECON PROTOCOL */}
                                <div className="space-y-4 relative z-10 border-t border-white/5 pt-8">
                                    <div className="flex items-center justify-between">
                                       <h3 className="text-[10px] font-black uppercase text-white/40 tracking-widest italic">Hand-Sync Pulse:</h3>
                                       <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                          <button onClick={() => setAdjustValue(v => Math.max(0, v - 100))} className="p-2 bg-white/5 rounded-lg">-</button>
                                          <span className="w-16 text-center text-white">{adjustValue.toLocaleString()}</span>
                                          <button onClick={() => setAdjustValue(v => v + 100)} className="p-2 bg-white/5 rounded-lg">+</button>
                                       </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleAdjustCredits(selectedUser.id, -adjustValue)}
                                            className="flex-1 py-3 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 hover:border-red-500/40 transition-all group active:scale-95"
                                        >
                                            <Minus size={14} className="text-red-500" /> DEDUCT
                                        </button>
                                        <button 
                                            onClick={() => handleAdjustCredits(selectedUser.id, adjustValue)}
                                            className="flex-1 py-3 h-12 bg-[#00f0ff] rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-black hover:bg-white transition-all group active:scale-95 shadow-[0_0_25px_rgba(0,240,255,0.4)]"
                                        >
                                            <Plus size={14} /> CREDIT
                                        </button>
                                    </div>
                                    <p className="text-[7px] text-white/20 italic text-center font-black uppercase tracking-widest">Manual injection protocols record a permanent log in the treasury.</p>
                                </div>

                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] opacity-40">
                                <UserCircle2 size={64} className="mb-6 grayscale" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 italic">Select a Node to Recon:</h3>
                                <p className="text-[8px] text-white/40 leading-relaxed uppercase tracking-widest">Select an identity from the grid to access high-velocity credit control and identity synthesis.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

            {/* 🛰️ SCANLINE OVERLAY */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="px-6 py-4 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center gap-4 group hover:bg-white/10 transition-all">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-black shadow-lg animate-pulse" style={{ background: color }}>
                <Icon size={20} />
            </div>
            <div>
                <span className="text-[8px] font-black uppercase text-white/20 tracking-[0.1em]">{label}</span>
                <p className="text-[12px] font-syncopate font-black italic uppercase leading-none">{value}</p>
            </div>
        </div>
    );
}
