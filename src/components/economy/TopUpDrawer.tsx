'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ShieldCheck, CreditCard, QrCode, ArrowRight, CheckCircle2, AlertCircle, Copy, Check, Loader2, Coins } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';
import { useUser } from '../providers/UserProvider';
import { Keypair } from '@solana/web3.js';

interface TopUpDrawerProps {
  isOpen?: boolean;
  onClose: () => void;
  initialPackage?: string;
  userId?: string;
}

/**
 * ⛽ SOVEREIGN REVENUE TERMINAL v12.0 // STRATEGIC REVENUE LOCK
 * 100% Automatic Solana Pay Integration (Beginning-to-End).
 * Supports Native SOL + USDC.
 * Unique Reference Tracking for Zero-Hassle Fulfillment.
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

    // 🛰️ SOVEREIGN SYNC STATE (AUTOMATIC)
    const [solPrice, setSolPrice] = useState<number>(0);
    const [p2pAsset, setP2pAsset] = useState<'USDC' | 'SOL'>('USDC');
    const [uniqueRef, setUniqueRef] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [txSignature, setTxSignature] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';
    const vaultAddress = 'DGQVNRTWEv1HEwP6Wtcm1LEUPgZKsW9JfwVpEDjPcEkS';

    useEffect(() => {
        if (!userId && typeof window !== 'undefined') {
            setUserId(localStorage.getItem('gasp_guest_id') || 'anon');
        }
    }, [userId]);

    // 🧬 FETCH SOL PRICE for dynamic SOL payments
    useEffect(() => {
        const fetchPrice = async () => {
           try {
              const res = await fetch('https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112');
              const data = await res.json();
              const price = data.data['So11111111111111111111111111111111111111112']?.price;
              if (price) setSolPrice(parseFloat(price));
           } catch (e) { console.error('Price Fetch Error:', e); }
        };
        fetchPrice();
        const interval = setInterval(fetchPrice, 30000);
        return () => clearInterval(interval);
    }, []);

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
    const targetUsd = isCustom ? parseFloat(customAmount) : selectedPkg.price;
    const targetSol = solPrice > 0 ? (targetUsd / solPrice).toFixed(4) : '0.0000';

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

    /** 🛰️ AUTOMATIC POLLING INGRESS: Beginning-to-End Sync */
    const startPolling = useCallback((reference: string) => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setIsPolling(true);
        
        pollingRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/economy/solana/verify/reference?reference=${reference}&userId=${userId || propUserId}&expectedAmount=${targetUsd}`);
                const data = await res.json();
                if (data.success) {
                    clearInterval(pollingRef.current!);
                    setIsPolling(false);
                    setView('success');
                    window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
                }
            } catch (e) { console.error('Poll Error:', e); }
        }, 3000);
    }, [userId, targetUsd, propUserId]);

    const handleSwitchToP2P = () => {
        // Generate a forensic reference for this specific session
        const ref = Keypair.generate().publicKey.toBase58();
        setUniqueRef(ref);
        setView('p2p');
        startPolling(ref);
    };

    /** 🛰️ SOVEREIGN SYNC: Manual Fallback Fallback */
    const handleSolanaSync = async () => {
        if (!txSignature || isVerifying) return;
        setIsVerifying(true);
        try {
            const res = await fetch('/api/economy/solana/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    signature: txSignature, 
                    userId: userId || propUserId,
                    expectedAmount: targetUsd
                })
            });
            const data = await res.json();
            if (data.success) {
                setView('success');
                window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
            } else {
                alert(data.error || 'Sync Failed: Transaction not found or underpaid.');
            }
        } catch (err) {
            console.error('[P2P Sync] Error:', err);
            alert('Sync Protocol Offline. Try again or contact support.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(vaultAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, []);

    if (!isOpen) return null;

    // QR Construction: Solana Pay Protocol
    const solanaPayUrl = p2pAsset === 'USDC' 
        ? `solana:${vaultAddress}?amount=${targetUsd}&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&reference=${uniqueRef}&label=GASP%20Archive`
        : `solana:${vaultAddress}?amount=${targetSol}&reference=${uniqueRef}&label=GASP%20Archive`;

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
                                
                                {/* 🧪 INSTITUTIONAL SOVEREIGN OVERRIDE */}
                                <div 
                                    onClick={() => setIsCustom(!isCustom)}
                                    className={`relative p-8 rounded-[2.5rem] border transition-all duration-700 cursor-pointer group overflow-hidden ${isCustom ? 'bg-[#00f0ff]/5 border-[#00f0ff]/60 shadow-[0_0_80px_rgba(0,240,255,0.15)] ring-1 ring-[#00f0ff]/30' : 'bg-white/[0.02] border-white/10 opacity-60 hover:opacity-100 hover:border-white/20'}`}
                                >
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.3em] font-syncopate italic transition-all duration-500 flex items-center gap-3 ${isCustom ? 'bg-[#00f0ff] text-black shadow-[0_0_30px_#00f0ff] scale-110' : 'bg-white/10 text-white/40 group-hover:bg-white/20'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${isCustom ? 'bg-black animate-pulse' : 'bg-white/20'}`} />
                                            {isCustom ? (isSpanish ? 'ACTIVO' : 'OVERRIDE ACTIVE') : (isSpanish ? 'ACTIVAR' : 'ACTIVATE')}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6 relative z-10">
                                        <div className="flex flex-col gap-1.5 pt-2">
                                            <span className="text-[10px] font-black uppercase text-[#00f0ff] tracking-[0.4em] italic leading-none">{isSpanish ? 'SALA DE TRADING' : 'INSTITUTIONAL CUSTOM INFUSION'}</span>
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em] italic">{isSpanish ? 'Liquidación Manual de Alto Valor' : 'Manual High-Velocity Settlement Rail'}</span>
                                        </div>

                                        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 py-4">
                                            <div className="flex-1 w-full space-y-3">
                                                <div className="flex items-baseline justify-between px-2">
                                                   <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isSpanish ? 'MONTO USD' : 'SETTLEMENT USD'}</span>
                                                </div>
                                                <div className={`flex items-center gap-4 bg-black/60 border rounded-[1.5rem] p-6 transition-all duration-500 ${isCustom ? 'border-[#00f0ff]/40' : 'border-white/5 opacity-30'}`}>
                                                    <span className={`text-4xl font-syncopate font-black italic ${isCustom ? 'text-[#00f0ff]' : 'text-white/20'}`}>$</span>
                                                    <input 
                                                      disabled={!isCustom}
                                                      type="number" 
                                                      placeholder="0.00"
                                                      value={customAmount}
                                                      onClick={(e) => e.stopPropagation()}
                                                      onChange={(e) => setCustomAmount(Math.min(30000, parseFloat(e.target.value) || 0).toString())}
                                                      className="bg-transparent border-none outline-none text-4xl font-syncopate font-black italic text-white w-full placeholder:text-white/5"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 w-full space-y-3">
                                                <div className="flex items-baseline px-2">
                                                   <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isSpanish ? 'CRÉDITOS ALLOC' : 'CREDIT ALLOCATION'}</span>
                                                </div>
                                                <div className={`flex flex-col items-start justify-center h-[90px] px-8 bg-white/5 border rounded-[1.5rem] transition-all duration-500 ${isCustom ? 'border-[#00f0ff]/30' : 'border-white/5 opacity-10'}`}>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-3xl font-syncopate font-black text-white leading-none">{(parseFloat(customAmount) * 1000).toLocaleString()}</span>
                                                        <span className="text-[10px] font-black text-[#00f0ff] uppercase tracking-widest font-syncopate italic">CR</span>
                                                    </div>
                                                </div>
                                            </div>
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
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end relative z-10">
                                                <span className="text-2xl font-black text-white italic tracking-tighter">${pkg.price.toFixed(0)}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* CARD CTA */}
                                <div className="space-y-6 text-center">
                                    <button 
                                        onClick={handleStripeCheckout}
                                        disabled={isLoading}
                                        className="w-full h-24 rounded-[2.5rem] bg-white text-black font-black uppercase text-[14px] tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_80px_rgba(255,255,255,0.15)] flex items-center justify-center gap-6"
                                    >
                                        {isLoading ? <Loader2 size={32} className="animate-spin text-black" /> : <CreditCard size={32} fill="black" />}
                                        <div className="flex flex-col items-start leading-none gap-2">
                                            <span className="font-syncopate italic">{isSpanish ? 'INICIAR COMPRA' : 'INITIATE PURCHASE'}</span>
                                            <span className="text-[10px] opacity-40 font-bold tracking-widest">{isSpanish ? 'Acceso Directo con Tarjeta / Stripe' : 'Direct Card Access / Stripe Secure'}</span>
                                        </div>
                                    </button>
                                </div>

                                {/* P2P TRIGGER */}
                                <button 
                                    onClick={handleSwitchToP2P}
                                    className="w-full py-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-[#00f0ff]/40 transition-all flex items-center justify-center gap-6 group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 px-3 py-1 bg-[#00f0ff]/20 text-[#00f0ff] text-[7px] font-black uppercase tracking-widest rounded-bl-xl border-l border-b border-[#00f0ff]/30">
                                       {isSpanish ? 'SIN VERIFICACIÓN' : 'NO KYC REQUIRED'}
                                    </div>
                                    <QrCode size={28} className="text-[#00f0ff]" />
                                    <div className="flex flex-col items-start leading-none gap-2">
                                        <span className="text-[11px] font-black text-white uppercase tracking-widest font-syncopate italic">{isSpanish ? 'LIQUIDACIÓN AUTOMÁTICA P2P' : 'AUTOMATIC P2P SETTLEMENT'}</span>
                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em] italic">{isSpanish ? 'SOL o USDC // Sincronización Directa' : 'SOL or USDC // DIRECT SYNC'}</span>
                                    </div>
                                </button>
                            </div>
                        )}

                        {view === 'p2p' && (
                            <div className="space-y-10 animate-in fade-in zoom-in duration-700 text-center py-4">
                                {/* ASSET PICKER */}
                                <div className="flex items-center justify-center gap-4">
                                    <button 
                                      onClick={() => setP2pAsset('USDC')}
                                      className={`px-6 py-3 rounded-2xl flex items-center gap-2 border transition-all ${p2pAsset === 'USDC' ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff]' : 'bg-white/5 border-white/10 text-white/40 opacity-40'}`}
                                    >
                                       <Diamond size={16} fill={p2pAsset === 'USDC' ? 'currentColor' : 'none'} />
                                       <span className="text-[10px] font-black tracking-widest">USDC</span>
                                    </button>
                                    <button 
                                      onClick={() => setP2pAsset('SOL')}
                                      className={`px-6 py-3 rounded-2xl flex items-center gap-2 border transition-all ${p2pAsset === 'SOL' ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff]' : 'bg-white/5 border-white/10 text-white/40 opacity-40'}`}
                                    >
                                       <Coins size={16} />
                                       <span className="text-[10px] font-black tracking-widest">SOL</span>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 relative">
                                        <QrCode size={40} className="text-[#00f0ff]" />
                                        {isPolling && <div className="absolute inset-0 border-2 border-[#00f0ff] border-t-transparent animate-spin rounded-[2rem]" />}
                                    </div>
                                    <h3 className="text-2xl font-syncopate font-black uppercase italic text-white tracking-tighter">{isSpanish ? 'ESCANEANDO BLOQUES...' : 'SCANNING BLOCKS...'}</h3>
                                    <p className="text-sm text-white/40 leading-relaxed max-w-sm mx-auto font-medium">
                                        {isSpanish 
                                            ? `Envía ${p2pAsset === 'SOL' ? targetSol : targetUsd} ${p2pAsset} para una sincronización instantánea.` 
                                            : `Send ${p2pAsset === 'SOL' ? targetSol : targetUsd} ${p2pAsset} for instant automatic sync.`}
                                    </p>
                                </div>

                                <div className="relative p-8 bg-white rounded-[3rem] w-72 h-72 mx-auto shadow-[0_0_80px_rgba(255,255,255,0.15)] ring-4 ring-white/10">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(solanaPayUrl)}`} 
                                        alt="QR Protocol"
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 border-[15px] border-white rounded-[3rem]" />
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-between gap-6 group">
                                        <code className="text-[10px] text-white/30 font-mono break-all">{vaultAddress}</code>
                                        <button onClick={handleCopy} className="text-[#00f0ff]">{copied ? <Check size={18} /> : <Copy size={18} />}</button>
                                    </div>

                                    {/* MANUAL SYNC FALLBACK */}
                                    <div className="p-6 rounded-[2rem] bg-black border border-white/5 space-y-4">
                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{isSpanish ? '¿NO SE RECONOCE? PEGAR HASH' : 'NOT SYNCING? PASTE HASH'}</span>
                                        <div className="flex gap-2">
                                            <input 
                                              type="text"
                                              placeholder="Tx Signature"
                                              value={txSignature}
                                              onChange={(e) => setTxSignature(e.target.value)}
                                              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[9px] text-white font-mono placeholder:text-zinc-700 outline-none"
                                            />
                                            <button onClick={handleSolanaSync} disabled={isVerifying} className="bg-[#00f0ff] text-black px-4 rounded-xl text-[9px] font-black">
                                                {isVerifying ? <Loader2 size={14} className="animate-spin" /> : 'GO'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => setView('options')} className="text-[12px] font-black uppercase tracking-[0.3em] text-[#00f0ff] italic underline underline-offset-8">
                                    {isSpanish ? 'VOLVER' : 'RETURN'}
                                </button>
                            </div>
                        )}

                        {view === 'success' && (
                             <div className="py-20 flex flex-col items-center justify-center text-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center shadow-[0_0_80px_rgba(0,240,255,0.2)]">
                                   <CheckCircle2 size={48} className="text-[#00f0ff]" />
                                </div>
                                <h3 className="text-3xl font-syncopate font-black uppercase italic text-white tracking-tighter">{isSpanish ? 'FUSIÓN EXITOSA' : 'SYNC SUCCESSFUL'}</h3>
                                <button onClick={onClose} className="px-10 py-5 rounded-[1.5rem] bg-white text-black font-black uppercase text-[12px] tracking-[0.3em]">
                                    {isSpanish ? 'VOLVER AL TERMINAL' : 'RETURN TO TERMINAL'}
                                </button>
                             </div>
                        )}
                    </div>

                    <div className="p-10 pt-0 shrink-0">
                        <div className="flex items-center gap-5 px-8 py-5 bg-white/5 rounded-3xl border border-white/5 opacity-40">
                            <ShieldCheck size={20} className="text-[#00f0ff]" />
                            <p className="text-[9px] font-black uppercase text-white/30 tracking-[0.3em] italic">
                                {isSpanish ? 'LIQUIDACIÓN FINAL. SIN REEMBOLSOS.' : 'FINAL SETTLEMENT. NO REFUNDS.'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
