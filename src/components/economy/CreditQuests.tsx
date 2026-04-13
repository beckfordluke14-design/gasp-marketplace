'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, Zap, ArrowRight, Lock, Sparkles } from 'lucide-react';

interface QuestNode {
    id: number;
    title: string;
    reward: number;
    link: string;
    completed: boolean;
}

export default function CreditQuests({ onClose }: { onClose: () => void }) {
    const [nodes, setNodes] = useState<QuestNode[]>([
        { id: 1, title: 'IDENTITY NODE ALPHA', reward: 3000, link: 'YOUR_OFFER_1_URL', completed: false },
        { id: 2, title: 'NEURAL SYNC BETA', reward: 3000, link: 'YOUR_OFFER_2_URL', completed: false },
        { id: 3, title: 'SYNDICATE CLEARANCE', reward: 4000, link: 'YOUR_OFFER_3_URL', completed: false },
    ]);

    const activeNode = nodes.find(n => !n.completed) || nodes[nodes.length - 1];

    const handleNodeClick = (node: QuestNode) => {
        window.open(node.link, '_blank');
        
        // 🛰️ Simulation: In production, the Postback URL updates this state.
        // For the UI, we mark it as "Processing"
        setTimeout(() => {
            setNodes(prev => prev.map(n => n.id === node.id ? { ...n, completed: true } : n));
        }, 1000);
    };

    const allCompleted = nodes.every(n => n.completed);

    return (
        <div className="p-6 bg-[#050505] border border-white/10 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffea00] via-transparent to-[#ffea00] opacity-20" />
            
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black italic uppercase italic tracking-tighter text-white">SYNDICATE QUESTS</h2>
                <div className="flex items-center justify-center gap-2">
                    <div className="px-3 py-1 bg-[#ffea00]/10 border border-[#ffea00]/30 rounded-full flex items-center gap-2">
                        <Sparkles size={10} className="text-[#ffea00] animate-pulse" />
                        <span className="text-[8px] font-black text-[#ffea00] tracking-widest uppercase italic">10,000 $GASP TOTAL REWARD</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {nodes.map((node, idx) => (
                    <div key={node.id} className="relative">
                        <motion.button
                            onClick={() => !node.completed && handleNodeClick(node)}
                            disabled={idx > 0 && !nodes[idx - 1].completed}
                            className={`w-full group relative transition-all duration-500 rounded-3xl border p-5 flex items-center justify-between overflow-hidden
                                ${node.completed ? 'bg-green-500/5 border-green-500/30' : 
                                  idx === 0 || nodes[idx-1].completed ? 'bg-white/5 border-white/20 hover:border-[#ffea00] hover:bg-white/10' : 
                                  'bg-white/2 border-white/5 opacity-40 grayscale'}
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors
                                    ${node.completed ? 'bg-green-500 border-green-500 text-black' : 'bg-black border-white/10 text-white/40'}
                                `}>
                                    {node.completed ? <Check size={18} /> : <span>{node.id}</span>}
                                </div>
                                <div className="text-left">
                                    <h4 className={`text-[10px] font-black tracking-widest uppercase italic transition-colors ${node.completed ? 'text-green-500' : 'text-white'}`}>
                                        {node.title}
                                    </h4>
                                    <span className="text-[8px] font-black text-white/30 tracking-widest uppercase">+{node.reward} $GASP REWARD</span>
                                </div>
                            </div>
                            
                            {!node.completed && (idx === 0 || nodes[idx-1].completed) && (
                                <Zap size={14} className="text-[#ffea00] group-hover:scale-125 transition-transform" />
                            )}
                            {idx > 0 && !nodes[idx - 1].completed && (
                                <Lock size={14} className="text-white/20" />
                            )}
                        </motion.button>
                        {idx < nodes.length - 1 && (
                            <div className={`w-0.5 h-4 mx-auto my-[-4px] transition-colors ${node.completed ? 'bg-green-500/30' : 'bg-white/5'}`} />
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-4">
                {allCompleted ? (
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={onClose}
                        className="w-full h-16 bg-[#00f0ff] text-black text-[12px] font-black uppercase tracking-[0.3em] font-syncopate italic rounded-2xl shadow-[0_10px_40px_rgba(0,240,255,0.4)]"
                    >
                        RECLAIM 10,000 $GASP
                    </motion.button>
                ) : (
                    <p className="text-[7px] text-center text-white/20 font-black uppercase tracking-[0.4em]">
                        Complete Node {activeNode.id} to advance Syndicate Rank
                    </p>
                )}
            </div>
        </div>
    );
}
