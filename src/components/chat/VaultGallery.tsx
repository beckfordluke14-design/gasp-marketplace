'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type VaultItem } from '@/lib/profiles';
import { Lock, Eye, Zap, CheckCircle2, Play } from 'lucide-react';
import Image from 'next/image';

interface VaultGalleryProps {
    items: VaultItem[];
    userBalance: number;
    onUnlock: (itemId: string) => Promise<boolean>;
}

export default function VaultGallery({ items, userBalance, onUnlock }: VaultGalleryProps) {
    const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
    const [unlockingId, setUnlockingId] = useState<string | null>(null);

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
                                    
                                    {/* Glass Overlay */}
                                    <div className="absolute inset-x-4 top-4 bottom-4 glass-vault rounded-[2rem] flex flex-col items-center justify-center text-center p-6 border border-white/10 backdrop-blur-md shadow-3xl">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                                            <Lock size={24} className="text-white/40" />
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 mb-2">Private Vault Content</h4>
                                            <div className="flex items-center justify-center gap-3 py-4">
                                                <Zap size={18} className="text-gasp-neon" />
                                                <span className="text-2xl font-outfit font-black tracking-tighter italic">{item.price} <span className="text-[10px] uppercase tracking-widest text-white/20 not-italic ml-2">Credits</span></span>
                                            </div>
                                            
                                            <button 
                                                onClick={() => handleUnlockRequest(item)}
                                                disabled={isUnlocking || !canAfford}
                                                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-outfit font-black uppercase text-[10px] tracking-[0.2em] transition-all transform active:scale-95 ${
                                                    canAfford 
                                                    ? 'bg-gasp-neon text-black shadow-[0_0_40px_rgba(0,240,255,0.3)] hover:scale-[1.02]' 
                                                    : 'bg-white/5 text-white/20 cursor-not-allowed grayscale'
                                                }`}
                                            >
                                                {isUnlocking ? (
                                                    <span className="flex gap-1">
                                                        <span className="w-1 h-1 bg-black rounded-full animate-bounce" />
                                                        <span className="w-1 h-1 bg-black rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                        <span className="w-1 h-1 bg-black rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                    </span>
                                                ) : (
                                                    <>UNMUTE FEED <Eye size={16} /></>
                                                )}
                                            </button>
                                            
                                            {!canAfford && (
                                                <p className="text-[8px] uppercase font-black tracking-widest text-neon-pink/60 mt-4 animate-pulse">Insufficient Balance</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="unlocked"
                                    initial={{ opacity: 0, scale: 1.2 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative w-full h-full"
                                >
                                    <Image src={item.full_url} alt="" fill unoptimized className="object-cover" />
                                    {item.type === 'video' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-all">
                                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                                                <Play size={24} className="text-white fill-current" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
                                        <p className="text-[10px] font-medium leading-tight lowercase italic text-white/80">"{item.caption}"</p>
                                    </div>
                                    <div className="absolute top-6 right-6">
                                         <div className="px-3 py-1 bg-gasp-neon/20 border border-gasp-neon/40 rounded-lg flex items-center gap-2">
                                            <CheckCircle2 size={12} className="text-gasp-neon" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-gasp-neon">Unlocked</span>
                                         </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
            
            <style jsx>{`
                .glass-vault {
                    background: rgba(255, 255, 255, 0.02);
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
                }
            `}</style>
        </div>
    );
}



