'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type VaultItem } from '@/lib/profiles';
import { Lock, Eye, Zap, CheckCircle2, Play, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface VaultGalleryProps {
    items: VaultItem[];
    userBalance: number;
    onUnlock: (itemId: string) => Promise<boolean>;
}

/**
 * 🛰️ SOVEREIGN VAULT GALLERY v9.0 // MULTI-LOCALE EXCLUSIVE HUB
 * Strategy: High-Margin Asset Access with 100% Bilingual Sync (EN/ES).
 */
export default function VaultGallery({ items, userBalance, onUnlock }: VaultGalleryProps) {
    const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
    const [unlockingId, setUnlockingId] = useState<string | null>(null);

    // 🌍 GLOBAL LOCALE STATE
    const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';

    const handleUnlockRequest = async (item: VaultItem) => {
        if (userBalance < item.price) return;
        
        setUnlockingId(item.id);
        const success = await onUnlock(item.id);
        
        if (success) {
            setUnlockedIds(prev => [...prev, item.id]);
        }
        setUnlockingId(null);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
            {items.map((item) => {
                const isUnlocked = unlockedIds.includes(item.id);
                const isUnlocking = unlockingId === item.id;
                const canAfford = userBalance >= item.price;

                return (
                    <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-white/5 bg-white/[0.02] group"
                    >
                        {/* THE MEDIA LAYER */}
                        <AnimatePresence mode="wait">
                            {!isUnlocked ? (
                                <motion.div 
                                    key="locked"
                                    initial={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    transition={{ duration: 0.8, ease: "circOut" }}
                                    className="relative w-full h-full"
                                >
                                    <Image src={item.blurred_url} alt="" fill unoptimized className="object-cover blur-2xl scale-110 grayscale opacity-40 transition-all duration-700 group-hover:blur-xl" />
                                    
                                    {/* Signal Scramble Overlay */}
                                    <div className="absolute inset-0 bg-[#ff00ff]/5 pointer-events-none mix-blend-overlay" />
                                    
                                    {/* Glass Overlay */}
                                    <div className="absolute inset-x-2 top-2 bottom-2 bg-black/60 backdrop-blur-3xl rounded-[2.2rem] flex flex-col items-center justify-center text-center p-6 border border-white/10 shadow-2xl overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ff00ff] to-transparent animate-scan" />
                                        
                                        <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform">
                                            <div className="absolute inset-0 bg-[#ff00ff]/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <Lock size={28} className="text-white/40 group-hover:text-white transition-colors z-10" />
                                        </div>
                                        
                                        <div className="space-y-4 relative z-10">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black uppercase text-[#ff00ff] tracking-[0.4em] mb-1 italic animate-pulse">
                                                    {isSpanish ? 'Nodo de Medios Restringido' : 'Restricted Media Node'}
                                                </span>
                                                <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">
                                                    {isSpanish ? 'Activo Visual de Alta Fidelidad' : 'High-Fidelity Visual Asset'}
                                                </h4>
                                            </div>

                                            <div className="flex items-center justify-center gap-3 py-6 border-y border-white/5 my-4">
                                                <Zap size={20} className="text-[#ffea00]" />
                                                <span className="text-4xl font-syncopate font-black tracking-tighter italic text-white">{item.price} <span className="text-[10px] uppercase font-outfit font-black tracking-widest text-white/20 not-italic ml-2">CR</span></span>
                                            </div>
                                            
                                            <button 
                                                onClick={() => handleUnlockRequest(item)}
                                                disabled={isUnlocking || !canAfford}
                                                className={`w-full h-16 rounded-2xl flex items-center justify-center gap-4 font-outfit font-black uppercase text-[12px] tracking-[0.25em] transition-all transform active:scale-95 ${
                                                    canAfford 
                                                    ? 'bg-white text-black shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:scale-[1.02]' 
                                                    : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                                                }`}
                                            >
                                                {isUnlocking ? (
                                                    <Loader2 size={24} className="animate-spin" />
                                                ) : (
                                                    <>{isSpanish ? 'DESPLEGAR ACCESO' : 'DEPLOY ACCESS'} <ArrowRight size={20} /></>
                                                )}
                                            </button>
                                            
                                            {!canAfford && (
                                                <p className="text-[8px] uppercase font-black tracking-widest text-[#ff00ff] mt-4 flex items-center justify-center gap-2">
                                                    <AlertCircle size={10} /> {isSpanish ? 'Créditos de Pulso Insuficientes' : 'Insufficient Pulse Credits'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="unlocked"
                                    initial={{ opacity: 0, scale: 1.2 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative w-full h-full select-none"
                                    onContextMenu={(e) => e.preventDefault()}
                                >
                                    <Image 
                                      src={item.full_url} 
                                      alt="Secure Asset" 
                                      fill 
                                      unoptimized 
                                      className="object-cover" 
                                      draggable={false}
                                    />
                                    
                                    {/* 🛡️ ANTI-DOWNLOAD SHIELD */}
                                    <div className="absolute inset-0 z-10 bg-transparent" />

                                    {item.type === 'video' && (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-all pointer-events-none">
                                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                                                <Play size={24} className="text-white fill-current" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl z-30">
                                        <p className="text-[10px] font-medium leading-tight lowercase italic text-white/80">"{item.caption}"</p>
                                    </div>
                                    <div className="absolute top-6 right-6 z-30">
                                         <div className="px-3 py-1 bg-[#ffea00]/20 border border-[#ffea00]/40 rounded-lg flex items-center gap-2">
                                            <CheckCircle2 size={12} className="text-[#ffea00]" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-[#ffea00]">
                                                {isSpanish ? 'Desbloqueado' : 'Unlocked'}
                                            </span>
                                         </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}
