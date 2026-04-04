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
    const [p2pAsset, setP2pAsset] = useState<'USDC' | 'SOL'>('USDC');
    const [uniqueRef, setUniqueRef] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [txSignature, setTxSignature] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
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
                            setView('p2p');
                            startPolling(data.session.reference);
                        }
                    })
                    .catch(() => {});
            }
        }
    }, [userId]);

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
            popular: p.isPopular || idx === 2,
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
                window.location.href = data.redirectUrl;
            } else {
                throw new Error(data.error || 'Fault');
            }
        } catch (err: any) {
            console.error('[TopUp] Stripe session failed:', err);
            alert(`Stripe Error: ${err.message || 'System Fault'}. Use P2P rail for instant settlement.`);
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
        // On desktop: try opening in a new tab so the wallet extension can intercept
        // On mobile: navigate directly to trigger the wallet app deep link
        if (isMobile) {
            window.location.href = url;
        } else {
            window.open(url, '_blank');
        }
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
            const cleanSol = (baseUsd / (solPrice || 79.19)) + dust;
            params.append('amount', cleanSol.toFixed(9));
        }

        if (uniqueRef) {
            params.append('reference', uniqueRef);
            // 🛡️ SOVEREIGN MEMO: Embed the session ID directly into the blockchain metadata
            params.append('memo', `GASP:REF:${uniqueRef.slice(0, 8)}`);
        }
        params.append('label', 'GASP Hub');
        params.append('message', `SECURE_SETTLE_${uniqueRef?.slice(0, 4)}`);
        
        return `solana:${SYNDICATE_TREASURY_SOL}?${params.toString()}`;
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
                    
                    <div className="p-10 pb-6 flex items-center justify-between shrink-0">
                        <div className="flex flex-col gap-1.5 text-left">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#00f0ff] italic">{isSpanish ? 'SISTEMA DE CRÉDITOS' : 'CREDIT SYSTEM'}</span>
                            <h2 className="text-3xl font-syncopate font-black uppercase italic text-white leading-none tracking-tighter">{isSpanish ? 'COMPRAR CRÉDITOS' : 'BUY CREDITS'}</h2>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"><X size={24} /></button>
                    </div>

                    <div className="flex-1 p-10 pt-4 overflow-y-auto no-scrollbar pb-12">
                        {view === 'options' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div onClick={() => setIsCustom(!isCustom)} className={`relative p-8 rounded-[2.5rem] border transition-all duration-700 cursor-pointer group overflow-hidden ${isCustom ? 'bg-[#00f0ff]/5 border-[#00f0ff]/60 shadow-[0_0_80px_rgba(0,240,255,0.15)] ring-1 ring-[#00f0ff]/30' : 'bg-white/[0.02] border-white/10 opacity-60'}`}>
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] font-syncopate italic flex items-center gap-3 transition-all duration-500 ${isCustom ? 'bg-[#00f0ff] text-black shadow-[0_0_30px_#00f0ff]' : 'bg-[#00f0ff] text-black animate-pulse shadow-[0_0_20px_#00f0ff] ring-4 ring-[#00f0ff]/20'}`}>
                                            {isCustom ? (isSpanish ? 'ACTIVO' : 'OVERRIDE ACTIVE') : (isSpanish ? 'HABILITAR' : 'CLICK TO ACTIVATE')}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-6 relative z-10 text-left">
                                        <div className="flex flex-col gap-1.5"><span className="text-[10px] font-black uppercase text-[#00f0ff] tracking-[0.4em] italic leading-none">{isSpanish ? 'MONTO PERSONALIZADO' : 'SET CUSTOM AMOUNT'}</span></div>
                                        <div className="flex flex-row items-center gap-8 py-4">
                                            <div className="flex-1 w-full space-y-3">
                                                <div className="flex items-baseline justify-between px-2"><span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isSpanish ? 'MONTO USD' : 'SETTLEMENT USD'}</span><span className="text-[8px] font-black text-red-500/60 uppercase tracking-widest">LIMIT: $30,000</span></div>
                                                <div className={`flex items-center gap-4 bg-black/60 border rounded-[1.5rem] p-6 transition-all duration-500 ${isCustom ? 'border-[#00f0ff]/40 ring-1 ring-[#00f0ff]/20' : 'border-white/5 opacity-30 grayscale'}`}>
                                                    <span className={`text-4xl font-syncopate font-black italic ${isCustom ? 'text-[#00f0ff]' : 'text-white/20'}`}>$</span>
                                                    <input disabled={!isCustom} type="number" value={customAmount} onClick={(e) => e.stopPropagation()} onChange={(e) => setCustomAmount(Math.min(30000, parseFloat(e.target.value) || 0).toString())} className="bg-transparent border-none outline-none text-4xl font-syncopate font-black italic text-white w-full placeholder:text-white/5" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-700 ${isCustom ? 'opacity-10 pointer-events-none' : ''}`}>
                                    {packages.map((pkg) => (
                                        <button key={pkg.id} onClick={() => { setSelectedPkgId(pkg.id); setIsCustom(false); }} className={`relative p-6 rounded-[2rem] border transition-all duration-300 flex items-center justify-between group overflow-hidden ${selectedPkgId === pkg.id ? 'bg-white/5 border-white/30 scale-[1.02]' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
                                            {selectedPkgId === pkg.id && <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ backgroundColor: pkg.color }} />}
                                            <div className="flex flex-col gap-1 text-left relative z-10"><span className="text-[9px] font-black uppercase tracking-widest text-white/30 font-syncopate italic">{pkg.label}</span><div className="flex items-center gap-2"><span className="text-2xl font-syncopate font-black text-white italic tracking-tighter">{pkg.credits > 100000 ? (pkg.credits/1000).toFixed(0) + 'K' : pkg.credits.toLocaleString()}</span><span className="text-[10px] font-black text-white/40 uppercase tracking-tighter mt-1">CR</span></div></div>
                                            <div className="flex flex-col items-end relative z-10"><span className="text-2xl font-black text-white italic tracking-tighter">${pkg.price.toFixed(0)}</span></div>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-6 text-center">
                                    <button onClick={handleStripeCheckout} disabled={isLoading} className="w-full h-28 rounded-[3rem] bg-white text-black font-black uppercase text-[14px] tracking-[0.2em] transition-all shadow-[0_20px_100px_rgba(255,255,255,0.2)] flex items-center justify-center gap-6 group hover:scale-[1.02] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 px-5 py-2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-pulse">
                                            {isSpanish ? 'LO MÁS FÁCIL' : 'RECOMMENDED'}
                                        </div>
                                        {isLoading ? <Loader2 size={36} className="animate-spin text-black" /> : <CreditCard size={36} fill="black" />}
                                        <div className="flex flex-col items-start leading-none gap-2.5 pt-1">
                                            <span className="font-syncopate italic tracking-tighter text-xl">{isSpanish ? 'COMPRAR CON TARJETA' : 'BUY WITH CARD'}</span>
                                            <span className="text-[10px] opacity-60 font-bold tracking-widest text-left">
                                                {isSpanish ? '¿No tienes cripto? Compra al instante con tu tarjeta.' : 'No crypto? Buy it instantly with your card.'}
                                            </span>
                                        </div>
                                        {!isLoading && <ArrowRight size={28} className="opacity-40 group-hover:translate-x-3 transition-transform" />}
                                    </button>
                                </div>

                                {solanaAddress ? (
                                    <button onClick={handleSwitchToP2P} className="w-full py-8 rounded-[2.5rem] bg-[#00f0ff]/10 border border-[#00f0ff]/40 hover:bg-[#00f0ff]/20 transition-all flex items-center justify-center gap-6 group relative">
                                        <div className="absolute top-0 right-0 px-3 py-1 bg-[#00f0ff] text-black text-[7px] font-black uppercase tracking-widest rounded-bl-xl shadow-[0_0_20px_#00f0ff]">{isSpanish ? 'BILLETERA CONECTADA' : 'CONNECTED WALLET'}</div>
                                        <Wallet size={28} className="text-[#00f0ff]" />
                                        <div className="flex flex-col items-start leading-none gap-2 text-left"><span className="text-[11px] font-black text-white uppercase tracking-widest font-syncopate italic">{isSpanish ? 'PAGAR AHORA CON CRIPTO' : 'PAY NOW WITH CRYPTO'}</span><span className="text-[8px] font-black text-[#00f0ff] uppercase tracking-[0.5em] italic">{solanaAddress.slice(0, 4)}...{solanaAddress.slice(-4)} // ONE-CLICK</span></div>
                                    </button>
                                ) : (
                                    <button onClick={handleSwitchToP2P} className="w-full py-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-[#00f0ff]/40 transition-all flex items-center justify-center gap-6 group relative overflow-hidden">
                                        <QrCode size={28} className="text-[#00f0ff]" />
                                        <div className="flex flex-col items-start leading-none gap-2 text-left"><span className="text-[11px] font-black text-white uppercase tracking-widest font-syncopate italic">{isSpanish ? 'PAGAR CON SOLANA / USDC' : 'PAY WITH SOLANA / USDC'}</span><span className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em] italic">{isSpanish ? 'Transferencia P2P Directa' : 'Direct P2P Transfer'}</span></div>
                                    </button>
                                )}
                            </div>
                        )}

                        {view === 'p2p' && (
                            <div className="space-y-10 animate-in fade-in zoom-in duration-700 text-center py-4">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 relative">
                                        <QrCode size={32} className="text-[#00f0ff]" />
                                        {isPolling && <div className="absolute inset-0 border-2 border-[#00f0ff] border-t-transparent animate-spin rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.4)]" />}
                                    </div>
                                    <h3 className="text-xl font-syncopate font-black uppercase italic text-white tracking-tighter leading-none">{isPolling ? (isSpanish ? 'ESPERANDO PAGO...' : 'WAITING FOR SYNC...') : (isSpanish ? 'LIQUIDACIÓN P2P' : 'P2P SETTLEMENT')}</h3>
                                    
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex flex-col items-center gap-1.5 px-6 py-4 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-[1.5rem] shadow-[0_0_40px_rgba(0,240,255,0.1)]">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-pulse shadow-[0_0_8px_#00f0ff]" />
                                                <span className="text-[12px] font-syncopate font-black text-white italic tracking-tighter">
                                                    {p2pAsset === 'SOL' ? `${targetSol} SOL` : `$${parseFloat(targetUsd.toString()).toFixed(2)} USDC`}
                                                </span>
                                            </div>
                                            <div className="h-px w-full bg-white/10" />
                                            <div className="flex flex-col items-center">
                                                <span className="text-[7.5px] font-black text-[#00f0ff] uppercase tracking-[0.2em] italic">{isSpanish ? 'TASA DE CONVERSIÓN ACTUAL' : 'CURRENT CONVERSION RATE'}</span>
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1">
                                                    {p2pAsset === 'SOL' ? (solPrice > 0 ? `1 SOL = $${solPrice.toFixed(2)}` : 'ORACLE SYNCING...') : '1 USDC = $1.00'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-white/40 leading-relaxed max-w-[280px] mx-auto font-black uppercase tracking-widest italic">{isPolling ? (isSpanish ? 'VERIFICANDO TRANSACCIÓN...' : 'VERIFYING TRANSACTION...') : `Enviar ${p2pAsset === 'SOL' ? targetSol : targetUsd} ${p2pAsset} a la dirección.`}</p>
                                    
                                    {/* 🚩 CRITICAL USER GUIDANCE */}
                                    {isPolling && (
                                        <div className="mx-auto max-w-[320px] p-4 bg-red-500/10 border border-red-500/40 rounded-2xl animate-pulse">
                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-normal">
                                                {isSpanish ? '¡NO CIERRE ESTA VENTANA!' : 'DO NOT CLOSE THIS WINDOW!'} <br/>
                                                <span className="text-white/60 opacity-60">
                                                    {isSpanish ? 'Esperando confirmación de la red...' : 'Waiting for network nodes to confirm...'}
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {isMobile ? (
                                        <div className="py-2 space-y-6">
                                            <button onClick={handleSolanaPayDeepLink} className="w-full h-24 rounded-[3rem] bg-[#00f0ff] text-black font-black uppercase text-[15px] tracking-[0.2em] shadow-[0_20px_80px_rgba(0,240,255,0.4)] flex items-center justify-center gap-6 group hover:scale-[1.02] active:scale-95 transition-all">
                                               <Smartphone size={32} />
                                               <div className="flex flex-col items-start leading-none gap-1.5 pt-1">
                                                   <span className="font-syncopate italic tracking-tighter">{isSpanish ? 'ABRIR BILLETERA' : 'OPEN PHANTOM WALLET'}</span>
                                                   <span className="text-[8px] font-bold opacity-60 tracking-widest">{isSpanish ? 'AUTO-CONECTAR APLICACIÓN' : 'AUTO-CONNECT APP'}</span>
                                               </div>
                                            </button>
                                            <div className="p-4 bg-white rounded-3xl w-44 h-44 mx-auto"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(solanaPayUrl)}`} className="w-full h-full object-contain" /></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {wallets && wallets.length > 0 && (
                                                <button onClick={handleDirectPayment} disabled={isLoading} className="w-full h-24 rounded-[3rem] bg-[#00f0ff] text-black font-black uppercase text-[15px] tracking-[0.2em] shadow-[0_20px_100px_rgba(0,240,255,0.4)] flex items-center justify-center gap-6 group hover:scale-[1.02] active:scale-95 transition-all">
                                                    {isLoading ? <Loader2 size={32} className="animate-spin" /> : <Wallet size={32} />}
                                                    <div className="flex flex-col items-start leading-none gap-1.5 pt-1">
                                                        <span className="font-syncopate italic tracking-tighter">{isSpanish ? 'PAGAR AHORA' : 'PAY NOW'}</span>
                                                        <span className="text-[8px] font-bold opacity-60 tracking-widest">{isSpanish ? 'CONFIRMAR EN BILLETERA' : 'CONFIRM IN WALLET'}</span>
                                                    </div>
                                                </button>
                                            )}
                                            <div className="relative p-8 bg-white rounded-[3rem] w-72 h-72 mx-auto shadow-[0_0_100px_rgba(255,255,255,0.1)] ring-8 ring-white/5 group">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(solanaPayUrl)}`} alt="QR Protocol" className="w-full h-full object-contain" />
                                                <div className="absolute inset-0 border-[16px] border-white rounded-[3rem]" />
                                            </div>
                                        </div>
                                    )}

                                    {/* 🛠️ MANUAL SUPPORT TRACE */}
                                    <div className="mx-auto max-w-[340px] p-6 bg-black/40 border border-white/5 rounded-3xl text-left space-y-4">
                                        <div className="flex items-center gap-3"><AlertCircle size={14} className="text-[#00f0ff]" /><span className="text-[9px] font-black uppercase text-[#00f0ff] tracking-widest">{isSpanish ? 'DATOS DE SOPORTE' : 'MANUAL SUPPORT METADATA'}</span></div>
                                        <div className="space-y-2">
                                            <div className="flex flex-col"><span className="text-[7px] text-white/20 uppercase font-bold">REF:</span><span className="text-[10px] font-mono text-white/60 break-all">{uniqueRef || 'GENERATING...'}</span></div>
                                            <div className="flex flex-col"><span className="text-[7px] text-white/20 uppercase font-bold">VAULT:</span><span className="text-[10px] font-mono text-white/60 break-all">{SYNDICATE_TREASURY_SOL}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-6 py-4">
                                    <div className="flex items-center justify-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                                        <button onClick={() => setP2pAsset('USDC')} className={`px-8 py-3 rounded-xl flex items-center gap-2 border transition-all ${p2pAsset === 'USDC' ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.2)]' : 'bg-white/5 border-white/10 text-white/40'}`}><span className="text-[10px] font-black tracking-widest">USDC</span></button>
                                        <button onClick={() => setP2pAsset('SOL')} className={`px-8 py-3 rounded-xl flex items-center gap-2 border transition-all ${p2pAsset === 'SOL' ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.2)]' : 'bg-white/5 border-white/10 text-white/40'}`}><span className="text-[10px] font-black tracking-widest">SOL</span></button>
                                    </div>
                                    <button onClick={() => setView('options')} className="text-[11px] font-black uppercase tracking-[0.4em] text-[#00f0ff] italic hover:text-white transition-all hover:scale-105">{isSpanish ? '← VOLVER A OPCIONES' : '← RETURN TO OPTIONS'}</button>
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
