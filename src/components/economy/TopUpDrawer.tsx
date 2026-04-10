'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ShieldCheck, CreditCard, QrCode, ArrowRight, CheckCircle2, AlertCircle, Copy, Check, Loader2, Coins, Wallet, Smartphone } from 'lucide-react';
import { CREDIT_PACKAGES, SYNDICATE_TREASURY_SOL } from '@/lib/economy/constants';
import { useUser } from '../providers/UserProvider';
import { usePrivy, useWallets } from '@privy-io/react-auth';


interface TopUpDrawerProps {
  isOpen?: boolean;
  onClose: () => void;
  initialPackage?: string;
  userId?: string;
}

/**
 * ⛽ SOVEREIGN REVENUE TERMINAL v15.0 // FINAL ARCHIVED REVENUE RAILS
 * Dual-Rail (USDC/SOL) Settlement Terminal.
 * 100% Verified Revenue Lockdown to SYNDICATE_TREASURY_SOL.
 */
export default function TopUpDrawer({ isOpen = true, onClose, initialPackage, userId: propUserId }: TopUpDrawerProps) {
    const { user, authenticated } = usePrivy();
    const { wallets } = useWallets();
    const { profile } = useUser();
    
    // 🛡️ SOLANA WALLET FILTER
    const solanaWallets = wallets.filter(w => (w as any).chainType === 'solana' || w.address?.length > 42);
    
    const [selectedPkgId, setSelectedPkgId] = useState(initialPackage || CREDIT_PACKAGES[0].id);
    const [copied, setCopied] = useState(false);
    const [view, setView] = useState<'options' | 'p2p' | 'success'>('options');
    const [userId, setUserId] = useState(propUserId || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    const [customAmount, setCustomAmount] = useState<string>('19.99');
    const [isCustom, setIsCustom] = useState(false);

    const [solPrice, setSolPrice] = useState<number>(0);
    const [p2pAsset, setP2pAsset] = useState<'USDC' | 'SOL'>('SOL');
    const [uniqueRef, setUniqueRef] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [txSignature, setTxSignature] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [expiryTime, setExpiryTime] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isCheckoutPending, setIsCheckoutPending] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';

    const solanaAddress = (user?.linkedAccounts?.find(a => (a as any).type === 'wallet' && (a as any).chainType === 'solana') as any)?.address;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
            const guestId = localStorage.getItem('gasp_guest_id') || 'anon';
            if (!userId) setUserId(guestId);

            // 🛡️ RESUME: Check server for any pending P2P session
            const resolvedId = propUserId || guestId;
            if (resolvedId) {
                fetch(`/api/economy/solana/session?userId=${resolvedId}`)
                    .then(r => r.json())
                    .then(data => {
                        if (data.success && data.session) {
                            setUniqueRef(data.session.reference);
                            setExpiryTime(data.session.expires_at);
                            setView('p2p');
                            startPolling(data.session.reference);
                        }
                    })
                    .catch(() => {});
            }
        }
    }, [userId]);

    // 🕒 COUNTDOWN ENGINE
    useEffect(() => {
        if (!expiryTime || view !== 'p2p') return;
        
        const tick = () => {
            const now = new Date().getTime();
            const end = new Date(expiryTime).getTime();
            const diff = end - now;
            
            if (diff <= 0) {
                setTimeLeft('00:00');
                return;
            }
            
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        };
        
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [expiryTime, view]);

    const fetchLivePrice = async () => {
        try {
            const res = await fetch('/api/economy/solana/price');
            const data = await res.json();
            if (data.success && data.price) {
                setSolPrice(data.price);
            }
        } catch (e) { console.error('[Oracle Sync Lag]:', e); }
    };

    useEffect(() => {
        fetchLivePrice();
        // 🧬 DYNAMIC HEARTBEAT: Re-fetch every 30s for high-volatility lockdown
        const interval = setInterval(fetchLivePrice, 30000); 
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
            popular: p.isPopular || false,
            color: color
        };
    });

    const selectedPkg = packages.find(p => p.id === selectedPkgId) || packages[0];
    const targetUsd = isCustom ? parseFloat(customAmount) : selectedPkg.price;
    const resolvedSolPrice = solPrice > 0 ? solPrice : 188;
    const targetSol = (targetUsd / resolvedSolPrice).toFixed(6);

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
                // 🛰️ SOVEREIGN RETENTION: Open in new tab to keep the chat session active in the background.
                const win = window.open(data.redirectUrl, '_blank');
                if (win) {
                    setIsCheckoutPending(true);
                    setIsLoading(false);
                } else {
                    // Fallback if popup was blocked
                    window.location.href = data.redirectUrl;
                }
            } else {
                throw new Error(data.error || 'Fault');
            }
        } catch (err: any) {
            console.error('[TopUp] Stripe session failed:', err);
            setIsCheckoutPending(false);
            // 🔱 SOVEREIGN PIVOT: If Stripe blocks them, bounce them to the P2P Rail immediately
            const msg = err.message || '';
            if (msg.includes('IP address') || msg.includes('Invalid IP') || msg.includes('not supported')) {
                handleSwitchToP2P();
            } else {
                alert(`Stripe Error: ${msg}. Use P2P rail for instant settlement.`);
            }
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

    // 📡 DIRECT PAYMENT: Opens the Solana Pay deep link which auto-connects to
    // any installed wallet (Phantom, Solflare, Backpack) on both mobile and desktop.
    // This avoids importing @solana/web3.js which breaks client-side Next.js bundles.
    const handleDirectPayment = () => {
        const url = buildSolanaPayUrl();
        // 🛰️ UNIVERSAL PROTOCOL HANDSHAKE:
        // By using location.href directly, we trigger the installed wallet's
        // protocol handler (extension or app) without creating blank tabs
        // or navigating away if the wallet intercepts the call.
        window.location.href = url;
    };

    const handleSwitchToP2P = async () => {
        // Fetch latest price silently — don't block the user
        await fetchLivePrice();

        try {
            const resolvedId = userId || propUserId || 'anon';
            const res = await fetch('/api/economy/solana/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: resolvedId, amountUsd: targetUsd }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            setUniqueRef(data.reference);
            setExpiryTime(new Date(Date.now() + 3600000).toISOString()); // local fallback
            setView('p2p');
            startPolling(data.reference);

            // 🧬 AUTOMATIC MOBILE HANDSHAKE
            // If they are on mobile, automatically trigger the deep link for Phantom/Solflare
            if (isMobile) {
                // Short delay to ensure state and QR are ready, then bounce to wallet
                setTimeout(() => {
                    window.location.href = buildSolanaPayUrl();
                }, 800);
            }
        } catch (err) {
            console.error('[P2P] Session creation failed:', err);
            alert('P2P session unavailable. Try again.');
        }
    };

    const handleSolanaPayDeepLink = () => {
        window.location.href = solanaPayUrl;
    };

    useEffect(() => {
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, []);

    const buildSolanaPayUrl = () => {
        const params = new URLSearchParams();
        const baseUsd = parseFloat(targetUsd.toString()) || 4.99;
        
        // 🧬 UNIQUE DUSTING PROTOCOL: Add random lamports to ensure global amount uniqueness
        // This allows 100% accurate matching even if reference keys are stripped.
        const dust = (Math.floor(Math.random() * 900) + 100) / 100000000; // 0.00000100 to 0.00000999 SOL

        if (p2pAsset === 'USDC') {
            const cleanUsd = baseUsd + dust;
            params.append('amount', cleanUsd.toFixed(6));
            params.append('spl-token', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
        } else {
            const cleanSol = (baseUsd / resolvedSolPrice) + dust;
            params.append('amount', cleanSol.toFixed(9));
        }

        if (uniqueRef) {
            params.append('reference', uniqueRef);
            // 🛡️ SOVEREIGN MEMO: Embed the session ID directly into the blockchain metadata
            params.append('memo', `GASP:REF:${uniqueRef.slice(0, 8)}`);
        }
        params.append('label', 'GASP Hub');
        params.append('message', `SECURE_SETTLE_${uniqueRef?.slice(0, 4)}`);
        
        const solPayUrl = `solana:${SYNDICATE_TREASURY_SOL}?${params.toString()}`;
        
        // 🧬 SOVEREIGN HANDOFF:
        // Use the native solana: scheme to allow ANY installed wallet (Phantom/Solflare/Backpack)
        // to detect and handle the transaction automatically.
        return solPayUrl;
    };

    const solanaPayUrl = buildSolanaPayUrl();

    if (!isOpen) return null;

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
                    
                    <div className="p-8 pb-4 flex items-center justify-between shrink-0">
                        <div className="flex flex-col gap-1 text-left">
                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#00f0ff] italic">{isSpanish ? 'SISTEMA DE CRÉDITOS' : 'CREDIT SYSTEM'}</span>
                            <h2 className="text-2xl font-syncopate font-black uppercase italic text-white leading-none tracking-tighter">{isSpanish ? 'COMPRAR CRÉDITOS' : 'BUY CREDITS'}</h2>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"><X size={20} /></button>
                    </div>

                    <div className="flex-1 p-8 pt-2 overflow-y-auto no-scrollbar pb-10">
                        {view === 'options' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className={`relative p-6 rounded-[2rem] border transition-all duration-700 group overflow-hidden bg-white/[0.02] ${isCustom ? 'border-[#00f0ff]/60 shadow-[0_0_50px_rgba(0,240,255,0.1)] ring-1 ring-[#00f0ff]/30' : 'border-white/10'}`}>
                                    <div className="flex flex-col gap-4 relative z-10 text-left">
                                        <div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase text-[#00f0ff] tracking-[0.4em] italic leading-none">{isSpanish ? 'MONTO PERSONALIZADO' : 'SET CUSTOM AMOUNT'}</span><span className="text-[8px] font-black text-white/20 uppercase tracking-widest">LIMIT: $30,000</span></div>
                                        <div className={`flex items-center gap-4 bg-black/40 border rounded-[1.2rem] px-6 py-4 transition-all duration-500 ${isCustom ? 'border-[#fbbf24]/40' : 'border-white/5'}`}>
                                            <span className={`text-3xl font-syncopate font-black italic ${isCustom ? 'text-white' : 'text-white/20'}`}>$</span>
                                            <input 
                                                type="number" 
                                                value={customAmount} 
                                                onClick={(e) => { e.stopPropagation(); setIsCustom(true); }} 
                                                onChange={(e) => {
                                                    const val = Math.min(30000, parseFloat(e.target.value) || 0).toString();
                                                    setCustomAmount(val);
                                                    setIsCustom(true);
                                                }} 
                                                className="bg-transparent border-none outline-none text-3xl font-syncopate font-black italic text-white w-full placeholder:text-white/5" 
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black uppercase text-white/40 tracking-widest italic">{isSpanish ? 'RECIBES:' : 'YOU RECEIVE:'}</span>
                                            <span className="text-xl font-syncopate font-black italic text-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                                                {(parseFloat(customAmount) * 1000).toLocaleString()} 
                                            </span>
                                            <span className="text-[10px] font-black text-[#fbbf24]/40 uppercase tracking-tighter mt-1 italic">CR</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`grid grid-cols-2 gap-3 transition-all duration-700 ${isCustom ? 'opacity-30' : ''}`}>
                                    {packages.map((pkg) => (
                                        <button key={pkg.id} onClick={() => { setSelectedPkgId(pkg.id); setIsCustom(false); }} className={`relative p-4 rounded-[1.5rem] border transition-all duration-300 flex items-center justify-between group overflow-hidden ${(!isCustom && selectedPkgId === pkg.id) ? 'bg-[#fbbf24]/5 border-[#fbbf24]/40 scale-[1.02] shadow-[0_0_30px_rgba(251,191,36,0.1)]' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
                                            {/* 🎯 CONVERSION BADGES */}
                                            {pkg.price >= 999 && <div className="absolute top-0 right-0 px-3 py-1 bg-[#fbbf24] text-black text-[7px] font-black uppercase tracking-widest rounded-bl-lg shadow-[0_0_15px_rgba(251,191,36,0.3)] z-20 pulse">BEST VALUE</div>}
                                            {pkg.popular && <div className="absolute top-0 right-0 px-3 py-1 bg-[#00f0ff] text-black text-[7px] font-black uppercase tracking-widest rounded-bl-lg shadow-[0_0_15px_rgba(0,240,255,0.3)] z-20">POPULAR</div>}
                                            
                                            {(!isCustom && selectedPkgId === pkg.id) && <div className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: '#fbbf24' }} />}
                                            
                                            <div className="flex flex-col gap-1 text-left relative z-10">
                                                <span className="text-[7px] font-black uppercase tracking-widest text-white/20 font-syncopate italic leading-none">{pkg.label}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xl font-syncopate font-black text-[#fbbf24] italic tracking-tighter drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                                                        {pkg.credits > 100000 ? (pkg.credits/1000).toFixed(0) + 'K' : pkg.credits.toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] font-black text-[#fbbf24] uppercase tracking-tighter mt-1 italic">CR</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col items-end relative z-10 transition-all group-hover:translate-x-1">
                                                <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl group-hover:border-white/40 transition-all">
                                                    <span className="text-lg font-black text-white italic tracking-tighter leading-none">${pkg.price.toFixed(0)}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                 {isCheckoutPending ? (
                                    <div className="p-6 rounded-[2rem] bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-center space-y-4 animate-pulse">
                                        <div className="flex items-center justify-center gap-3 text-[#00f0ff]">
                                            <Loader2 size={24} className="animate-spin" />
                                            <span className="text-sm font-black uppercase tracking-widest font-syncopate italic">Checkout Active</span>
                                        </div>
                                        <p className="text-[10px] text-white/60 uppercase font-bold tracking-widest leading-relaxed">
                                            Follow instructions in the new window.<br/>
                                            Return here once your deposit is confirmed.
                                        </p>
                                        <button onClick={() => setIsCheckoutPending(false)} className="text-[9px] font-black text-[#00f0ff] uppercase tracking-widest hover:underline">
                                            Return to payment options
                                        </button>
                                    </div>
                                 ) : (
                                    <>
                                        <div className="space-y-4 text-center">
                                            <button onClick={handleStripeCheckout} disabled={isLoading} className="w-full h-20 rounded-[2.5rem] bg-white text-black font-black uppercase text-[12px] tracking-[0.2em] transition-all shadow-[0_20px_100px_rgba(255,255,255,0.2)] flex items-center justify-center gap-5 group hover:scale-[1.02] relative overflow-hidden shrink-0">
                                                {isLoading ? <Loader2 size={24} className="animate-spin text-black" /> : <CreditCard size={24} fill="black" />}
                                                <span className="font-syncopate italic tracking-tighter text-base">{isSpanish ? 'PAGAR CON TARJETA' : 'BUY WITH CARD'}</span>
                                            </button>
                                        </div>

                                        <button onClick={handleSwitchToP2P} 
                                            className="w-full h-24 rounded-[2.5rem] bg-gradient-to-br from-[#00f0ff]/10 to-transparent border border-[#00f0ff]/30 hover:border-[#00f0ff] transition-all flex items-center justify-center gap-5 group relative overflow-hidden shrink-0 shadow-[0_0_50px_rgba(0,240,255,0.05)] hover:shadow-[0_0_80px_rgba(0,240,255,0.15)]"
                                        >
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-40 shrink-0" />
                                            <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#00f0ff] text-black text-[8px] font-black uppercase tracking-[0.2em] leading-none rounded-bl-xl shadow-lg z-10 italic">SOVEREIGN CHOICE</div>
                                            <QrCode size={28} className="text-[#00f0ff] group-hover:scale-110 transition-transform duration-500" />
                                            <div className="flex flex-col items-start leading-none gap-2 text-left">
                                                <span className="text-[11px] font-black text-white uppercase tracking-widest font-syncopate italic">{isSpanish ? 'PAGAR CON SOLANA / USDC' : 'PAY WITH SOLANA / USDC'}</span>
                                                <span className="text-[8px] font-black text-[#00f0ff]/60 uppercase tracking-[0.4em] italic leading-tight group-hover:text-[#00f0ff] transition-colors">{isSpanish ? 'SOLUCIÓN P2P DIRECTA // INSTANTÁNEA' : 'DIRECT P2P SETTLEMENT // INSTANT'}</span>
                                            </div>
                                            <ArrowRight size={20} className="text-[#00f0ff]/40 group-hover:translate-x-2 transition-all ml-auto mr-5" />
                                        </button>
                                    </>
                                 )}
                            </div>
                        )}

                        {view === 'p2p' && (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-700 text-center py-2">
                                <div className="space-y-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-2 relative">
                                        <QrCode size={24} className="text-[#00f0ff]" />
                                        {isPolling && <div className="absolute inset-0 border-2 border-[#00f0ff] border-t-transparent animate-spin rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)]" />}
                                    </div>
                                    <h3 className="text-lg font-syncopate font-black uppercase italic text-white tracking-tighter leading-none">{isPolling ? (isSpanish ? 'VERIFICANDO...' : 'VERIFYING...') : (isSpanish ? 'LIQUIDACIÓN P2P' : 'P2P SETTLEMENT')}</h3>
                                    
                                    {/* 🕒 REAL-TIME URGENCY: COUNTDOWN */}
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">{isSpanish ? 'EXPIRA EN:' : 'EXPIRES IN:'}</span>
                                        <span className={`text-[12px] font-mono font-black ${timeLeft === '00:00' ? 'text-red-500' : 'text-[#ffea00]'} animate-pulse`}>
                                            {timeLeft || '60:00'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex flex-col items-center gap-1 px-5 py-3 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-[1.2rem]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-pulse" />
                                                <span className="text-[14px] font-syncopate font-black text-white italic tracking-tighter">
                                                    {p2pAsset === 'SOL' ? `${targetSol} SOL` : `$${parseFloat(targetUsd.toString()).toFixed(2)} USDC`}
                                                </span>
                                            </div>
                                            <div className="h-px w-full bg-white/10 my-1" />
                                            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">
                                                {p2pAsset === 'SOL' ? (solPrice > 0 ? `1 SOL = $${solPrice.toFixed(2)}` : 'ORACLE SYNCING...') : '1 USDC = $1.00'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex flex-col items-center gap-4 py-2">
                                        <span className="text-[8px] font-black text-[#00f0ff] uppercase tracking-[0.3em] font-syncopate italic">{isSpanish ? 'SELECCIONA ACTIVO' : 'SELECT ASSET'}</span>
                                        <div className="flex items-center justify-center gap-3 bg-white/5 p-1.5 rounded-xl border border-white/5">
                                            <button onClick={() => setP2pAsset('USDC')} className={`px-6 py-2 rounded-lg flex items-center gap-2 border transition-all ${p2pAsset === 'USDC' ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'bg-white/5 border-white/10 text-white/40'}`}><span className="text-[9px] font-black tracking-widest font-syncopate italic">USDC</span></button>
                                            <button onClick={() => setP2pAsset('SOL')} className={`px-6 py-2 rounded-lg flex items-center gap-2 border transition-all ${p2pAsset === 'SOL' ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'bg-white/5 border-white/10 text-white/40'}`}><span className="text-[9px] font-black tracking-widest font-syncopate italic">SOL</span></button>
                                        </div>
                                    </div>

                                    {isMobile ? (
                                        <div className="py-1 space-y-4">
                                            <button onClick={handleSolanaPayDeepLink} className="w-full h-20 rounded-[2.5rem] bg-[#00f0ff] text-black font-black uppercase text-[13px] tracking-[0.2em] shadow-[0_15px_60px_rgba(0,240,255,0.4)] flex items-center justify-center gap-5 group hover:scale-[1.02] active:scale-95 transition-all">
                                               <Smartphone size={28} />
                                               <div className="flex flex-col items-start leading-none gap-1 pt-0.5">
                                                   <span className="font-syncopate italic tracking-tighter uppercase">{isSpanish ? 'ABRIR BILLETERA' : 'OPEN PHANTOM'}</span>
                                               </div>
                                            </button>
                                            <div className="p-3 bg-white rounded-2xl w-36 h-36 mx-auto"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(solanaPayUrl)}`} className="w-full h-full object-contain" /></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <button onClick={handleDirectPayment} className="w-full h-20 rounded-[2.5rem] bg-[#00f0ff] text-black font-black uppercase text-[13px] tracking-[0.2em] shadow-[0_20px_80px_rgba(0,240,255,0.4)] flex items-center justify-center gap-5 group hover:scale-[1.02] active:scale-95 transition-all">
                                                <Wallet size={28} />
                                                <div className="flex flex-col items-start leading-none gap-1 pt-0.5">
                                                    <span className="font-syncopate italic tracking-tighter uppercase">{isSpanish ? 'PAGAR AHORA' : 'PAY NOW'}</span>
                                                </div>
                                            </button>
                                            <div className="relative p-6 bg-white rounded-[2.5rem] w-64 h-64 mx-auto shadow-[0_0_80px_rgba(255,255,255,0.1)] ring-4 ring-white/5 group">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(solanaPayUrl)}`} alt="QR Protocol" className="w-full h-full object-contain" />
                                                <div className="absolute inset-0 border-[12px] border-white rounded-[2.5rem]" />
                                            </div>

                                            {/* 🧬 SOVEREIGN DIRECTIONS: Step-by-Step for High Conversion */}
                                            <div className="grid grid-cols-3 gap-4 pt-4 px-8">
                                                {[
                                                   { step: 1, label: isSpanish ? 'ESCANEAR' : 'SCAN' },
                                                   { step: 2, label: isSpanish ? 'CONFIRMAR' : 'SEND' },
                                                   { step: 3, label: isSpanish ? 'ESPERAR' : 'WAIT' }
                                                ].map((d) => (
                                                   <div key={d.step} className="flex flex-col items-center gap-2">
                                                      <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-[#00f0ff]">{d.step}</div>
                                                      <span className="text-[7px] font-black uppercase tracking-widest text-white/40">{d.label}</span>
                                                   </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex flex-col items-center gap-4 pt-6">
                                    <button 
                                       onClick={() => {
                                          if (pollingRef.current) clearInterval(pollingRef.current);
                                          setUniqueRef(null);
                                          setView('options');
                                       }}
                                       className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-red-500 transition-all group flex items-center gap-2"
                                    >
                                       <span>{isSpanish ? 'CANCELAR Y REINICIAR' : 'CANCEL & START NEW'}</span>
                                    </button>
                                    <button onClick={() => setView('options')} className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00f0ff] italic hover:text-white transition-all hover:scale-105">{isSpanish ? '← VOLVER' : '← RETURN'}</button>
                                </div>
                            </div>
                        )}

                        {view === 'success' && (
                             <div className="py-24 flex flex-col items-center justify-center text-center gap-10 animate-in zoom-in duration-1000">
                                <div className="w-28 h-28 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_100px_rgba(16,185,129,0.3)] animate-pulse"><CheckCircle2 size={56} className="text-emerald-500" /></div>
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-syncopate font-black uppercase italic text-white tracking-tighter leading-none shrink-0">
                                        {isSpanish ? 'DEPOSITO CONFIRMADO' : 'DEPOSIT CONFIRMED'}
                                    </h3>
                                    <p className="text-[12px] text-white/60 uppercase tracking-[0.4em] font-black italic">
                                        {p2pAsset === 'SOL' ? `${targetSol} SOL` : p2pAsset === 'USDC' ? `$${targetUsd} USDC` : 'STRIPE TRANSFER'} {isSpanish ? 'RECIBIDO' : 'RECEIVED'}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4 w-full px-12">
                                    <button 
                                        onClick={onClose} 
                                        className="w-full py-6 rounded-[2.5rem] bg-white text-black font-black uppercase text-[13px] tracking-[0.3em] hover:scale-[1.05] active:scale-95 transition-all shadow-white/20 shadow-2xl"
                                    >
                                        {isSpanish ? 'VOLVER AL TERMINAL' : 'RETURN TO TERMINAL'}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setView('options');
                                            setIsPolling(false);
                                        }} 
                                        className="w-full py-4 rounded-[2rem] bg-white/5 text-white/40 border border-white/10 font-black uppercase text-[10px] tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        {isSpanish ? 'HACER OTRO DEPOSITO' : 'MAKE ANOTHER DEPOSIT'}
                                    </button>
                                </div>
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
