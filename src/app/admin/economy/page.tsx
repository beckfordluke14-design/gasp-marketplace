'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/components/providers/UserProvider';
import { format } from 'date-fns';
import { ShieldCheck, Coins, ArrowUpRight, Search, Filter, Loader2, CreditCard, QrCode } from 'lucide-react';

export default function AdminEconomyPage() {
    const { profile, authenticated } = useUser();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [manualPrice, setManualPrice] = useState('79.22');
    const [isLocked, setIsLocked] = useState(true);

    useEffect(() => {
        if (authenticated && profile?.is_admin) {
            fetchTransactions();
        }
    }, [authenticated, profile]);

    const handlePriceLock = async () => {
        try {
            await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'SOL_PRICE_OVERRIDE', value: manualPrice, active: isLocked })
            });
            alert('MARKET SNAPSHOT LOCKED: ' + manualPrice);
        } catch (e) {
            alert('Lock Failed');
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/admin/transactions');
            const data = await res.json();
            if (data.success) {
                setTransactions(data.transactions);
            }
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!profile?.is_admin) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-10 text-center">
                <div className="space-y-6">
                    <ShieldCheck size={64} className="text-red-500 mx-auto animate-pulse" />
                    <h1 className="text-4xl font-syncopate font-black text-white italic">ACCESS DENIED</h1>
                    <p className="text-white/40 font-black uppercase tracking-widest italic">Sovereign Admin Clearance Required</p>
                </div>
            </div>
        );
    }

    const filtered = transactions.filter(tx => 
        tx.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.meta?.signature?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.meta?.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black text-white font-outfit p-10">
            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* 📟 HEADER */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-[#00f0ff] rounded-full animate-pulse shadow-[0_0_10px_#00f0ff]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#00f0ff] italic">Sovereign Financial Hub</span>
                        </div>
                        <h1 className="text-5xl font-syncopate font-black uppercase italic tracking-tighter">ECONOMY LOGS</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                            <input 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search Reference / Signature / User ID..."
                                className="pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl w-80 font-black uppercase text-[11px] tracking-widest outline-none focus:border-[#00f0ff]/40 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* 📊 SUMMARY */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-2">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Total Volume</span>
                        <div className="text-4xl font-syncopate font-black italic text-[#00f0ff]">${transactions.reduce((acc, tx) => acc + (tx.amount_usd || 0), 0).toFixed(2)}</div>
                    </div>
                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-2">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Total Ingress</span>
                        <div className="text-4xl font-syncopate font-black italic text-white">{transactions.length} <span className="text-sm font-black text-white/20">TX</span></div>
                    </div>
                </div>

                {/* 📜 LOGS TABLE */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden">
                    {loading ? (
                        <div className="p-40 flex flex-col items-center justify-center gap-6">
                            <Loader2 className="animate-spin text-[#00f0ff]" size={48} />
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] italic">Decrypting Ledgers...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase text-white/40 tracking-widest italic border-b border-white/5">Timestamp</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase text-white/40 tracking-widest italic border-b border-white/5">Method</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase text-white/40 tracking-widest italic border-b border-white/5">Amount</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase text-white/40 tracking-widest italic border-b border-b border-white/5">Reference / Metadata</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase text-white/40 tracking-widest italic border-b border-white/5 text-right">User ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((tx, idx) => (
                                        <tr key={tx.id || idx} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-8 border-b border-white/5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[11px] font-black text-white font-syncopate italic leading-none">{format(new Date(tx.created_at), 'HH:mm:ss')}</span>
                                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{format(new Date(tx.created_at), 'MMM dd, yyyy')}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 border-b border-white/5">
                                                <div className="flex items-center gap-3">
                                                    {tx.provider === 'helio' ? <QrCode size={16} className="text-[#00f0ff]" /> : <CreditCard size={16} className="text-[#ff00ff]" />}
                                                    <span className={`text-[10px] font-black uppercase tracking-widest italic ${tx.provider === 'helio' ? 'text-[#00f0ff]' : 'text-[#ff00ff]'}`}>{tx.provider === 'helio' ? 'P2P Sync' : 'Stripe'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 border-b border-white/5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xl font-syncopate font-black italic text-white leading-none">${(tx.amount_usd || 0).toFixed(2)}</span>
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{(tx.credits_issued || 0).toLocaleString()} Credits</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 border-b border-white/5 max-w-sm">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[8px] font-black text-white/20 uppercase">Reference Key</span>
                                                        <span className="text-[10px] font-mono text-white/60 break-all">{tx.meta?.reference || 'N/A'}</span>
                                                    </div>
                                                    {tx.meta?.signature && (
                                                        <a 
                                                            href={`https://solscan.io/tx/${tx.meta.signature}`} 
                                                            target="_blank"
                                                            className="flex items-center gap-1.5 text-[8px] font-black text-[#00f0ff] uppercase hover:underline"
                                                        >
                                                            View On Explorer <ArrowUpRight size={10} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 border-b border-white/5 text-right">
                                                <span className="text-[10px] font-mono text-white/30">{tx.user_id}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
