'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fuel, Zap, Flame, ShieldCheck, Search, Users, ChevronRight, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * ⛽ SYNDICATE ADMIN: Credit Command Center
 * Purpose: Manual credit dispatch, user grant management, and protocol testing.
 */
export default function AdminCredits() {
    const [userId, setUserId] = useState('');
    const [amount, setAmount] = useState('');
    const [triggerBurn, setTriggerBurn] = useState(false);
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // 📡 DISPATCH CREDITS (GOD MODE)
    const handleDispatch = async () => {
        if (!userId || !amount) {
            setStatus({ error: 'Missing Operative Target or Load' });
            return;
        }

        setLoading(true);
        setStatus(null);
        
        try {
            const adminKey = localStorage.getItem('admin_gasp_key');
            const res = await fetch('/api/admin/credits', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey || ''
                },
                body: JSON.stringify({ userId, credits: amount, triggerBurn })
            });
            const data = await res.json();
            if (data.success) {
                setStatus({ success: data.msg });
                setAmount(''); // Reset
            } else {
                setStatus({ error: data.error });
            }
        } catch (e) {
            setStatus({ error: 'Protocol Node Disconnected' });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 md:p-20 font-outfit uppercase tracking-widest">
            <div className="max-w-4xl mx-auto space-y-12">
                
                {/* 🛡️ ADMIN HEADER */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-white/10">
                    <div className="space-y-4">
                        <Link href="/admin" className="flex items-center gap-2 text-white/40 hover:text-[#ffea00] transition-colors text-[10px] font-black uppercase tracking-widest underline decoration-[#ffea00]/20 mb-4">
                            <ArrowLeft size={12} />
                            Back to Hub
                        </Link>
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={16} className="text-[#ffea00]" />
                            <span className="text-[10px] font-black text-[#ffea00]">Admin Protocol Interface 🛡️</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-syncopate font-black italic tracking-tighter italic">
                            Credit <span className="text-[#00f0ff]">Command</span>
                        </h1>
                        <p className="text-white/20 text-xs font-black italic leading-relaxed max-w-xl">
                            Syndicate Operative Terminal: Manual Grant Logic Active. Use with sovereign caution.
                        </p>
                    </div>
                </div>

                {/* ⛽ DISPATCH TERMINAL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 space-y-8 backdrop-blur-3xl shadow-2xl">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                            <Fuel size={24} className="text-[#00f0ff]" />
                            <h2 className="text-2xl font-syncopate font-black italic tracking-tighter italic uppercase">Manual Dispatch</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30">Target Operative ID</label>
                                <input 
                                    type="text" 
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    placeholder="USER_UUID_ALPHA"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-syncopate font-black focus:border-[#00f0ff] outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30">Credit Load (CR)</label>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="5000"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-syncopate font-black focus:border-[#00f0ff] outline-none transition-all appearance-none"
                                />
                            </div>

                            <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-6 group cursor-pointer" 
                                 onClick={() => setTriggerBurn(!triggerBurn)}
                            >
                                <div className="space-y-1 pr-6">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle size={12} className={triggerBurn ? 'text-[#ff9d00]' : 'text-white/20'} />
                                        <p className={`text-[10px] font-black uppercase transition-colors ${triggerBurn ? 'text-[#ff9d00]' : 'text-white/60'}`}>
                                            Protocol Impact Toggle
                                        </p>
                                    </div>
                                    <p className="text-[8px] text-white/20 italic uppercase tracking-tighter">
                                        {triggerBurn ? '🔥 Warning: This will permanently update Global Burn & Points stats.' : '🛡️ Safe Mode: This will only grant credits (Stats remain accurate).'}
                                    </p>
                                </div>
                                <div className={`w-14 h-7 rounded-full border border-white/10 relative transition-colors ${triggerBurn ? 'bg-[#ff9d00]/20 border-[#ff9d00]/40' : 'bg-transparent'}`}>
                                    <motion.div 
                                        animate={{ x: triggerBurn ? 28 : 4 }}
                                        className={`absolute top-1 w-5 h-5 rounded-full ${triggerBurn ? 'bg-[#ff9d00]' : 'bg-white/20'}`}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleDispatch}
                                disabled={loading}
                                className="w-full py-5 bg-[#00f0ff] text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#00f0ff]/80 transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_50px_rgba(0,240,255,0.2)]"
                            >
                                {loading ? 'Uplink Synchronizing...' : 'Sovereign Grant Verified ►'}
                            </button>

                            {status && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-2xl border text-[10px] font-black uppercase text-center ${status.success ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
                                >
                                    {status.success || status.error}
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* 🧬 INSTRUCTIONS / PROTOCOL CARD */}
                    <div className="space-y-8">
                         <div className="p-12 border border-white/5 rounded-[3rem] bg-gradient-to-br from-white/5 to-transparent space-y-8">
                            <div className="flex items-center gap-4 border-b border-white/5 pb-6 text-[#ffea00]">
                                <Flame size={20} />
                                <h3 className="text-2xl font-syncopate font-black italic tracking-tighter italic uppercase underline">Guidelines</h3>
                            </div>
                            <ul className="space-y-6">
                                {[
                                    { t: 'User ID Retrieval', d: 'Retrieve the Operative ID from your Supabase/Railway Auth logs.' },
                                    { t: 'Atomic Sync', d: 'Grants are synchronized across Wallets, Profiles, and Legacy User tables instantly.' },
                                    { t: 'Manual Match', d: 'If Trigger Burn is active, the $GASPai matching counter will tick up live for all users.' }
                                ].map((item, idx) => (
                                    <li key={idx} className="space-y-2">
                                        <h4 className="text-[10px] font-black tracking-widest text-white/50">{item.t}</h4>
                                        <p className="text-[10px] text-white/20 font-black leading-loose italic">{item.d}</p>
                                    </li>
                                ))}
                            </ul>
                         </div>
                         <div className="p-8 bg-black/60 border border-white/5 rounded-3xl text-center">
                            <p className="text-[9px] text-white/10 uppercase tracking-[0.2em] leading-relaxed italic">
                                Admin Protocol V2.1 // 2026.04.04-Ready
                            </p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
