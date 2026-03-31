'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Eye, RefreshCcw, Activity, AlertTriangle, Clock } from 'lucide-react';

interface PolymarketEvent {
    id: string;
    title: string;
    image: string;
    price: number;
    volume: number;
    description: string;
    isFree: boolean;
    unlockCost: number;
    endDate?: string;
}

export default function WeatherFeed({ onOpenTopUp }: { onOpenTopUp: () => void }) {
    const [buckets, setBuckets] = useState<PolymarketEvent[]>([]);
    const [unlockedBuckets, setUnlockedBuckets] = useState<Set<string>>(new Set());
    const [isFetching, setIsFetching] = useState(true);
    
    // Track previous prices to show red/green flash on live fluctuation
    const prevPricesRef = useRef<Record<string, number>>({});
    const [priceFlashes, setPriceFlashes] = useState<Record<string, 'up' | 'down' | null>>({});

    const fetchMarkets = async () => {
        try {
            // Fetch live polymarket active events via proxy
            const res = await fetch('/api/weather?limit=12&active=true&closed=false');
            if (!res.ok) return;
            const data = await res.json();
            
            const newBuckets: PolymarketEvent[] = [];
            
            data.forEach((ev: any, i: number) => {
                const market = ev.markets?.[0];
                if (!market || !market.outcomePrices || market.outcomePrices.length === 0) return;
                
                // Get the Yes price normally (or first available outcome price)
                let price = parseFloat(market.outcomePrices[0]);
                if (isNaN(price)) price = 0;
                
                newBuckets.push({
                    id: ev.id || `poly-${i}`,
                    title: ev.title,
                    image: ev.image || 'https://polymarket.com/favicon.ico',
                    price,
                    volume: parseInt(market.volume || '0', 10),
                    description: ev.description || '',
                    isFree: i < 2, // First 2 are free
                    unlockCost: 50 + (i * 25),
                    endDate: ev.endDate || ev.closedTime || market.endDate
                });
            });
            
            setBuckets(prev => {
                const newFlashes: Record<string, 'up' | 'down' | null> = {};
                
                // Compare and setup flashes
                newBuckets.forEach(b => {
                    const prevPrice = prevPricesRef.current[b.id];
                    if (prevPrice !== undefined) {
                        if (b.price > prevPrice) newFlashes[b.id] = 'up';
                        else if (b.price < prevPrice) newFlashes[b.id] = 'down';
                        else newFlashes[b.id] = null;
                    }
                    prevPricesRef.current[b.id] = b.price;
                });
                
                setPriceFlashes(newFlashes);
                
                // Clear flash after 1 second
                setTimeout(() => setPriceFlashes({}), 1500);
                
                return newBuckets;
            });
            setIsFetching(false);
        } catch (e) {
            console.error('Failed fetching Polymarket data', e);
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchMarkets();
        // Poll every 3 seconds for live streaming fluctuation
        const interval = setInterval(fetchMarkets, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleUnlock = (b: PolymarketEvent) => {
        if (b.isFree || unlockedBuckets.has(b.id)) return;
        onOpenTopUp();
    };

    return (
        <div className="h-full w-full overflow-y-auto overflow-x-hidden hide-scrollbar scroll-smooth flex flex-col pt-20 px-4 md:px-8 pb-32 relative">
            
            <header className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-outfit font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 flex items-center gap-4">
                        Weather <span className="text-[#00f0ff]">X</span> 
                    </h1>
                    <p className="text-white/40 text-[10px] md:text-xs font-mono mt-2 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={12} className="text-[#00f0ff] animate-pulse" /> 
                        Global Prediction Network & Live Intel
                    </p>
                </div>
                
                <div className="flex items-center gap-4 border border-white/10 bg-white/5 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] uppercase font-mono tracking-widest self-center md:self-end">
                     {isFetching ? <RefreshCcw size={14} className="animate-spin text-white/40" /> : <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#00ff00]" />}
                     <span className="text-white/40">Polymarket Data Sync</span>
                </div>
            </header>

            {buckets.length === 0 && !isFetching && (
                <div className="flex flex-col items-center justify-center py-20 text-white/30 gap-4">
                    <AlertTriangle size={32} />
                    <span className="text-xs uppercase tracking-widest font-black">Intel Feed Offline</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative">
                {buckets.map((bucket, i) => {
                    const isAccessible = bucket.isFree || unlockedBuckets.has(bucket.id);
                    const flash = priceFlashes[bucket.id];
                    const priceFormatted = (bucket.price * 100).toFixed(1);

                    let expiringString = '';
                    if (bucket.endDate) {
                        const date = new Date(bucket.endDate);
                        if (date.getTime() < Date.now()) {
                            expiringString = 'ALREADY ENDED';
                        } else {
                            expiringString = `ENDS: ${date.toLocaleDateString()}`;
                        }
                    } else {
                        expiringString = 'LIVE ONGOING';
                    }

                    return (
                        <motion.div
                            key={bucket.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`relative group bg-white/5 border rounded-[2rem] overflow-hidden transition-all duration-500 min-h-[350px] flex flex-col shadow-2xl ${flash === 'up' ? 'border-green-500 bg-green-500/10' : flash === 'down' ? 'border-red-500 bg-red-500/10' : 'border-white/10 hover:border-[#00f0ff]/50'}`}
                        >
                            {/* Bucket Status */}
                            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                                <div className={`px-3 py-1.5 text-[9px] uppercase font-black tracking-widest rounded-full flex items-center gap-2 backdrop-blur-xl border ${isAccessible ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/30' : 'bg-red-500/20 text-red-500 border-red-500/30'}`}>
                                    {isAccessible ? <div className={`w-1.5 h-1.5 rounded-full bg-[#00f0ff] ${isFetching ? '' : 'animate-pulse'}`} /> : <Lock size={10} />}
                                    {isAccessible ? 'LIVE TRACKING' : 'CLASSIFIED'}
                                </div>
                            </div>
                            
                            {bucket.volume > 0 && (
                                <div className="absolute top-4 right-4 z-20">
                                    <div className="px-3 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2 text-[8px] text-white/50 font-mono tracking-widest shadow-xl">
                                        <Eye size={10} /> ${(bucket.volume / 1000).toFixed(1)}K Vol
                                    </div>
                                </div>
                            )}

                            {/* Background Image / Abstract */}
                            <div className="h-40 relative flex items-center justify-center overflow-hidden border-b border-white/10">
                                 {bucket.image && (
                                      <img src={bucket.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-60 transition-opacity duration-1000 group-hover:scale-110" />
                                 )}
                                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                 <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
                                 
                                 {!isAccessible && (
                                     <div className="absolute inset-0 backdrop-blur-3xl bg-black/40 flex flex-col items-center justify-center z-30 transition-all duration-500 group-hover:bg-black/20">
                                        <Lock size={36} className="text-white/20 mb-3 drop-shadow-2xl" />
                                        <button 
                                            onClick={() => handleUnlock(bucket)}
                                            className="px-6 py-2.5 bg-white/10 hover:bg-[#00f0ff]/20 border border-white/20 hover:border-[#00f0ff]/50 rounded-full flex items-center gap-2 text-[10px] uppercase font-black tracking-widest transition-all text-white hover:text-[#00f0ff] shadow-2xl"
                                        >
                                            <Unlock size={14} /> Decode ({bucket.unlockCost} CR)
                                        </button>
                                     </div>
                                 )}
                            </div>

                            {/* Content Details */}
                            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between relative z-20 bg-black/80 backdrop-blur-xl">
                                
                                <div className={`text-[9px] uppercase font-mono tracking-widest font-black mb-3 flex items-center gap-2 ${expiringString === 'ALREADY ENDED' ? 'text-red-500' : 'text-[#ffea00]'}`}>
                                    <Clock size={10} /> {expiringString}
                                </div>

                                <h3 className="text-lg md:text-xl font-outfit font-black italic uppercase tracking-tighter leading-tight mb-4 drop-shadow-lg text-white/90">
                                    {bucket.title}
                                </h3>
                                
                                <div className="mt-auto">
                                    <div className="flex items-end justify-between border-t border-white/10 pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase font-mono tracking-widest text-white/40 mb-1">Live Probability</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-4xl font-outfit font-black italic tracking-tighter transition-colors duration-300 ${isAccessible ? flash === 'up' ? 'text-green-400 drop-shadow-[0_0_15px_rgba(0,255,0,0.5)]' : flash === 'down' ? 'text-red-400 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]' : 'text-white' : 'text-white/10'}`}>
                                                    {isAccessible ? priceFormatted : 'XX.X'}
                                                </span>
                                                <span className={`text-xl font-outfit font-black italic opacity-50 ${isAccessible ? 'text-white' : 'text-white/10'}`}>¢</span>
                                            </div>
                                        </div>
                                        
                                        <div className={`p-2 rounded-xl transition-all duration-300 ${isAccessible ? 'bg-white/5 border border-white/10' : 'bg-transparent border border-white/5'}`}>
                                            <Activity className={`${isAccessible ? flash === 'up' ? 'text-green-400' : flash === 'down' ? 'text-red-400' : 'text-[#00f0ff]' : 'text-white/10'}`} size={24} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
