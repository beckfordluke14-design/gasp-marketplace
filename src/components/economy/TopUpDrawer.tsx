'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ShieldCheck, CreditCard, QrCode, ArrowRight, CheckCircle2, AlertCircle, Copy, Check, Loader2, Coins, Wallet, Smartphone } from 'lucide-react';
import { CREDIT_PACKAGES, SYNDICATE_TREASURY_SOL } from '@/lib/economy/constants';
import { useUser } from '../providers/UserProvider';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { SYNDICATE_CONFIG } from '@/lib/economy/monetizationConfig';


interface TopUpDrawerProps {
  isOpen?: boolean;
  onClose: () => void;
  initialPackage?: string;
  userId?: string;
}

/**
 * ⛽ SOVEREIGN REVENUE TERMINAL v15.1 // DUMMY-PROOF RELEASE
 * 100% Blatant Language. 100% Functional Onramps.
 */
export default function TopUpDrawer({ isOpen = true, onClose, initialPackage, userId: propUserId }: TopUpDrawerProps) {
    const { user } = usePrivy();
    const { wallets } = useWallets();
    const { profile } = useUser();
    
    const [selectedPkgId, setSelectedPkgId] = useState(initialPackage || CREDIT_PACKAGES[0].id);
    
    useEffect(() => {
        if (initialPackage) {
            setSelectedPkgId(initialPackage);
            setIsCustom(false);
        }
    }, [initialPackage, isOpen]);

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
    const [expiryTime, setExpiryTime] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isCheckoutPending, setIsCheckoutPending] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
            const guestId = localStorage.getItem('gasp_guest_id') || 'anon';
            if (!userId) setUserId(guestId);
        }
    }, [userId]);

    useEffect(() => {
        if (!expiryTime || view !== 'p2p') return;
        const tick = () => {
            const now = new Date().getTime();
            const end = new Date(expiryTime).getTime();
            const diff = end - now;
            if (diff <= 0) { setTimeLeft('00:00'); return; }
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
            if (data.success && data.price) setSolPrice(data.price);
        } catch (e) { console.error('[Oracle Sync Lag]:', e); }
    };

    useEffect(() => {
        fetchLivePrice();
        const interval = setInterval(fetchLivePrice, 30000); 
        return () => clearInterval(interval);
    }, []);

    const packages = CREDIT_PACKAGES.map((p) => {
        let label = p.label;
        let color = '#00f0ff';
        if (p.priceUsd >= 999) { color = '#ff00ff'; label = isSpanish ? 'Maestro' : 'Master'; }
        else if (p.priceUsd >= 99) { color = '#ffea00'; label = isSpanish ? 'Ballena' : 'Whale'; }
        return { id: p.id, credits: p.credits, price: p.priceUsd, label: label, popular: p.isPopular || false, color: color };
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
            
            if (data.success && data.redirectUrl) {
                // 🛡️ POP-UP BYPASS: Direct redirect is safer for mobile & conversion
                window.location.href = data.redirectUrl;
                setIsCheckoutPending(true);
            } else {
                alert(`Stripe Gateway Error: ${data.error || 'Unknown Fail'}`);
                setIsLoading(false);
            }
        } catch (err: any) {
            console.error('[TopUp] Stripe session failed:', err);
            alert('Stripe Bridge Offline. Use P2P for instant settlement.');
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

    const handleSwitchToP2P = async () => {
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
            setExpiryTime(new Date(Date.now() + 3600000).toISOString());
            setView('p2p');
            startPolling(data.reference);

            if (isMobile) {
                setTimeout(() => { window.location.href = buildSolanaPayUrl(); }, 800);
            }
        } catch (err) { console.error('[P2P] Session creation failed:', err); }
    };

    const buildSolanaPayUrl = () => {
        const params = new URLSearchParams();
        const baseUsd = parseFloat(targetUsd.toString()) || 4.99;
        const dust = (Math.floor(Math.random() * 900) + 100) / 100000000;
        if (p2pAsset === 'USDC') {
            params.append('amount', (baseUsd + dust).toFixed(6));
            params.append('spl-token', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
        } else {
            params.append('amount', ((baseUsd / resolvedSolPrice) + dust).toFixed(9));
        }
        if (uniqueRef) {
            params.append('reference', uniqueRef);
            params.append('memo', `GASP:REF:${uniqueRef.slice(0, 8)}`);
        }
        params.append('label', 'GASP Hub');
        params.append('message', `SECURE_SETTLE_${uniqueRef?.slice(0, 4)}`);
        return `solana:${SYNDICATE_TREASURY_SOL}?${params.toString()}`;
    };

    const solanaPayUrl = buildSolanaPayUrl();

    if (!isOpen) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[20000] flex items-center justify-center p-4 selection:bg-[#00f0ff]/30 text-white">
                <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={onClose} />
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[3.5rem] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh]">
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-60" />
                    
                    <div className="p-8 pb-4 flex items-center justify-between">
                        <div className="flex flex-col gap-1 text-left">
                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ffea00] italic">SECURE ONRAMP</span>
                            <h2 className="text-3xl font-black uppercase italic text-white leading-none tracking-tighter tracking-widest">GET ACCESS</h2>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"><X size={20} /></button>
                    </div>

                    <div className="flex-1 p-8 pt-2 overflow-y-auto no-scrollbar pb-10">
                        {view === 'options' && (
                          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                             
                             {/* 🍼 STEP 1: AMOUNT */}
                             <div className="flex items-center gap-2 mb-2 px-4 text-left">
                                <span className="text-[8px] font-black text-[#00f0ff] tracking-[0.4em] uppercase italic">STEP 1: CHOOSE AMOUNT</span>
                                <div className="h-[1px] flex-1 bg-[#00f0ff]/10" />
                             </div>

                             {initialPackage ? (
                                <div className="p-8 rounded-[3rem] bg-[#ffea00]/5 border border-[#ffea00]/20 text-center space-y-2">
                                    <h3 className="text-3xl font-black italic uppercase text-white">{selectedPkg.credits.toLocaleString()} Credits</h3>
                                    <p className="text-2xl font-black text-white/40">${selectedPkg.price}</p>
                                </div>
                             ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {packages.map((pkg) => (
                                        <button key={pkg.id} onClick={() => setSelectedPkgId(pkg.id)} className={`relative p-5 rounded-[2rem] border transition-all duration-300 flex items-center justify-between group ${selectedPkgId === pkg.id ? 'bg-[#ff00ff]/5 border-[#ff00ff]/40 scale-[1.02]' : 'bg-black/40 border-white/5'}`}>
                                            <div className="flex flex-col gap-1 text-left">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-white/40 italic">{pkg.label}</span>
                                                <span className="text-2xl font-black text-white italic tracking-tighter">{(pkg.credits).toLocaleString()}</span>
                                                <span className="text-[7px] font-black text-[#00f0ff] uppercase tracking-tighter">+{(pkg.credits).toLocaleString()} $GASPai</span>
                                                <span className="text-[6px] font-bold text-[#ff00ff]/60 uppercase tracking-widest">WORKS FOR 100s OF GIRLS</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xl font-black text-white italic leading-none">${pkg.price.toFixed(0)}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                             )}

                             {/* 🍼 STEP 2: GATEWAY */}
                             <div className="flex items-center gap-2 mb-2 px-4 text-left">
                                <span className="text-[8px] font-black text-[#ff00ff] tracking-[0.4em] uppercase italic">STEP 2: CHOOSE GATEWAY</span>
                                <div className="h-[1px] flex-1 bg-[#ff00ff]/10" />
                             </div>

                             {isCheckoutPending ? (
                                <div className="p-8 rounded-[2rem] bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-center animate-pulse">
                                    <Loader2 size={32} className="animate-spin text-[#00f0ff] mx-auto mb-4" />
                                    <span className="text-base font-syncopate font-black uppercase italic text-white">Checkout Active</span>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2">Follow instructions in the new window.</p>
                                    <button onClick={() => setIsCheckoutPending(false)} className="text-[9px] font-black text-[#00f0ff] uppercase tracking-widest mt-4 underline">Return to options</button>
                                </div>
                             ) : (
                                <div className="space-y-4">
                                    <button onClick={handleStripeCheckout} className="w-full h-24 rounded-[3rem] bg-white text-black font-black uppercase text-[16px] tracking-[0.1em] transition-all flex items-center justify-center gap-5 shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:scale-[1.02]">
                                        <CreditCard size={28} fill="black" />
                                        <span className="italic text-2xl">PAY WITH CARD</span>
                                    </button>

                                    <button onClick={handleSwitchToP2P} className="w-full h-24 rounded-[2.5rem] bg-white/5 border border-[#00f0ff]/30 hover:border-[#00f0ff] transition-all flex items-center justify-center gap-5 group relative overflow-hidden">
                                        <QrCode size={28} className="text-[#00f0ff]" />
                                        <div className="flex flex-col items-start leading-none gap-2 text-left">
                                            <span className="text-[11px] font-black text-white uppercase tracking-widest font-syncopate italic">SOLANA / USDC (P2P)</span>
                                            <span className="text-[8px] font-black text-[#00f0ff]/60 uppercase tracking-[0.4em] italic leading-tight">DIRECT SETTLEMENT // INSTANT</span>
                                        </div>
                                    </button>

                                    {/* 🛡️ REVENUE SAFETY NET: The "Earn Free" Escape Hatch */}
                                    <div className="pt-4 flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-3 w-full px-8 py-4 bg-[#ffea00]/5 border border-[#ffea00]/20 rounded-2xl group cursor-pointer hover:bg-[#ffea00]/10 transition-all"
                                          onClick={() => { const tid = localStorage.getItem('gasp_guest_id') || 'G'; window.open(SYNDICATE_CONFIG.getSmartLink(tid), '_blank'); }}
                                        >
                                           <Zap size={14} className="text-[#ffea00] fill-[#ffea00]" />
                                           <span className="text-[10px] font-black text-white uppercase tracking-widest italic">{isSpanish ? 'OBTENER ACCESO GRATUITO' : 'EARN FREE ACCESS'}</span>
                                           <ArrowRight size={14} className="ml-auto text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                        </div>
                                        <span className="text-[7px] font-bold text-white/20 uppercase tracking-[0.4em]">Alternative Entry Node</span>
                                    </div>
                                </div>
                             )}
                          </div>
                        )}

                        {view === 'p2p' && (
                            <div className="space-y-6 animate-in fade-in zoom-in duration-700 text-center py-4">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto relative">
                                    <QrCode size={32} className="text-[#00f0ff]" />
                                    {isPolling && <div className="absolute inset-0 border-2 border-[#00f0ff] border-t-transparent animate-spin rounded-2xl" />}
                                </div>
                                <h3 className="text-xl font-syncopate font-black uppercase italic text-white tracking-tighter leading-none">{isPolling ? 'VERIFYING...' : 'P2P SETTLEMENT'}</h3>
                                
                                <div className="flex flex-col items-center gap-1 font-mono text-[#ffea00] py-4 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="text-2xl font-black">{p2pAsset === 'SOL' ? `${targetSol} SOL` : `$${targetUsd} USDC`}</span>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">EXPIRES IN: {timeLeft || '60:00'}</span>
                                </div>

                                <div className="space-y-6">
                                    <div className="relative p-6 bg-white rounded-[2.5rem] w-64 h-64 mx-auto shadow-2xl overflow-hidden group">
                                        <div className="absolute inset-0 bg-gray-100 animate-pulse group-hover:hidden" />
                                        <img 
                                          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(solanaPayUrl)}`} 
                                          className="relative z-10 w-full h-full object-contain transition-opacity duration-300"
                                          onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                                          style={{ opacity: 0 }}
                                        />
                                    </div>
                                    <button onClick={() => window.location.href = solanaPayUrl} className="w-full h-16 rounded-[2rem] bg-[#00f0ff] text-black font-black uppercase text-[12px] tracking-[0.3em] font-syncopate italic shadow-lg">OPEN WALLET</button>
                                    <button onClick={() => setView('options')} className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-4">← Back to Payment Options</button>
                                </div>
                            </div>
                        )}

                        {view === 'success' && (
                             <div className="py-24 flex flex-col items-center justify-center text-center gap-10">
                                <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-emerald-500/20 shadow-2xl"><CheckCircle2 size={48} className="text-emerald-500" /></div>
                                <h2 className="text-3xl font-syncopate font-black uppercase italic text-white tracking-tighter">DEPOSIT CONFIRMED</h2>
                                <button onClick={onClose} className="w-full py-6 rounded-[2.5rem] bg-white text-black font-black uppercase text-[13px] tracking-widest shadow-2xl">RETURN TO CHAT</button>
                             </div>
                        )}
                    </div>

                    <div className="p-8 pt-0 opacity-20 flex items-center gap-3 border-t border-white/5 mt-auto">
                        <ShieldCheck size={16} className="text-[#00f0ff]" />
                        <span className="text-[8px] font-black uppercase tracking-[0.5em]">SECURE SETTLEMENT TERMINAL</span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
