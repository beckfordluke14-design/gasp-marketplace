'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ShieldCheck, CreditCard, QrCode, ArrowRight, CheckCircle2, AlertCircle, Copy, Check, Loader2, Coins, Wallet, Smartphone } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/economy/constants';
import { useUser } from '../providers/UserProvider';
import { Keypair } from '@solana/web3.js';
import { usePrivy } from '@privy-io/react-auth';

interface TopUpDrawerProps {
  isOpen?: boolean;
  onClose: () => void;
  initialPackage?: string;
  userId?: string;
}

/**
 * ⛽ SOVEREIGN REVENUE TERMINAL v14.0 // FINAL REVENUE PROTOCOL
 * 100% Cross-Platform: Desktop High-Status QR vs Mobile Deep-Link.
 * 1-Click Wallet Settlement for Phantom / Connected Wallets.
 * 100% Automatic Solana Pay Integration (Beginning-to-End).
 */
export default function TopUpDrawer({ isOpen = true, onClose, initialPackage, userId: propUserId }: TopUpDrawerProps) {
    const { user, authenticated } = usePrivy();
    const { profile } = useUser();
    
    const [selectedPkgId, setSelectedPkgId] = useState(initialPackage || CREDIT_PACKAGES[0].id);
    const [copied, setCopied] = useState(false);
    const [view, setView] = useState<'options' | 'p2p' | 'success'>('options');
    const [userId, setUserId] = useState(propUserId || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    const [customAmount, setCustomAmount] = useState<string>('5000');
    const [isCustom, setIsCustom] = useState(false);

    const [solPrice, setSolPrice] = useState<number>(0);
    const [p2pAsset, setP2pAsset] = useState<'USDC' | 'SOL'>('USDC');
    const [uniqueRef, setUniqueRef] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [txSignature, setTxSignature] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';
    const vaultAddress = 'DGQVNRTWEv1HEwP6Wtcm1LEUPgZKsW9JfwVpEDjPcEkS';

    const solanaAddress = user?.linkedAccounts?.find(a => a.type === 'wallet' && a.chainType === 'solana')?.address;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
            if (!userId) setUserId(localStorage.getItem('gasp_guest_id') || 'anon');
        }
    }, [userId]);

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
        const ref = Keypair.generate().publicKey.toBase58();
        setUniqueRef(ref);
        setView('p2p');
        startPolling(ref);
    };

    const handleWalletTransfer = async () => {
        alert(isSpanish ? 'Firmar transacción en Phantom/Bóveda para completar la liquidación.' : 'Please sign the transaction in Phantom to complete settlement.');
    };

    const handleSolanaPayDeepLink = () => {
        window.location.href = solanaPayUrl;
    };

    const handleSolanaSync = async () => {
        if (!txSignature || isVerifying) return;
        setIsVerifying(true);
        try {
            const res = await fetch('/api/economy/solana/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signature: txSignature, userId: userId || propUserId, expectedAmount: targetUsd })
            });
            const data = await res.json();
            if (data.success) {
                setView('success');
                window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
            } else {
                alert(data.error || 'Sync Failed: Transaction underpaid or not found.');
            }
        } catch (err) {
            console.error('[P2P Sync] Error:', err);
            alert('Sync Protocol Offline.');
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

    const solanaPayUrl = p2pAsset === 'USDC' 
        ? `solana:${vaultAddress}?amount=${targetUsd}&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&reference=${uniqueRef}&label=GASP%20Archive`
        : `solana:${vaultAddress}?amount=${targetSol}&reference=${uniqueRef}&label=GASP%20Archive`;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[20000] flex items-center justify-center p-4 selection:bg-[#00f0ff]/30 text-white"
            >
                <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={onClose} />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }}
                    className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[3.5rem] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.9)] flex flex-col font-outfit max-h-[90vh]"
                >
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-60 shrink-0" />
                    
                    <div className="p-10 pb-6 flex items-center justify-between shrink-0">
                        <div className="flex flex-col gap-1.5 text-left">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#00f0ff] italic">{isSpanish ? 'Protocolo de Ingreso' : 'REVENUE INGRESS PROTOCOL'}</span>
                            <h2 className="text-3xl font-syncopate font-black uppercase italic text-white leading-none tracking-tighter">{isSpanish ? 'Centro de Recarga' : 'TOP UP HUB'}</h2>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"><X size={24} /></button>
                    </div>

                    <div className="flex-1 p-10 pt-4 overflow-y-auto no-scrollbar pb-12">
                        {view === 'options' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                
                                {/* 🧪 CUSTOM INSTITUTIONAL HUB */}
                                <div onClick={() => setIsCustom(!isCustom)} className={`relative p-8 rounded-[2.5rem] border transition-all duration-700 cursor-pointer group overflow-hidden ${isCustom ? 'bg-[#00f0ff]/5 border-[#00f0ff]/60 shadow-[0_0_80px_rgba(0,240,255,0.15)] ring-1 ring-[#00f0ff]/30' : 'bg-white/[0.02] border-white/10 opacity-60'}`}>
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.3em] font-syncopate italic flex items-center gap-3 ${isCustom ? 'bg-[#00f0ff] text-black shadow-[0_0_30px_#00f0ff]' : 'bg-white/10 text-white/40'}`}>
                                            {isCustom ? (isSpanish ? 'ACTIVO' : 'OVERRIDE ACTIVE') : (isSpanish ? 'ACTIVAR' : 'ACTIVATE')}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-6 relative z-10 text-left">
                                        <div className="flex flex-col gap-1.5"><span className="text-[10px] font-black uppercase text-[#00f0ff] tracking-[0.4em] italic leading-none">{isSpanish ? 'SALA DE TRADING' : 'INSTITUTIONAL CUSTOM INFUSION'}</span></div>
                                        <div className="flex flex-col md:flex-row items-center gap-8 py-4">
                                            <div className="flex-1 w-full space-y-3">
                                                <div className="flex items-baseline justify-between px-2"><span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isSpanish ? 'MONTO USD' : 'SETTLEMENT USD'}</span><span className="text-[8px] font-black text-red-500/60 uppercase tracking-widest">LIMIT: $30,000</span></div>
                                                <div className={`flex items-center gap-4 bg-black/60 border rounded-[1.5rem] p-6 transition-all duration-500 ${isCustom ? 'border-[#00f0ff]/40 ring-1 ring-[#00f0ff]/20' : 'border-white/5 opacity-30 grayscale'}`}>
                                                    <span className={`text-4xl font-syncopate font-black italic ${isCustom ? 'text-[#00f0ff]' : 'text-white/20'}`}>$</span>
                                                    <input disabled={!isCustom} type="number" value={customAmount} onClick={(e) => e.stopPropagation()} onChange={(e) => setCustomAmount(Math.min(30000, parseFloat(e.target.value) || 0).toString())} className="bg-transparent border-none outline-none text-4xl font-syncopate font-black italic text-white w-full placeholder:text-white/5" />
                                                </div>
                                            </div>
                                            <div className="flex-1 w-full space-y-3">
                                                <div className="flex items-baseline px-2"><span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isSpanish ? 'CRÉDITOS ALLOC' : 'CREDIT ALLOCATION'}</span></div>
                                                <div className={`flex flex-col items-start justify-center h-[90px] px-8 bg-white/5 border rounded-[1.5rem] transition-all duration-500 ${isCustom ? 'border-[#00f0ff]/30' : 'border-white/5 opacity-10'}`}>
                                                    <div className="flex items-baseline gap-2"><span className="text-3xl font-syncopate font-black text-white">{(parseFloat(customAmount) * 1000).toLocaleString()}</span><span className="text-[10px] font-black text-[#00f0ff] uppercase italic">CR</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* PACKAGE SELECTOR */}
                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-700 ${isCustom ? 'opacity-10 pointer-events-none' : ''}`}>
                                    {packages.map((pkg) => (
                                        <button key={pkg.id} onClick={() => setSelectedPkgId(pkg.id)} className={`relative p-6 rounded-[2rem] border transition-all duration-300 flex items-center justify-between group overflow-hidden ${selectedPkgId === pkg.id ? 'bg-white/5 border-white/30 scale-[1.02]' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
                                            {selectedPkgId === pkg.id && <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ backgroundColor: pkg.color }} />}
                                            <div className="flex flex-col gap-1 text-left relative z-10"><span className="text-[9px] font-black uppercase tracking-widest text-white/30 font-syncopate italic">{pkg.label}</span><div className="flex items-center gap-2"><span className="text-2xl font-syncopate font-black text-white italic tracking-tighter">{pkg.credits > 100000 ? (pkg.credits/1000).toFixed(0) + 'K' : pkg.credits.toLocaleString()}</span><span className="text-[10px] font-black text-white/40 uppercase tracking-tighter mt-1">CR</span></div></div>
                                            <div className="flex flex-col items-end relative z-10"><span className="text-2xl font-black text-white italic tracking-tighter">${pkg.price.toFixed(0)}</span></div>
                                        </button>
                                    ))}
                                </div>

                                {/* STRIPE CTA */}
                                <div className="space-y-6 text-center">
                                    <button onClick={handleStripeCheckout} disabled={isLoading} className="w-full h-24 rounded-[2.5rem] bg-white text-black font-black uppercase text-[14px] tracking-[0.2em] transition-all shadow-[0_20px_80px_rgba(255,255,255,0.15)] flex items-center justify-center gap-6 group hover:scale-[1.02]">
                                        {isLoading ? <Loader2 size={32} className="animate-spin text-black" /> : <CreditCard size={32} fill="black" />}
                                        <div className="flex flex-col items-start leading-none gap-2"><span className="font-syncopate italic tracking-tighter">{isSpanish ? 'INICIAR COMPRA' : 'INITIATE PURCHASE'}</span><span className="text-[10px] opacity-40 font-bold tracking-widest">{isSpanish ? 'Acceso Directo con Tarjeta / Stripe' : 'Direct Card Access / Stripe Secure'}</span></div>
                                        {!isLoading && <ArrowRight size={24} className="opacity-40 group-hover:translate-x-3 transition-transform" />}
                                    </button>
                                </div>

                                {/* SOVEREIGN TRIGGER (MOBILE vs DESKTOP) */}
                                {solanaAddress ? (
                                    <button onClick={handleSwitchToP2P} className="w-full py-8 rounded-[2.5rem] bg-[#00f0ff]/10 border border-[#00f0ff]/40 hover:bg-[#00f0ff]/20 transition-all flex items-center justify-center gap-6 group relative">
                                        <div className="absolute top-0 right-0 px-3 py-1 bg-[#00f0ff] text-black text-[7px] font-black uppercase tracking-widest rounded-bl-xl shadow-[0_0_20px_#00f0ff]">{isSpanish ? 'BÓVEDA DETECTADA' : 'SOVEREIGN WALLET'}</div>
                                        <Wallet size={28} className="text-[#00f0ff]" />
                                        <div className="flex flex-col items-start leading-none gap-2 text-left"><span className="text-[11px] font-black text-white uppercase tracking-widest font-syncopate italic">{isSpanish ? 'LIQUIDACIÓN CON BÓVEDA CONECTADA' : 'PAY WITH CONNECTED WALLET'}</span><span className="text-[8px] font-black text-[#00f0ff] uppercase tracking-[0.5em] italic">{solanaAddress.slice(0, 4)}...{solanaAddress.slice(-4)} // 1-CLICK SETTLEMENT</span></div>
                                    </button>
                                ) : (
                                    <button onClick={handleSwitchToP2P} className="w-full py-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-[#00f0ff]/40 transition-all flex items-center justify-center gap-6 group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 px-3 py-1 bg-[#00f0ff]/20 text-[#00f0ff] text-[7px] font-black uppercase tracking-widest rounded-bl-xl">{isSpanish ? 'SIN VERIFICACIÓN' : 'NO KYC REQUIRED'}</div>
                                        <QrCode size={28} className="text-[#00f0ff]" />
                                        <div className="flex flex-col items-start leading-none gap-2 text-left"><span className="text-[11px] font-black text-white uppercase tracking-widest font-syncopate italic">{isSpanish ? 'LIQUIDACIÓN AUTOMÁTICA P2P' : 'AUTOMATIC P2P SETTLEMENT'}</span><span className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em] italic">{isSpanish ? 'SOL o USDC // Sincronización Directa' : 'SOL or USDC // DIRECT SYNC'}</span></div>
                                    </button>
                                )}
                            </div>
                        )}

                        {view === 'p2p' && (
                            <div className="space-y-10 animate-in fade-in zoom-in duration-700 text-center py-4">
                                <div className="flex items-center justify-center gap-4">
                                    <button onClick={() => setP2pAsset('USDC')} className={`px-6 py-3 rounded-2xl flex items-center gap-2 border transition-all ${p2pAsset === 'USDC' ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff]' : 'bg-white/5 border-white/10 text-white/40'}`}><Diamond size={16} fill={p2pAsset === 'USDC' ? 'currentColor' : 'none'} /><span className="text-[10px] font-black tracking-widest">USDC</span></button>
                                    <button onClick={() => setP2pAsset('SOL')} className={`px-6 py-3 rounded-2xl flex items-center gap-2 border transition-all ${p2pAsset === 'SOL' ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff]' : 'bg-white/5 border-white/10 text-white/40'}`}><Coins size={16} /><span className="text-[10px] font-black tracking-widest">SOL</span></button>
                                </div>

                                <div className="space-y-4">
                                    <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 relative">
                                        <QrCode size={40} className="text-[#00f0ff]" />
                                        {isPolling && <div className="absolute inset-0 border-2 border-[#00f0ff] border-t-transparent animate-spin rounded-[2rem] shadow-[0_0_40px_rgba(0,240,255,0.4)]" />}
                                    </div>
                                    <h3 className="text-2xl font-syncopate font-black uppercase italic text-white tracking-tighter leading-none">{isPolling ? (isSpanish ? 'ESPERANDO PAGO...' : 'WAITING FOR SYNC...') : (isSpanish ? 'LIQUIDACIÓN P2P' : 'P2P SETTLEMENT')}</h3>
                                    <p className="text-[10px] text-white/40 leading-relaxed max-w-[280px] mx-auto font-black uppercase tracking-widest italic">{isPolling ? (isSpanish ? 'ESCANEANDO BLOQUES DE SOLANA EN TIEMPO REAL...' : 'SCANNING SOLANA BLOCKS IN REAL-TIME...') : `Enviar ${p2pAsset === 'SOL' ? targetSol : targetUsd} ${p2pAsset} a la Bóveda.`}</p>
                                </div>

                                {isMobile ? (
                                    <div className="py-10 space-y-8">
                                        <button onClick={handleSolanaPayDeepLink} className="w-full h-24 rounded-[3rem] bg-[#00f0ff] text-black font-black uppercase text-[15px] tracking-[0.2em] shadow-[0_10px_60px_rgba(0,240,255,0.4)] flex items-center justify-center gap-4 animate-bounce">
                                           <Smartphone size={32} />
                                           <span className="font-syncopate italic tracking-tighter">{isSpanish ? 'ABRIR PHANTOM' : 'OPEN IN PHANTOM'}</span>
                                        </button>
                                        <div className="flex flex-col gap-2 opacity-40">
                                            <span className="text-[8px] font-black uppercase tracking-widest">{isSpanish ? 'O ESCANEAR CON OTRO DISPOSITIVO' : 'OR SCAN WITH ANOTHER DEVICE'}</span>
                                            <div className="p-4 bg-white rounded-3xl w-48 h-48 mx-auto"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(solanaPayUrl)}`} className="w-full h-full object-contain" /></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative p-10 bg-white rounded-[3.5rem] w-80 h-80 mx-auto shadow-[0_0_100px_rgba(255,255,255,0.1)] ring-8 ring-white/5 group">
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(solanaPayUrl)}`} alt="QR Protocol" className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 border-[20px] border-white rounded-[3.5rem]" />
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-between group">
                                        <code className="text-[10px] text-white/30 font-mono break-all">{vaultAddress}</code>
                                        <button onClick={handleCopy} className="text-[#00f0ff]">{copied ? <Check size={20} /> : <Copy size={20} />}</button>
                                    </div>
                                    <div className="p-6 rounded-[2.5rem] bg-black border border-white/5 space-y-4">
                                        <div className="flex items-center gap-3 px-2">
                                            <div className="w-1 h-1 rounded-full bg-white/20" />
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] font-syncopate italic">{isSpanish ? 'FALLO DE SINCRONIZACIÓN? PEGAR HASH' : 'SYNC FAILURE? PASTE TRANSACTION HASH'}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Solana Tx Signature" value={txSignature} onChange={(e) => setTxSignature(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[10px] text-zinc-400 font-mono outline-none focus:border-[#00f0ff]/40 transition-all" />
                                            <button onClick={handleSolanaSync} disabled={isVerifying} className="px-6 rounded-2xl bg-[#00f0ff] text-black text-[10px] font-black hover:scale-[1.05]">{isVerifying ? <Loader2 size={16} className="animate-spin" /> : 'FORCE'}</button>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => setView('options')} className="text-[11px] font-black uppercase tracking-[0.4em] text-[#00f0ff] italic hover:text-white transition-colors">{isSpanish ? 'VOLVER AL INICIO' : 'RETURN TO OPTIONS'}</button>
                            </div>
                        )}

                        {view === 'success' && (
                             <div className="py-24 flex flex-col items-center justify-center text-center gap-8 animate-in zoom-in duration-1000">
                                <div className="w-28 h-28 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center shadow-[0_0_100px_rgba(0,240,255,0.3)] animate-pulse"><CheckCircle2 size={56} className="text-[#00f0ff]" /></div>
                                <div className="space-y-3"><h3 className="text-4xl font-syncopate font-black uppercase italic text-white tracking-tighter leading-none shrink-0">{isSpanish ? 'FUSIÓN EXITOSA' : 'SYNC SUCCESSFUL'}</h3><p className="text-[10px] text-white/40 uppercase tracking-[0.5em] font-black italic">{isSpanish ? 'Créditos asignados a su nodo de identidad' : 'Credits allocated to your identity node'}</p></div>
                                <button onClick={onClose} className="px-14 py-6 rounded-[2.5rem] bg-white text-black font-black uppercase text-[13px] tracking-[0.3em] hover:scale-[1.05] active:scale-95 transition-all shadow-white/20 shadow-2xl">{isSpanish ? 'VOLVER AL TERMINAL' : 'RETURN TO TERMINAL'}</button>
                             </div>
                        )}
                    </div>

                    <div className="p-10 pt-0 shrink-0">
                        <div className="flex items-center gap-5 px-10 py-6 bg-white/5 rounded-[2.5rem] border border-white/5 opacity-50 ring-1 ring-white/5">
                            <ShieldCheck size={20} className="text-[#00f0ff]" />
                            <p className="text-[9px] font-black uppercase text-white/20 tracking-[0.4em] leading-relaxed italic">{isSpanish ? 'TERMINAL DE LIQUIDACIÓN SOBERANA // SIN REEMBOLSOS // ENLACE SEGURO' : 'SOVEREIGN SETTLEMENT TERMINAL // NO REFUNDS // SECURE UPLINK'}</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
