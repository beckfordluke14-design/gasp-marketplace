'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ShieldCheck, CreditCard, QrCode, ArrowRight, CheckCircle2, AlertCircle, Copy, Check, Loader2 } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';
import { useUser } from '../providers/UserProvider';

interface TopUpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPackage?: string;
}

/**
 * ⛽ SOVEREIGN REVENUE TERMINAL v9.5 // UNIFIED SESSION
 * Now featuring "Managed Sessions" to ensure 100% pre-fill & revenue lock.
 */
export default function TopUpDrawer({ isOpen, onClose, initialPackage }: TopUpDrawerProps) {
    const { profile } = useUser();
    const [selectedPkgId, setSelectedPkgId] = useState(initialPackage || CREDIT_PACKAGES[0].id);
    const [copied, setCopied] = useState(false);
    const [view, setView] = useState<'options' | 'p2p' | 'success'>('options');
    const [userId, setUserId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';
    const vaultAddress = 'DGQVNRTWEv1HEwP6Wtcm1LEUPgZKsW9JfwVpEDjPcEkS';

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setUserId(localStorage.getItem('gasp_guest_id') || 'anon');
        }
    }, []);

    // 🧬 UNIFIED ECONOMY MATRIX
    const packages = CREDIT_PACKAGES.slice(0, 3).map((p, idx) => ({
        id: p.id,
        credits: p.credits,
        price: p.priceUsd,
        label: isSpanish 
               ? (idx === 0 ? 'Iniciación' : idx === 1 ? 'Operativo' : 'Soberano')
               : (idx === 0 ? 'Initiation' : idx === 1 ? 'Operative' : 'Sovereign'),
        popular: p.isPopular || idx === 1,
        color: idx === 0 ? '#00f0ff' : idx === 1 ? '#ff00ff' : '#ffea00'
    }));

    const selectedPkg = packages.find(p => p.id === selectedPkgId) || packages[0];

    /** 🛡️ REVENUE PROTOCOL: Create Managed Session */
    const handleStripeCheckout = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/economy/stripe/onramp/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageId: selectedPkgId, userId }),
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
                className="fixed inset-0 z-[20000] flex items-center justify-center p-4"
            >
                {/* BACKDROP */}
                <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" onClick={onClose} />

                {/* MODAL HUB */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col font-outfit"
                >
                    {/* BORDER GLOW */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-40" />

                    {/* HEADER */}
                    <div className="p-8 pb-4 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00f0ff] italic">
                                {isSpanish ? 'Protocolo de Ingreso' : 'Ingress Protocol'}
                            </span>
                            <h2 className="text-2xl font-black uppercase italic text-white leading-none">
                                {isSpanish ? 'Centro de Recarga' : 'Top Up Hub'}
                            </h2>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 p-8 pt-4 overflow-y-auto no-scrollbar">
                        {view === 'options' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* PACKAGE SELECTOR */}
                                <div className="grid grid-cols-1 gap-3">
                                    {packages.map((pkg) => (
                                        <button 
                                            key={pkg.id}
                                            onClick={() => setSelectedPkgId(pkg.id)}
                                            className={`relative p-5 rounded-3xl border transition-all flex items-center justify-between text-left group overflow-hidden ${selectedPkgId === pkg.id ? 'bg-white/5 border-white/20' : 'bg-black/40 border-white/5 hover:border-white/10'}`}
                                        >
                                            {selectedPkgId === pkg.id && (
                                                <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: pkg.color }} />
                                            )}
                                            <div className="flex flex-col gap-1 relative z-10">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-white/30">{pkg.label}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl font-black text-white italic">{pkg.credits.toLocaleString()}</span>
                                                    <span className="text-[10px] font-black text-white/40 uppercase">BP</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end relative z-10">
                                                <span className="text-xl font-black text-white italic">${pkg.price}</span>
                                                {pkg.popular && (
                                                    <span className="text-[6px] font-black px-2 py-0.5 bg-[#ff00ff] text-white rounded-full uppercase tracking-tighter mt-1 animate-pulse">
                                                        {isSpanish ? 'Más Vendido' : 'Best Value'}
                                                    </span>
                                                )}
                                            </div>
                                            {/* GRADIENT HOVER EFFECTS */}
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-tr from-transparent to-white/10" />
                                        </button>
                                    ))}
                                </div>

                                {/* CARD CTA (STRIPE LINK) */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="h-px flex-1 bg-white/5" />
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">{isSpanish ? 'Liquidación Instantánea' : 'Instant Settlement'}</span>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>
                                    
                                    <button 
                                        onClick={handleStripeCheckout}
                                        disabled={isLoading}
                                        className="w-full h-16 rounded-[2rem] bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3 group border-none disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                                        {isSpanish ? 'COMPRA CON TARJETA' : 'BUY WITH CARD'}
                                        {!isLoading && <ArrowRight size={16} className="opacity-40 group-hover:translate-x-1 transition-transform" />}
                                    </button>
                                    <div className="flex justify-center gap-6 opacity-30">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3 w-auto grayscale brightness-200" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-5 w-auto grayscale brightness-200" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-3 w-auto grayscale brightness-200" />
                                    </div>
                                </div>

                                {/* P2P TRIGGER */}
                                <button 
                                    onClick={() => setView('p2p')}
                                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-center gap-3 group"
                                >
                                    <QrCode size={16} className="text-white/40 group-hover:text-white transition-colors" />
                                    <span className="text-[9px] font-black text-white/40 group-hover:text-white uppercase tracking-widest">{isSpanish ? 'Transferencia Directa (P2P)' : 'Direct Transfer (P2P)'}</span>
                                </button>
                            </div>
                        )}

                        {view === 'p2p' && (
                            <div className="space-y-8 animate-in fade-in zoom-in duration-500 text-center">
                                {/* P2P INSTRUCTIONS */}
                                <div className="space-y-3">
                                    <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                                        <QrCode size={32} className="text-[#00f0ff]" />
                                    </div>
                                    <h3 className="text-xl font-black uppercase italic text-white">{isSpanish ? 'Liquidación P2P' : 'P2P Settlement'}</h3>
                                    <p className="text-xs text-white/40 leading-relaxed max-w-xs mx-auto">
                                        {isSpanish 
                                            ? 'Escanea y envía USDC (Solana) para una recarga anónima instantánea.' 
                                            : 'Scan and send USDC (Solana) for instant anonymous top-up.'}
                                    </p>
                                </div>

                                {/* QR CODE WIZARD */}
                                <div className="relative p-6 bg-white rounded-[2.5rem] w-64 h-64 mx-auto shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=solana:${vaultAddress}?amount=${selectedPkg.price}%26label=GASP%20Archive`} 
                                        alt="QR Protocol"
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 border-[12px] border-white rounded-[2.5rem]" />
                                </div>

                                {/* ADDRESS PROTOCOL */}
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-black border border-white/5 flex items-center justify-between gap-4 group">
                                        <code className="text-[10px] text-zinc-500 font-mono truncate">{vaultAddress}</code>
                                        <button 
                                            onClick={handleCopy}
                                            className="shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"
                                        >
                                            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>

                                    {/* 3-STEP GUIDE */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { step: 1, label: isSpanish ? 'Escanea' : 'Scan' },
                                            { step: 2, label: isSpanish ? 'Envía' : 'Send' },
                                            { step: 3, label: isSpanish ? 'Recibe' : 'Sync' }
                                        ].map(s => (
                                            <div key={s.step} className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                                                <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">{isSpanish ? 'PASO' : 'STEP'} {s.step}</span>
                                                <span className="text-[9px] font-black text-white/80 uppercase tracking-tighter">{s.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={() => setView('options')} className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff] hover:underline decoration-2 underline-offset-8">
                                    {isSpanish ? 'Volver al Inicio' : 'Return to Gate'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* STATUS FOOTER */}
                    <div className="p-8 pt-0 flex flex-col gap-4">
                        <div className="flex items-center gap-4 px-6 py-4 bg-white/5 rounded-3xl border border-white/5">
                            <ShieldCheck size={16} className="text-white/20" />
                            <p className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em] leading-relaxed italic">
                                {isSpanish 
                                    ? 'ADVERTENCIA: TODAS LAS TRANSACCIONES ESTÁN LIGADAS A LA IDENTIDAD DEL NODO DE ORIGEN. SIN REEMBOLSOS.' 
                                    : 'WARNING: ALL TRANSACTIONS TIED TO ORIGIN NODE IDENTITY. NO REFUNDS.'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
