'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Crown, X, Plus, Gift, Timer } from 'lucide-react';

interface TipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTip: (amount: number) => Promise<boolean>;
    userBalance: number;
    profileName: string;
}

export default function TipModal({ isOpen, onClose, onTip, userBalance, profileName }: TipModalProps) {
    const [selectedAmount, setSelectedAmount] = useState<number>(10);
    const [isProcessing, setIsProcessing] = useState(false);

    const tipOptions = [
        { label: 'Subtle Spark', amount: 10, icon: <Gift size={16} /> },
        { label: 'Priority Echo', amount: 20, icon: <Zap size={16} /> },
        { label: 'Whale Surge', amount: 50, icon: <Crown size={16} /> },
        { label: 'Supreme Synthesis', amount: 150, icon: <Crown size={20} /> },
    ];

    const handleSendGift = async () => {
        if (userBalance < selectedAmount) return;
        setIsProcessing(true);
        const success = await onTip(selectedAmount);
        if (success) onClose();
        setIsProcessing(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-3xl overflow-y-auto selection:bg-neon-purple selection:text-white">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 40 }}
                        className="w-full max-w-lg bg-obsidian-light border border-white/5 rounded-[4rem] p-10 md:p-14 shadow-5xl relative overflow-hidden"
                    >
                        {/* Header */}
                        <div className="absolute top-10 right-10 flex items-center gap-4">
                             <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                                <Zap size={12} className="text-neon-purple" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{userBalance} Credits</span>
                             </div>
                             <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                                <X size={20} className="text-white/20" />
                             </button>
                        </div>
                        
                        <div className="flex flex-col items-center gap-8 py-6 text-center">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center relative mb-4">
                                <Crown size={48} className="text-neon-purple drop-shadow-neon-purple" />
                                <div className="absolute inset-0 bg-neon-purple/5 blur-3xl -z-10" />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-4xl font-outfit font-black italic uppercase tracking-tighter leading-none">
                                    Priority <span className="text-neon-purple">Infusion</span>
                                </h2>
                                <p className="text-sm text-white/40 italic leading-relaxed px-6">
                                    Send a gift to <span className="text-white">{profileName}</span>. Priority messages bypass the agency buffer and trigger an immediate response.
                                </p>
                            </div>

                            {/* Gift Grid */}
                            <div className="grid grid-cols-2 gap-4 w-full pt-6">
                                {tipOptions.map((opt) => (
                                    <button 
                                        key={opt.amount}
                                        onClick={() => setSelectedAmount(opt.amount)}
                                        className={`p-6 rounded-3xl border text-left flex flex-col gap-3 transition-all relative overflow-hidden ${
                                            selectedAmount === opt.amount 
                                            ? 'bg-neon-purple/10 border-neon-purple shadow-[0_0_30px_rgba(188,19,254,0.1)]' 
                                            : 'bg-white/5 border-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        <div className={`p-2 w-fit rounded-lg ${selectedAmount === opt.amount ? 'text-neon-purple' : 'text-white/20'}`}>
                                            {opt.icon}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase font-black tracking-widest text-white/40">{opt.label}</span>
                                            <span className="text-lg font-black tracking-tight">{opt.amount} Credits</span>
                                        </div>
                                        {selectedAmount === opt.amount && (
                                            <div className="absolute top-4 right-4 text-neon-purple animate-pulse">
                                                <Zap size={14} fill="currentColor" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={handleSendGift}
                                disabled={isProcessing || userBalance < selectedAmount}
                                className={`w-full py-6 mt-8 rounded-[2rem] font-outfit font-black uppercase text-[11px] tracking-[0.3em] transition-all transform active:scale-95 ${
                                    userBalance >= selectedAmount 
                                    ? 'bg-neon-purple text-white shadow-[0_0_60px_rgba(188,19,254,0.3)] hover:scale-[1.02]' 
                                    : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'
                                }`}
                            >
                                {isProcessing ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Timer size={16} className="animate-spin" /> Uplink Infusing...
                                    </div>
                                ) : (
                                    <>Initiate Priority Gift</>
                                )}
                            </button>
                            
                            {userBalance < selectedAmount && (
                                <p className="text-[10px] text-neon-pink font-bold uppercase tracking-widest">Insufficient Credit Balance</p>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
