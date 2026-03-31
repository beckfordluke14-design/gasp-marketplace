'use client';

import { motion } from 'framer-motion';
import { RadioReceiver, Activity, Globe, Share2, CornerRightUp } from 'lucide-react';

const NEWS_ITEMS = [
    { id: 'n1', title: 'Global Grid Stabilization Complete', category: 'Infrastructure', time: '10m ago', source: 'SYNDICATE NEWS', impact: 'HIGH', excerpt: 'All regional energy constraints have been lifted. AI computational capacity increased by 400%.' },
    { id: 'n2', title: 'New Sector Unlocked: Sector 07', category: 'Expansion', time: '45m ago', source: 'GHOST INTEL', impact: 'MEDIUM', excerpt: 'Classified sector officially declassified. Full access required for entry via Terminal.' },
    { id: 'n3', title: 'Credits Transfer Anomaly Detected', category: 'Economy', time: '2h ago', source: 'SYSTEM LOG', impact: 'LOW', excerpt: 'A brief fluctuation in crypto offramp processing was resolved. Operations normal.' },
    { id: 'n4', title: 'Persona Upload Rates Triple', category: 'Network', time: '5h ago', source: 'NEURAL PULSE', impact: 'HIGH', excerpt: 'Unprecedented volume of neural uploads detected across the European sector.' },
];

export default function NewsFeed() {
    return (
        <div className="h-full w-full overflow-y-auto overflow-x-hidden hide-scrollbar flex flex-col pt-20 px-4 md:px-8 pb-32">
             <header className="mb-10 text-center md:text-left flex items-center justify-between">
                <div>
                   <h1 className="text-4xl md:text-5xl font-outfit font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#ff00ff] to-white/50 flex items-center gap-4">
                       Neural <span className="text-white">News</span>
                   </h1>
                   <p className="text-white/40 text-xs md:text-sm font-mono mt-2 uppercase tracking-widest flex items-center gap-2">
                       <RadioReceiver size={14} className="animate-pulse text-[#ff00ff]" /> Live Global Transmissions
                   </p>
                </div>
            </header>

            <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
                {NEWS_ITEMS.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="group bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl hover:bg-white/10 hover:border-[#ff00ff]/30 transition-all duration-300 relative overflow-hidden"
                    >
                        {/* Background flare */}
                        <div className="absolute -inset-10 bg-gradient-to-r from-[#ff00ff]/0 via-[#ff00ff]/5 to-[#ff00ff]/0 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700 pointer-events-none" />

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 bg-[#ff00ff]/10 text-[#ff00ff] text-[10px] font-black uppercase tracking-widest rounded-md border border-[#ff00ff]/20">
                                    {item.category}
                                </div>
                                <span className="text-white/30 text-[10px] font-mono tracking-widest">{item.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${item.impact === 'HIGH' ? 'bg-red-500 animate-pulse' : item.impact === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                                <span className="text-[9px] uppercase font-black text-white/50 tracking-widest">Priority {item.impact}</span>
                            </div>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-outfit font-black italic uppercase tracking-tighter mb-4 leading-tight relative z-10">
                            {item.title}
                        </h2>
                        
                        <p className="text-white/60 text-sm font-mono leading-relaxed mb-6 border-l-2 border-white/10 pl-4 relative z-10">
                            "{item.excerpt}"
                        </p>

                        <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                            <div className="flex items-center gap-2 text-white/40 text-[10px] font-mono tracking-widest uppercase">
                                <Globe size={12} className="text-[#ff00ff]" /> {item.source}
                            </div>
                            <div className="flex gap-4">
                                <button className="text-white/30 hover:text-[#ff00ff] transition-colors">
                                    <Share2 size={16} />
                                </button>
                                <button className="text-[#ff00ff] flex items-center gap-2 text-[10px] uppercase font-black tracking-widest hover:text-white transition-colors">
                                    Read Logs <CornerRightUp size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
