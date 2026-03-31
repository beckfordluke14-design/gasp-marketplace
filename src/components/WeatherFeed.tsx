'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Eye, RefreshCcw, Activity, AlertTriangle, Clock, Loader2, ShieldCheck, Flame, Share2 } from 'lucide-react';
import { useUser } from '@/components/providers/UserProvider';

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
    recommendedBucket?: string;
    currentTempStr?: string;
    recommendedPrice?: number;
    recommendedPriceStr?: string;
    fallbackPrice?: number;
    fallbackPriceStr?: string;
    isUnlockedByDB?: boolean;
    roiPct?: number;
}

export default function WeatherFeed({ onOpenTopUp }: { onOpenTopUp: () => void }) {
    const { profile, refreshProfile } = useUser();
    const [buckets, setBuckets] = useState<PolymarketEvent[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
    
    // Track previous prices to show red/green flash on live fluctuation
    const prevPricesRef = useRef<Record<string, number>>({});
    const [priceFlashes, setPriceFlashes] = useState<Record<string, 'up' | 'down' | null>>({});

    const fetchMarkets = async () => {
        try {
            // Fetch live polymarket active events via proxy
            const res = await fetch(`/api/weather?limit=20&userId=${profile?.id || ''}`);
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
                    endDate: ev.endDate || ev.closedTime || market.endDate,
                    recommendedBucket: ev.recommendedBucket,
                    currentTempStr: ev.currentTempStr,
                    recommendedPrice: ev.recommendedPrice,
                    recommendedPriceStr: ev.recommendedPriceStr,
                    isUnlockedByDB: ev.isUnlockedByDB,
                    roiPct: ev.roiPct,
                    fallbackPrice: ev.fallbackPrice,
                    fallbackPriceStr: ev.fallbackPriceStr
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

    const handleUnlock = async (b: PolymarketEvent) => {
        if (b.isFree || b.isUnlockedByDB) return;
        
        if (!profile) {
            onOpenTopUp(); // Fallback to login/topup
            return;
        }

        if ((profile?.credit_balance || 0) < b.unlockCost) {
            onOpenTopUp();
            return;
        }

        try {
            setIsPurchasing(b.id);
            const res = await fetch('/api/weather/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: profile.id,
                    eventId: b.id,
                    cost: b.unlockCost
                })
            });

            const data = await res.json();
            if (data.success) {
                await refreshProfile();
                await fetchMarkets(); // Refresh UI to show unlocked state
            } else {
                alert(data.error || 'Identity Sync Failed');
            }
        } catch (e) {
            console.error('Unlock error', e);
        } finally {
            setIsPurchasing(null);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto overflow-x-hidden scroll-smooth flex flex-col pt-20 px-4 md:px-8 pb-32 relative">
            
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

            {/* 🛰️ NEURAL SCANNER EMPTY STATE */}
            {buckets.length === 0 && !isFetching && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                >
                    <div className="max-w-xl w-full bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-xl relative overflow-hidden group">
                        {/* Recursive Scanning Visual */}
                        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 group-hover:opacity-20 transition-opacity" />
                        
                        <div className="relative z-10 flex flex-col items-center gap-8">
                            <div className="w-24 h-24 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center relative">
                                <Activity size={40} className="text-[#00f0ff] animate-pulse" />
                                <div className="absolute inset-0 rounded-full border-2 border-[#00f0ff]/20 animate-ping" />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-3xl font-syncopate font-black italic tracking-tighter uppercase text-white">
                                    Scanners <span className="text-[#00f0ff]">Active</span>
                                </h2>
                                <p className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] leading-loose">
                                    Our neural scanners are monitoring global temperature fluctuations. 
                                    no high-value anomalies detected in the current 24h window. 
                                </p>
                            </div>

                            <div className="flex flex-col items-center gap-4 pt-8 border-t border-white/5 w-full">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck size={16} className="text-green-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Handshake Verified // Global Stability</span>
                                </div>
                                <p className="text-[9px] text-white/20 italic uppercase tracking-widest">
                                    Check back hourly for fresh arbitrage signals
                                </p>
                                
                                <button 
                                    onClick={fetchMarkets}
                                    className="mt-4 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Force Deep Scan
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative">
                {buckets.map((bucket, i) => {
                    const isAccessible = bucket.isFree || bucket.isUnlockedByDB;
                    const flash = priceFlashes[bucket.id];
                    const priceFormatted = (bucket.price * 100).toFixed(1);

                    let expiringString = 'RESOLVES TODAY';
                    if (bucket.endDate) {
                        const date = new Date(bucket.endDate);
                        if (date.getTime() > Date.now() + 86400000) {
                            expiringString = `ENDS: ${date.toLocaleDateString()}`;
                        } else {
                            expiringString = 'RESOLVES TODAY';
                        }
                    }

                    const displayPrice = (bucket.recommendedPrice !== undefined && bucket.recommendedPrice !== null)
                        ? (bucket.recommendedPrice * 100).toFixed(1) 
                        : (bucket.fallbackPrice !== undefined && bucket.fallbackPrice !== null)
                            ? (bucket.fallbackPrice * 100).toFixed(1)
                            : (bucket.price * 100).toFixed(1);

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
                                     <div className="absolute inset-0 backdrop-blur-3xl bg-black/40 flex flex-col items-center justify-center z-30 transition-all duration-500 group-hover:bg-black/20 pb-4">
                                         
                                         {bucket.roiPct !== undefined && bucket.roiPct > 0 && (
                                             <div className="mb-6 flex flex-col items-center">
                                                 <span className="text-[7px] uppercase font-mono tracking-widest text-[#00f0ff]/60 mb-1">Classified Signal Strength</span>
                                                 <span className="text-2xl font-black italic tracking-tighter text-[#00f0ff] animate-pulse drop-shadow-[0_0_10px_#00f0ff]">
                                                     +{bucket.roiPct}% ROI TARGET
                                                 </span>
                                             </div>
                                         )}

                                         <Lock size={36} className="text-white/20 mb-3 drop-shadow-2xl" />
                                         <button 
                                             onClick={() => handleUnlock(bucket)}
                                             disabled={isPurchasing !== null}
                                             className="px-6 py-2.5 bg-white/10 hover:bg-[#00f0ff]/20 border border-white/20 hover:border-[#00f0ff]/50 rounded-full flex items-center gap-2 text-[10px] uppercase font-black tracking-widest transition-all text-white hover:text-[#00f0ff] shadow-2xl relative overflow-hidden"
                                         >
                                             {isPurchasing === bucket.id ? (
                                                 <Loader2 size={14} className="animate-spin" />
                                             ) : (
                                                 <Unlock size={14} />
                                             )}
                                             <span>DECODE NODE ({bucket.unlockCost} CR)</span>
                                             
                                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                         </button>
                                         <span className="text-[7px] text-white/30 uppercase tracking-[0.2em] font-mono mt-3">24H Intelligence Protocol Access</span>
                                     </div>
                                 )}
                            </div>

                            {/* Content Details */}
                            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between relative z-20 bg-black/80 backdrop-blur-xl">
                                
                                <div className={`text-[9px] uppercase font-mono tracking-widest font-black mb-3 flex items-center gap-2 ${expiringString === 'RESOLVES TODAY' ? 'text-[#00f0ff]' : 'text-[#ffea00]'}`}>
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
                                                    {isAccessible ? displayPrice : 'XX.X'}
                                                </span>
                                                <span className={`text-xl font-outfit font-black italic opacity-50 ${isAccessible ? 'text-white' : 'text-white/10'}`}>¢</span>
                                            </div>
                                        </div>
                                        
                                        <div className={`p-2 rounded-xl transition-all duration-300 ${isAccessible ? 'bg-white/5 border border-white/10' : 'bg-transparent border border-white/5'}`}>
                                            <Activity className={`${isAccessible ? flash === 'up' ? 'text-green-400' : flash === 'down' ? 'text-red-400' : 'text-[#00f0ff]' : 'text-white/10'}`} size={24} />
                                        </div>
                                    </div>
                                    
                                    {isAccessible && bucket.recommendedBucket && (
                                        <div className="mt-4 p-3 bg-gradient-to-t from-green-500/20 to-black/80 border border-green-500/40 rounded-xl relative overflow-hidden group/bucket shadow-[0_0_20px_rgba(0,255,0,0.1)]">
                                           <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
                                           <div className="relative z-10 flex flex-col gap-2">
                                              
                                              {/* Ground Source & Opportunity Header */}
                                              <div className="flex justify-between items-start">
                                                  <div className="flex flex-col">
                                                      <span className="text-[8px] uppercase font-mono tracking-widest text-[#00f0ff] mb-0.5 opacity-60">Live Ground Sensor</span>
                                                      <span className="text-[10px] uppercase font-mono font-black tracking-widest text-green-400 flex items-center gap-1">
                                                          <Activity size={10} className="animate-pulse" /> {bucket.currentTempStr}
                                                      </span>
                                                  </div>
                                                  
                                                  {bucket.roiPct !== undefined && bucket.roiPct > 0 && (
                                                      <div className="flex flex-col items-end">
                                                          <span className="text-[7px] uppercase font-mono tracking-widest text-green-400/50">Upside Margin</span>
                                                          <span className="text-[11px] font-black italic tracking-tighter text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                                                              +{bucket.roiPct}% ROI
                                                          </span>
                                                      </div>
                                                  )}
                                              </div>
                                              
                                              {/* Action Payload */}
                                              <div className="bg-black/40 border border-green-500/20 rounded p-2 mt-1 flex justify-between items-center backdrop-blur-md">
                                                 <div className="flex flex-col">
                                                     <span className="text-white/40 font-mono text-[7px] tracking-widest mb-0.5">TARGET BUCKET:</span>
                                                     <span className="text-xs uppercase font-black italic tracking-widest text-white">
                                                         {bucket.recommendedBucket}
                                                     </span>
                                                 </div>
                                                 
                                                 {bucket.recommendedPriceStr && (
                                                     <div className="flex flex-col items-end">
                                                         <span className="text-[7px] font-mono text-red-400/80 mb-0.5 line-through decoration-red-500/50">Market: 100¢</span>
                                                         <span className="text-green-400 font-mono text-[11px] font-bold bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                                                             BUY @ {bucket.recommendedPriceStr}¢
                                                         </span>
                                                     </div>
                                                 )}
                                              </div>
                                              
                                              {/* Temporal Warning */}
                                              <div className="text-[6px] text-white/30 font-mono text-center mt-1 uppercase tracking-widest">
                                                  // Confirm Peak Heating Time before snipe //
                                              </div>
                                           </div>
                                        </div>
                                    )}

                                    {/* 🛰️ VIRAL SHARE ENGINE */}
                                    <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const shareText = `🚨 [${bucket.city?.toUpperCase()} SIGNAL]: Live ground-sensor hit ${bucket.currentTempStr || 'anomaly'}. 🌪️ Mispriced bucket detected with +${bucket.roiPct || '350'}% ROI TARGET. \n\nDECODE THE SIGNAL: ${window.location.origin}\n\n#$GASPai #Arbitrage #Polymarket #WeatherX`;
                                                const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                                                window.open(xUrl, '_blank');
                                            }}
                                            className="flex-1 py-4 px-4 bg-white/5 hover:bg-[#00f0ff]/20 text-white/40 hover:text-[#00f0ff] rounded-2xl border border-white/10 hover:border-[#00f0ff]/40 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
                                        >
                                            <Share2 size={16} /> Share Intelligence
                                        </button>
                                        
                                        <div className="flex flex-col items-end opacity-20 hover:opacity-100 transition-opacity">
                                             <span className="text-[7px] font-mono text-white/40 uppercase tracking-widest mb-1">NODE_ID</span>
                                             <span className="text-[8px] font-mono text-white uppercase tracking-widest font-black">
                                                 {bucket.id.slice(0, 8)}
                                             </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            {/* 🛡️ INSTITUTIONAL RISK DISCLOSURE */}
            <footer className="mt-20 p-8 border border-white/5 rounded-[2rem] bg-black/40 backdrop-blur-3xl text-center">
                 <div className="flex flex-col items-center gap-4 max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 text-white/40 uppercase font-black text-[9px] tracking-[0.3em]">
                        <ShieldCheck size={14} className="text-[#00f0ff]" />
                        Intelligence Protocol Disclaimer
                    </div>
                    <p className="text-[9px] md:text-[10px] text-white/20 font-outfit uppercase tracking-widest leading-relaxed">
                        Risk Disclosure: All signals provided via the Weather X terminal are for informational and research purposes only. 
                        The Syndicate is not a financial advisor. Prediction market participation involves significant risk of loss. 
                        Users take full responsibility for all executions conducted based on terminal scanner scans. 
                        Handshake verified signals are not guarantees of future market outcomes.
                    </p>
                 </div>
            </footer>
        </div>
    );
}
