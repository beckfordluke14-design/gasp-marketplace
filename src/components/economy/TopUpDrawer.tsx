'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ShieldCheck, CreditCard, QrCode, ArrowRight, CheckCircle2, AlertCircle, Copy, Check, Loader2 } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';
import { useUser } from '../providers/UserProvider';

interface TopUpDrawerProps {
  isOpen?: boolean;
  onClose: () => void;
  initialPackage?: string;
  userId?: string;
}

/**
 * ⛽ SOVEREIGN REVENUE TERMINAL v10.0 // STRATEGIC REVENUE LOCK
 * Restoration of High-Tier Packages: $99.99, $249.99, $999.99.
 * Institutional Mode: Custom inputs up to $30,000 for elite nodes.
 */
export default function TopUpDrawer({ isOpen = true, onClose, initialPackage, userId: propUserId }: TopUpDrawerProps) {
    const { profile } = useUser();
    const [selectedPkgId, setSelectedPkgId] = useState(initialPackage || CREDIT_PACKAGES[0].id);
    const [copied, setCopied] = useState(false);
    const [view, setView] = useState<'options' | 'p2p' | 'success'>('options');
    const [userId, setUserId] = useState(propUserId || '');
    const [isLoading, setIsLoading] = useState(false);
    
    // 🧬 CUSTOM INSTITUTIONAL STATE
    const [customAmount, setCustomAmount] = useState<string>('5000');
    const [isCustom, setIsCustom] = useState(false);

    const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';
    const vaultAddress = 'DGQVNRTWEv1HEwP6Wtcm1LEUPgZKsW9JfwVpEDjPcEkS';

    useEffect(() => {
        if (!userId && typeof window !== 'undefined') {
            setUserId(localStorage.getItem('gasp_guest_id') || 'anon');
        }
    }, [userId]);

    // 🧬 SOVEREIGN ECONOMY MATRIX: Restoration of Whale + Master Tiers
    const packages = CREDIT_PACKAGES.map((p, idx) => {
        let label = p.label;
        let color = '#00f0ff';
        if (p.priceUsd >= 999) { color = '#ff00ff'; label = isSpanish ? 'Maestro' : 'Master'; }
        else if (p.priceUsd >= 99) { color = '#ffea00'; label = isSpanish ? 'Ballena' : 'Whale'; }
        
        return {
            id: p.id,
            credits: p.credits,
            price: p.priceUsd,
            label: label,
            popular: p.isPopular || idx === 2,
            color: color
        };
    });

    const selectedPkg = packages.find(p => p.id === selectedPkgId) || packages[0];

    /** 🛡️ REVENUE PROTOCOL: Create Managed Session */
    const handleStripeCheckout = async () => {
        setIsLoading(true);
        try {
            const body = isCustom 
                ? { amountUsd: parseFloat(customAmount), userId: userId || propUserId, isCustom: true }
                : { packageId: selectedPkgId, userId: userId || propUserId };

            const res = await fetch('/api/economy/stripe/onramp/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            } else {
                throw new Error(data.error || 'Fault');
            }
        } catch (err) {
            console.error('[TopUp] Stripe session failed:', err);
            alert('Secure checkout unavailable. Use P2P rail.');
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(vaultAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[20000] flex items-center justify-center p-4 selection:bg-[#00f0ff]/30"
            >
                <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={onClose} />

                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 30 }}
                    className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[3.5rem] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.9)] flex flex-col font-outfit max-h-[90vh]"
                >
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-60 shrink-0" />

                    <div className="p-10 pb-6 flex items-center justify-between shrink-0">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#00f0ff] italic">
                                {isSpanish ? 'Protocolo de Ingreso' : 'REVENUE INGRESS PROTOCOL'}
                            </span>
                            <h2 className="text-3xl font-syncopate font-black uppercase italic text-white leading-none tracking-tighter">
                                {isSpanish ? 'Centro de Recarga' : 'TOP UP HUB'}
                            </h2>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all hover:bg-white/10">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 p-10 pt-4 overflow-y-auto no-scrollbar pb-12">
                        {view === 'options' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                
                                {/* 🧪 CUSTOM INSTITUTIONAL INPUT */}
                                <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${isCustom ? 'bg-[#00f0ff]/5 border-[#00f0ff]/40 shadow-[0_0_50px_rgba(0,240,255,0.1)] scale-[1.02]' : 'bg-white/[0.02] border-white/5 opacity-40 hover:opacity-100'}`}>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${isCustom ? 'bg-[#00f0ff] animate-pulse' : 'bg-white/20'}`} />
                                            <span className="text-[10px] font-black uppercase text-[#00f0ff] tracking-widest italic">{isSpanish ? 'RECARGA PERSONALIZADA' : 'INSTITUTIONAL CUSTOM MODE'}</span>
                                        </div>
                                        <button 
                                          onClick={() => setIsCustom(!isCustom)}
                                          className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${isCustom ? 'bg-[#00f0ff] text-black shadow-[0_0_20px_#00f0ff]' : 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20'}`}
                                        >
                                          {isCustom ? (isSpanish ? 'ACTIVO' : 'ACTIVE') : (isSpanish ? 'ACTIVAR' : 'ACTIVATE')}
                                        </button>
                                    </div>
                                    <div className="relative flex items-center gap-8">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mt-2 bg-black/60 border border-white/10 rounded-[1.5rem] p-5 ring-1 ring-white/5">
                                                <span className="text-3xl font-black text-[#00f0ff] opacity-50">$</span>
                                                <input 
                                                  disabled={!isCustom}
                                                  type="number" 
                                                  placeholder="0.00"
                                                  value={customAmount}
                                                  onChange={(e) => setCustomAmount(Math.min(30000, parseFloat(e.target.value) || 0).toString())}
                                                  className="bg-transparent border-none outline-none text-3xl font-syncopate font-black italic text-white w-full placeholder:text-white/5"
                                                />
                                            </div>
                                            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mt-3 ml-2 italic">{isSpanish ? 'Monto Máximo de Liquidación: $30,000.00' : 'Maximum Settlement Ceiling: $30,000.00'}</p>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0 py-2">
                                            <span className="text-[16px] font-syncopate font-black text-white leading-none">{(parseFloat(customAmount) * 1000).toLocaleString()}</span>
                                            <span className="text-[8px] font-black text-[#00f0ff] uppercase tracking-widest mt-1">CREDITS</span>
                                        </div>
                                    </div>
                                </div>

                                {/* PACKAGE SELECTOR GRID */}
                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-700 ${isCustom ? 'opacity-10 pointer-events-none grayscale' : ''}`}>
                                    {packages.map((pkg) => (
                                        <button 
                                            key={pkg.id}
                                            onClick={() => setSelectedPkgId(pkg.id)}
                                            className={`relative p-6 rounded-[2rem] border transition-all duration-300 flex items-center justify-between text-left group overflow-hidden ${selectedPkgId === pkg.id ? 'bg-white/5 border-white/30 shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] scale-[1.02]' : 'bg-black/40 border-white/5 hover:border-white/10 hover:translate-y-[-2px]'}`}
                                        >
                                            {selectedPkgId === pkg.id && (
                                                <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ backgroundColor: pkg.color }} />
                                            )}
                                            <div className="flex flex-col gap-1 relative z-10">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{pkg.label}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-syncopate font-black text-white italic">{pkg.credits > 100000 ? (pkg.credits/1000).toFixed(0) + 'K' : pkg.credits.toLocaleString()}</span>
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter mt-1">CR</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end relative z-10">
                                                <span className="text-2xl font-black text-white italic tracking-tighter">${pkg.price.toFixed(0)}</span>
                                                {pkg.popular && (
                                                    <div className="flex items-center gap-1.5 mt-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#ff00ff] animate-pulse" />
                                                        <span className="text-[8px] font-black text-[#ff00ff] uppercase tracking-[0.2em]">MAX VALUE</span>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* CARD CTA */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between gap-6">
                                        <div className="h-px flex-1 bg-white/10" />
                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] italic">{isSpanish ? 'Liquidación Instantánea' : 'INSTANT SETTLEMENT'}</span>
                                        <div className="h-px flex-1 bg-white/10" />
                                    </div>
                                    
                                    <button 
                                        onClick={handleStripeCheckout}
                                        disabled={isLoading}
                                        className="w-full h-24 rounded-[2.5rem] bg-white text-black font-black uppercase text-[14px] tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_80px_rgba(255,255,255,0.15)] flex items-center justify-center gap-6 group border-none disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 size={32} className="animate-spin text-black" /> : <CreditCard size={32} fill="black" />}
                                        <div className="flex flex-col items-start leading-none gap-2">
                                            <span className="font-syncopate italic">{isSpanish ? 'INICIAR COMPRA' : 'INITIATE PURCHASE'}</span>
                                            <span className="text-[10px] opacity-40 font-bold tracking-widest">{isSpanish ? 'Apple Pay / Google Pay / Tarjeta' : 'Apple Pay / Google Pay / Card Access'}</span>
                                        </div>
                                        {!isLoading && <ArrowRight size={24} className="opacity-40 group-hover:translate-x-3 transition-transform" />}
                                    </button>
                                </div>

                                {/* P2P TRIGGER */}
                                <button 
                                    onClick={() => setView('p2p')}
                                    className="w-full py-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-[#00f0ff]/40 transition-all flex items-center justify-center gap-6 group shadow-2xl"
                                >
                                    <div className="w-14 h-14 rounded-3xl bg-white/5 flex items-center justify-center group-hover:bg-[#00f0ff]/10 transition-all">
                                       <QrCode size={28} className="text-[#00f0ff]" />
                                    </div>
                                    <div className="flex flex-col items-start leading-none gap-2">
                                        <span className="text-[14px] font-black text-white group-hover:text-[#00f0ff] uppercase tracking-widest transition-colors font-syncopate italic">{isSpanish ? 'TRANSFERENCIA ILIMITADA (P2P)' : 'UNLIMITED P2P TRANSFER'}</span>
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] italic leading-none">{isSpanish ? 'Liquidación Sin Techo // Solana USDC' : 'ZERO-CEILING SETTLEMENT // SOLANA USDC'}</span>
                                    </div>
                                </button>
                            </div>
                        )}

                        {view === 'p2p' && (
                            <div className="space-y-10 animate-in fade-in zoom-in duration-700 text-center py-4">
                                <div className="space-y-4">
                                    <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(0,240,255,0.1)]">
                                        <QrCode size={40} className="text-[#00f0ff]" />
                                    </div>
                                    <h3 className="text-2xl font-syncopate font-black uppercase italic text-white tracking-tighter">{isSpanish ? 'LIQUIDACIÓN P2P' : 'P2P SETTLEMENT'}</h3>
                                    <p className="text-sm text-white/40 leading-relaxed max-w-sm mx-auto font-medium">
                                        {isSpanish 
                                            ? 'Envía USDC a la dirección de la bóveda para una recarga anónima instantánea.' 
                                            : 'Send USDC to the vault address for instant anonymous top-up. Unlimited settlement rail.'}
                                    </p>
                                </div>

                                <div className="relative p-8 bg-white rounded-[3rem] w-72 h-72 mx-auto shadow-[0_0_80px_rgba(255,255,255,0.15)] ring-4 ring-white/10">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=solana:${vaultAddress}?amount=${isCustom ? customAmount : selectedPkg.price}%26label=GASP%20Archive`} 
                                        alt="QR Protocol"
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 border-[15px] border-white rounded-[3rem]" />
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 rounded-[1.5rem] bg-black border border-white/10 flex items-center justify-between gap-6 group hover:border-[#00f0ff]/40 transition-all ring-1 ring-white/5">
                                        <code className="text-[11px] text-zinc-500 font-mono break-all">{vaultAddress}</code>
                                        <button 
                                            onClick={handleCopy}
                                            className="shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90 hover:bg-white/10"
                                        >
                                            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { step: 1, label: isSpanish ? 'Escanea' : 'SCAN' },
                                            { step: 2, label: isSpanish ? 'Envía' : 'SEND' },
                                            { step: 3, label: isSpanish ? 'Sync' : 'SYNC' }
                                        ].map(s => (
                                            <div key={s.step} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-2">
                                                <span className="text-[8px] font-black text-[#00f0ff] uppercase tracking-widest">{isSpanish ? 'PASO' : 'PROTOCOL'} 0{s.step}</span>
                                                <span className="text-[11px] font-black text-white/90 uppercase tracking-tighter font-syncopate italic">{s.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={() => setView('options')} className="text-[12px] font-black uppercase tracking-[0.3em] text-[#00f0ff] hover:text-white transition-colors decoration-2 underline-offset-8 italic">
                                    {isSpanish ? 'Volver al Inicio' : 'RETURN TO GATE'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-10 pt-0 flex flex-col gap-6 shrink-0">
                        <div className="flex items-center gap-5 px-8 py-5 bg-white/5 rounded-3xl border border-white/5 ring-1 ring-white/5">
                            <ShieldCheck size={20} className="text-[#00f0ff] opacity-40" />
                            <p className="text-[9px] font-black uppercase text-white/30 tracking-[0.3em] leading-relaxed italic">
                                {isSpanish 
                                    ? 'ADVERTENCIA DE SEGURIDAD: TODAS LAS TRANSACCIONES ESTÁN VINCULADAS AL NODO DE ORIGEN. SIN REEMBOLSOS.' 
                                    : 'SECURITY PROTOCOL: ALL TRANSACTIONS TIED TO ORIGIN NODE IDENTITY. FINAL SETTLEMENT. NO REFUNDS.'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
