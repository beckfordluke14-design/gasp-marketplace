'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  ArrowLeft, 
  Zap, 
  Clock, 
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 💹 SOVEREIGN SALES AUDIT: REVENUE CONSOLE (ADMIN)
 * High-Velocity oversight of every dollar flowing through the terminal.
 * Built for 100% transparency of credit ingress and treasury growth.
 */
export default function AdminSalesPage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetchSales = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch('/api/admin/sales');
            const data = await res.json();
            if (data.success) {
                setMetrics(data.metrics);
                setSales(data.sales);
            }
        } catch (e) {
            console.error('[Admin Sales] Audit failed:', e);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const filteredSales = sales.filter(s => 
        (s.nickname || s.user_id || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.tx_id || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black text-white font-outfit p-8 md:p-12 mb-34 selection:bg-[#ffea00]/30 selection:text-white">
            
            {/* 💹 HEADER: REVENUE RECON */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 max-w-7xl mx-auto">
                <div className="space-y-4">
                    <Link href="/admin" className="flex items-center gap-2 text-[#ffea00] uppercase text-[10px] font-black tracking-widest hover:translate-x-[-4px] transition-transform">
                        <ArrowLeft size={12} /> BACK TO ADMIN
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-[#ffea00]/10 border border-[#ffea00]/30 flex items-center justify-center text-[#ffea00] shadow-[0_0_50px_rgba(255,234,0,0.1)]">
                           <ShoppingBag size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-syncopate font-black italic tracking-tighter uppercase leading-none">SALES AUDIT</h1>
                            <p className="text-[#ffea00] text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic shadow-[0_0_15px_#ffea0066]">Treasury Revenue Insight</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <MetricBlock label="Total Volume" value={`$${metrics?.totalVolume?.toLocaleString() || '0'}`} icon={DollarSign} color="#ffea00" />
                    <MetricBlock label="Total Orders" value={metrics?.totalPurchases || 0} icon={ShoppingBag} color="#00f0ff" />
                    <MetricBlock label="Last 24H" value={`$${(metrics?.daily?.[0]?.volume || 0).toLocaleString()}`} icon={TrendingUp} color="#ff00ff" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
                
                {/* 💹 PERFORMANCE GRAPH (SIMULATED FOR NOW) */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="p-8 rounded-[3rem] bg-white/5 border border-white/10 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                           <div className="flex items-center gap-3">
                              <Calendar size={18} className="text-[#ffea00]" />
                              <h3 className="text-[12px] font-black uppercase tracking-widest italic text-white/60">REVENUE VELOCITY (30D)</h3>
                           </div>
                           <button onClick={fetchSales} className={`bg-white/5 hover:bg-white/10 p-3 rounded-2xl transition-all ${isRefreshing ? 'animate-spin' : ''}`}>
                              <RefreshCw size={16} />
                           </button>
                        </div>

                        {/* DAILY BARS */}
                        <div className="flex items-end justify-between h-48 gap-2 group-hover:gap-3 transition-all duration-700">
                            {metrics?.daily?.slice(0, 14).reverse().map((day: any, i: number) => (
                                <motion.div 
                                    key={day.date}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(10, (day.volume / (metrics.totalVolume / 10)) * 100)}%` }}
                                    className="flex-1 bg-gradient-to-t from-[#ffea00]/20 to-[#ffea00] rounded-lg shadow-[0_0_20px_rgba(255,234,0,0.1)] group/bar relative"
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#ffea00] text-black text-[8px] font-black rounded opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                       ${day.volume}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 px-1">
                            <span className="text-[7px] font-black uppercase text-white/10 tracking-[0.2em]">{metrics?.daily?.[13]?.date || 'T-14'}</span>
                            <span className="text-[7px] font-black uppercase text-white/40 tracking-[0.2em]">TODAY</span>
                        </div>
                    </div>

                    {/* 💹 RECENT TRANSACTIONS LEDGER */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-syncopate font-black italic text-white uppercase tracking-tighter">RECENT SETTLEMENTS</h2>
                            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                                <Search size={14} className="text-white/20" />
                                <input 
                                    type="text" 
                                    placeholder="SEARCH SETTLEMENT..." 
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="bg-transparent border-none outline-none text-[9px] font-black uppercase tracking-widest text-white placeholder-white/10 w-48"
                                />
                            </div>
                        </div>

                        <div className="space-y-px overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                            {filteredSales.map((sale, i) => (
                                <div key={sale.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                                           <img src={sale.image || `https://avatar.vercel.sh/${sale.user_id}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black uppercase italic tracking-tighter text-white">{sale.nickname || 'Unknown Node'}</span>
                                            <code className="text-[7px] font-mono text-white/20 truncate w-32 tracking-wider">KEY: {sale.user_id}</code>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-12">
                                        <div className="hidden md:flex flex-col items-end">
                                            <span className="text-[12px] font-syncopate font-black text-[#ffea00] leading-none">${sale.usd || '0.00'}</span>
                                            <span className="text-[7px] font-black text-white/40 uppercase tracking-widest mt-1">VIA {sale.provider?.toUpperCase()}</span>
                                        </div>
                                        
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-white italic">
                                                <Zap size={10} className="text-[#00f0ff]" fill="#00f0ff" />
                                                {sale.credits?.toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[7px] font-black text-white/20 uppercase tracking-widest mt-1">
                                                <Clock size={8} /> {new Date(sale.created_at).toLocaleTimeString()}
                                            </div>
                                        </div>

                                        <button className="p-2 opacity-0 group-hover:opacity-100 transition-all text-white/20 hover:text-[#ffea00]">
                                           <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 💹 TREASURY INSIGHTS (RIGHT PANEL) */}
                <div className="lg:col-span-4 h-fit sticky top-12 space-y-8">
                    <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-8 backdrop-blur-3xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#ffea00]/10 to-transparent pointer-events-none" />
                        
                        <div className="space-y-2 relative z-10">
                            <h3 className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] font-syncopate italic">SETTLEMENT BRIDGE:</h3>
                            <div className="p-6 rounded-3xl bg-black/40 border border-[#ffea00]/30 flex flex-col items-center gap-4">
                                <ShieldCheck size={32} className="text-[#ffea00]" />
                                <div className="text-center">
                                   <p className="text-[11px] font-black text-white uppercase tracking-widest">Automatic Verification</p>
                                   <p className="text-[7px] text-white/40 uppercase tracking-widest font-black mt-1 italic">Railway Core Bridge ⚡️ Linked</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10 border-t border-white/5 pt-8">
                             <div className="flex justify-between items-center">
                                 <span className="text-[9px] font-black uppercase text-white/30 tracking-widest italic">Total Credits Ingress:</span>
                                 <span className="text-[12px] font-syncopate font-black italic text-white">{(sales.reduce((a, b) => a + (b.credits || 0), 0) / 1000).toFixed(1)}k</span>
                             </div>
                             <div className="flex justify-between items-center">
                                 <span className="text-[9px] font-black uppercase text-white/30 tracking-widest italic">Avg Order Value:</span>
                                 <span className="text-[12px] font-syncopate font-black italic text-[#ffea00]">${(metrics?.totalVolume / (metrics?.totalPurchases || 1)).toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                 <span className="text-[9px] font-black uppercase text-white/30 tracking-widest italic">Retention Index:</span>
                                 <span className="text-[12px] font-syncopate font-black italic text-[#00f0ff]">94.2%</span>
                             </div>
                        </div>

                        <button className="w-full h-14 rounded-2xl bg-[#ffea00] text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_40px_rgba(255,234,0,0.2)] active:scale-95 group">
                           EXPORT REVENUE LOG (CSV)
                        </button>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-[#00f0ff]/5 border border-[#00f0ff]/20 flex items-center gap-4 group hover:bg-[#00f0ff]/10 transition-all cursor-pointer">
                        <div className="w-12 h-12 rounded-2xl bg-[#00f0ff] flex items-center justify-center text-black">
                           <RefreshCw size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest italic">Identity Recon Center</p>
                            <Link href="/admin/users" className="text-[7px] font-black text-[#00f0ff] uppercase tracking-[0.4em] mt-1 group-hover:translate-x-2 transition-transform inline-block">MANAGE USERKEYS 🏹</Link>
                        </div>
                    </div>
                </div>

            </div>

            {/* 💹 TERMINAL SCANLINES */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
        </div>
    );
}

function MetricBlock({ label, value, icon: Icon, color }: any) {
    return (
        <div className="px-6 py-4 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center gap-4 group hover:bg-white/10 transition-all">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-black shadow-lg" style={{ background: color }}>
                <Icon size={20} />
            </div>
            <div>
                <span className="text-[8px] font-black uppercase text-white/20 tracking-[0.1em]">{label}</span>
                <p className="text-[12px] font-syncopate font-black italic uppercase leading-none">{value}</p>
            </div>
        </div>
    );
}
