'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Zap, TrendingUp, Users, ShieldCheck, ChevronRight, Activity, ArrowUpRight, BarChart3, Globe, CreditCard } from 'lucide-react';
import Link from 'next/link';

/**
 * 🛰️ SOVEREIGN REVENUE TERMINAL v1.0 [ADMIN]
 * Real-Time Oversight for the $1,000,000 Ingress Runway.
 * Security: Administrative Master Override Required.
 */
export default function AdminSalesPage() {
    const [stats, setStats] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [whales, setWhales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState('syndicate_sovereign_2026_master_override');

    // 🌍 REVENUE SYNC
    const fetchSalesData = async () => {
        try {
            const res = await fetch(`/api/admin/sales?token=${token}`);
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setTransactions(data.transactions);
                setWhales(data.whales);
            }
        } catch (e) {
            console.error('[Revenue Audit] Pulse Failure', e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSalesData();
        const interval = setInterval(fetchSalesData, 30000); // 30s Real-Time Sync
        return () => clearInterval(interval);
    }, [token]);

    const formatCurrency = (val: any) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Zap size={48} className="text-[#00f0ff] animate-pulse" />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white font-outfit p-4 md:p-12 selection:bg-[#00f0ff]/30">
            
            {/* 🛰️ HEADER OVERLAY */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#00f0ff] italic">SOVEREIGN REVENUE TERMINAL // 2026</span>
                    <h1 className="text-4xl md:text-6xl font-syncopate font-black uppercase italic tracking-tighter leading-none">
                        CAPITAL <span className="text-white/20">INGRESS</span>
                    </h1>
                </div>
                <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-3xl">
                    <Activity className="text-[#ffea00] animate-pulse" size={32} />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase text-white/40 tracking-widest leading-none">Status</span>
                        <span className="text-sm font-black uppercase tracking-tighter text-white italic">LIVE AUDIT ACTIVE</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* 📊 CORE STATS MATRIX */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-10 rounded-[3rem] bg-white border border-white/10 text-black shadow-[0_0_100px_rgba(255,255,255,0.1)]">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Gross Revenue</span>
                            <BarChart3 size={24} className="opacity-40" />
                        </div>
                        <h2 className="text-5xl font-syncopate font-black italic tracking-tighter leading-none">{formatCurrency(stats?.grossUsd)}</h2>
                        <div className="mt-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-40">
                            <ArrowUpRight size={14} />
                            REAL-TIME USD SYNCED
                        </div>
                    </motion.div>

                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="p-10 rounded-[3rem] bg-[#00f0ff] border border-[#00f0ff]/20 text-black shadow-[0_0_100px_rgba(0,240,255,0.2)]">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Credits Issued</span>
                            <Zap size={24} className="opacity-40" fill="currentColor" />
                        </div>
                        <h2 className="text-5xl font-syncopate font-black italic tracking-tighter leading-none">{stats?.grossCredits?.toLocaleString()} <span className="text-xl not-italic">CR</span></h2>
                        <div className="mt-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-40">
                             LINKED TO IDENTITY NODES
                        </div>
                    </motion.div>

                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#ffea00]">Transaction Count</span>
                            <Globe size={24} className="text-white/20" />
                        </div>
                        <h2 className="text-5xl font-syncopate font-black italic tracking-tighter leading-none">{stats?.transactionCount}</h2>
                        <div className="mt-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#ffea00] italic">
                            TOTAL REVENUE EVENTS
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    
                    {/* 🔱 WHALE LIST (TOP SPENDERS) */}
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="p-10 rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl space-y-10">
                        <div className="flex items-center justify-between border-b border-white/5 pb-8">
                            <div className="flex items-center gap-4">
                                <Users size={24} className="text-[#00f0ff]" />
                                <h2 className="text-2xl font-syncopate font-black uppercase italic tracking-tighter">THE WHALE LIST</h2>
                            </div>
                            <span className="text-[8px] font-black text-[#00f0ff] uppercase tracking-widest border border-[#00f0ff]/40 px-2 py-1 rounded-md">INSTITUTIONAL NODES</span>
                        </div>
                        <div className="space-y-4">
                            {whales.map((w, i) => (
                                <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between hover:border-[#00f0ff]/40 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-[10px] font-syncopate font-black text-white/40 group-hover:text-[#00f0ff]">#{i+1}</div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black uppercase text-white/80 tracking-widest">USER_{w.user_id?.slice(-8)}</span>
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] italic">{w.purchase_count} Total Events</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-syncopate font-black italic text-[#ffea00] leading-none tracking-tighter">{formatCurrency(w.total_spent_usd)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* 🏹 RECENT TICKER */}
                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="p-10 rounded-[3.5rem] border border-white/10 bg-black space-y-10">
                         <div className="flex items-center justify-between border-b border-white/5 pb-8">
                            <div className="flex items-center gap-4">
                                <Activity size={24} className="text-[#ffea00]" />
                                <h2 className="text-2xl font-syncopate font-black uppercase italic tracking-tighter">LIVE REVENUE TICKER</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#ffea00] animate-pulse" />
                                <span className="text-[8px] font-black text-[#ffea00] uppercase tracking-widest">30s SYNC</span>
                            </div>
                        </div>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                            {transactions.map((t, i) => (
                                <div key={t.id} className="p-6 bg-white/5 rounded-[1.5rem] border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        {t.provider === 'stripe_onramp' ? <CreditCard size={18} className="text-white/40" /> : <Zap size={18} className="text-[#00f0ff]" />}
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-white tracking-[0.2em]">{t.provider?.split('_')[0]}</span>
                                            <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em]">{new Date(t.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-lg font-syncopate font-black italic text-white tracking-tighter">{formatCurrency(t.amount_usd)}</span>
                                        <span className="text-[7px] font-black text-[#00f0ff] uppercase tracking-widest opacity-40">{t.credits.toLocaleString()} CR</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
            
            <div className="max-w-7xl mx-auto mt-20 p-10 bg-white/5 rounded-[3rem] border border-white/5 flex items-center gap-6 justify-center opacity-30 group hover:opacity-100 transition-all">
                <ShieldCheck size={20} className="text-[#00f0ff]" />
                <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">SOVEREIGN AUDIT TERMINAL // ENCRYPTED // MISSION READY</p>
            </div>
        </div>
    );
}
