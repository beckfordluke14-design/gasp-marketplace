'use client';

import SyndicateMissionBoard from '@/components/economy/SyndicateMissionBoard';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SyndicatePortalPage() {
    const searchParams = useSearchParams();
    const isSuccess = searchParams.get('status') === 'success';

    return (
        <main className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center p-4">
            {/* 🌌 DEEP SPACE GRID AESTHETIC */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,242,0.1)_0%,transparent_70%)]" />
                <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(rgba(0,255,242,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,242,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="w-full max-w-2xl relative z-10 space-y-8">
                {isSuccess ? (
                    /* 🏆 MISSION SUCCESS BUFFER (THE SHIELD) */
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 border border-[#00fff2]/30 rounded-[2.5rem] p-12 backdrop-blur-xl text-center space-y-8 shadow-[0_0_50px_rgba(0,255,242,0.1)]"
                    >
                        <div className="w-24 h-24 rounded-full bg-[#00fff2]/10 border-2 border-[#00fff2] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,255,242,0.3)]">
                            <CheckCircle2 size={48} className="text-[#00fff2] animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase">Mission <span className="text-[#00fff2]">Complete</span></h2>
                            <p className="text-white/40 text-[10px] uppercase tracking-[0.4em] font-medium">Bounty Verified // Credits Infused</p>
                        </div>
                        <Link href="/feed" className="inline-flex items-center gap-4 px-10 py-5 bg-[#00fff2] text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-all shadow-[0_0_40px_rgba(0,255,242,0.4)]">
                            Resume Operation <ArrowRight size={16} />
                        </Link>
                    </motion.div>
                ) : (
                    <>
                        {/* 🛡️ BRAND AUTHORITY HEADER */}
                        <div className="text-center space-y-4">
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-[#00fff2]/30 bg-[#00fff2]/5 backdrop-blur-md"
                            >
                                <Shield size={16} className="text-[#00fff2]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00fff2] italic">Syndicate Verified Node</span>
                            </motion.div>
                            
                            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
                                MISSION <span className="text-[#00fff2] drop-shadow-[0_0_15px_#00fff2]">CENTER</span>
                            </h1>
                            <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-medium">Auth Interface v4.0.12 // Global Reward Uplink</p>
                        </div>

                        {/* 🛰️ THE BOARD COMPONENT (THE MAIN LOCKER) */}
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-4 backdrop-blur-xl shadow-2xl">
                            <SyndicateMissionBoard onClose={() => {}} />
                        </div>
                    </>
                )}

                {/* 🔒 SECURITY FOOTER (TO REASSURE OGADS MANAGERS) */}
                <div className="flex flex-col items-center gap-4 py-8 border-t border-white/5">
                    <div className="flex items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                        <span className="text-[8px] font-bold text-white uppercase tracking-widest italic">Encrypted Connection</span>
                        <span className="text-[8px] font-bold text-white uppercase tracking-widest italic tracking-wide">• Verified Publisher</span>
                        <span className="text-[8px] font-bold text-white uppercase tracking-widest italic">100% Secure</span>
                    </div>
                </div>
            </div>
        </main>
    );
}
