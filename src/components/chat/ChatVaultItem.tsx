'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, Zap, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface ChatVaultItemProps {
    mediaId: string;
    isUnlocked: boolean;
    mediaUrl?: string;
    caption?: string;
    onUnlockRequest: (mediaId: string) => void;
}

export default function ChatVaultItem({ 
    mediaId, 
    isUnlocked, 
    mediaUrl, 
    caption,
    onUnlockRequest 
}: ChatVaultItemProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="my-6 max-w-[280px] aspect-[3/4] rounded-[2rem] overflow-hidden border border-white/10 bg-black/40 relative group shadow-2xl"
        >
            <AnimatePresence mode="wait">
                {!isUnlocked ? (
                    <motion.div 
                        key="locked"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                        className="absolute inset-0 z-10"
                    >
                        <Image 
                            src={mediaUrl || "/v6.png"} 
                            alt="" 
                            fill 
                            unoptimized
                            className="object-cover blur-[50px] scale-125 grayscale opacity-40" 
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/40 backdrop-blur-sm">
                            <motion.div 
                                animate={{ scale: [1, 1.1, 1] }} 
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-12 h-12 rounded-2xl bg-[#ff00ff]/10 border border-[#ff00ff]/30 flex items-center justify-center mb-4"
                            >
                                <Lock size={20} className="text-[#ff00ff]" />
                            </motion.div>
                            
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff00ff] mb-1">Encrypted Visual</h4>
                            <p className="text-[9px] text-white/20 mb-6 lowercase italic">exclusive content shared</p>
                            
                            <button 
                                onClick={() => onUnlockRequest(mediaId)}
                                className="w-full py-3 bg-[#ff00ff] text-black rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,0,255,0.3)] hover:scale-105 active:scale-95 transition-all"
                            >
                                Unlock <Eye size={14} />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="unlocked"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 z-0"
                    >
                        <Image 
                            src={mediaUrl || "/v1.png"} 
                            alt="" 
                            fill 
                            unoptimized
                            className="object-cover animate-in fade-in zoom-in-95 duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-[#00f0ff]" />
                                <span className="text-[9px] font-black uppercase text-white/80 tracking-widest">Vault Unlocked</span>
                            </div>
                            <span className="text-[8px] text-white/30 uppercase tracking-[0.2em]">Saved to Collection</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="absolute top-4 right-4 z-20">
                <div className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center">
                    <Zap size={14} className={isUnlocked ? "text-[#ffea00] fill-current" : "text-white/20"} />
                </div>
            </div>
        </motion.div>
    );
}



