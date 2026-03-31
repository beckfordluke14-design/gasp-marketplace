'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Fuel, Flame, Users, Lock, ArrowRight, MessageSquare, Heart, Coins, Activity } from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';

/**
 * 🛰️ SYNDICATE: How-To (Customer Edition)
 * Objective: High-end, premium onboarding guide for users.
 */
export default function CustomerGuide() {
    const steps = [
        {
            title: 'Identity Activation',
            icon: <ShieldCheck size={24} className="text-[#00f0ff]" />,
            description: 'Secure your node. Sign in using Privy with your Email or Wallet to establish your unique sovereign presence.',
            color: 'border-[#00f0ff]/20 bg-[#00f0ff]/5'
        },
        {
            title: 'Market Intelligence',
            icon: <Users size={24} className="text-[#ff00ff]" />,
            description: 'Explore the Syndicate Feed. Follow your favorite Personas to track their latest intel and broadacasts in real-time.',
            color: 'border-[#ff00ff]/20 bg-[#ff00ff]/5'
        },
        {
            title: 'Credit Uplink',
            icon: <Coins size={24} className="text-[#ffea00]" />,
            description: 'Load your wallet with Syndicate Credits. Credits are used to unlock exclusive communications and "Alpha" media.',
            color: 'border-[#ffea00]/20 bg-[#ffea00]/5'
        },
        {
            title: 'The Vault',
            icon: <Lock size={24} className="text-red-500" />,
            description: 'Unlock "Vault" content to reveal high-fidelity assets. Every unlock uses credits and strengthens the platform’s revenue pulse.',
            color: 'border-red-500/20 bg-red-500/5'
        },
        {
            title: '$GASPai Match Protocol',
            icon: <Zap size={24} className="text-[#ff9d00]" />,
            description: 'Every credit spent is matched 1:1 with $GASPai. These rewards track your contribution to the system and grant future access.',
            color: 'border-[#ff9d00]/20 bg-[#ff9d00]/5'
        }
    ];

    return (
        <main className="min-h-screen bg-[#050505] text-white font-outfit pb-20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#ff00ff11,transparent)] pointer-events-none" />
            <Header />

            <div className="container max-w-5xl mx-auto py-24 px-6 space-y-24 relative z-10">
                {/* Hero Section */}
                <div className="text-center space-y-6 max-w-3xl mx-auto">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white/50 italic mb-6"
                    >
                        <ShieldCheck size={12} className="text-[#00f0ff]" />
                        Sovereign Access Guide v1.0
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="text-4xl sm:text-7xl md:text-8xl font-syncopate font-black italic tracking-tighter uppercase leading-none"
                    >
                        Master the <span className="text-[#ff00ff]">Syndicate</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                        className="text-sm md:text-base text-white/40 font-black italic uppercase tracking-widest leading-relaxed"
                    >
                        Your blueprint for exploring the world’s most lethal AI marketplace.
                    </motion.p>
                </div>

                {/* Steps Section */}
                <div className="space-y-6">
                    {steps.map((step, i) => (
                        <motion.div 
                            key={step.title}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`p-8 md:p-12 rounded-[2.5rem] border ${step.color} backdrop-blur-3xl flex flex-col md:flex-row gap-8 items-center group hover:scale-[1.01] transition-all`}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-2xl group-hover:scale-110 transition-transform">
                                {step.icon}
                            </div>
                            <div className="space-y-3 text-center md:text-left flex-1">
                                <h3 className="text-xl md:text-2xl font-syncopate font-black italic tracking-tighter uppercase">{step.title}</h3>
                                <p className="text-sm text-white/40 font-black italic uppercase tracking-widest leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full border border-white/10 flex items-center justify-center opacity-20 group-hover:opacity-100 group-hover:bg-white group-hover:text-black transition-all">
                                <ArrowRight size={20} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ Style Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] space-y-4">
                        <MessageSquare size={24} className="text-[#00f0ff]" />
                        <h4 className="text-sm font-syncopate font-black uppercase italic italic">Neural Chat</h4>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed italic">
                            Every chat message is powered by the Sovereign Neural Core. Response speed and fidelity are optimized for immersion.
                        </p>
                    </div>
                    <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] space-y-4">
                        <Activity size={24} className="text-[#ff00ff]" />
                        <h4 className="text-sm font-syncopate font-black uppercase italic italic">The Revenue Pulse</h4>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed italic">
                            The platform tracks Cumulative Match Volume. No tokens are burned—simply matched 1:1 into your $GASPai governance layer.
                        </p>
                    </div>
                    <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] space-y-4">
                        <Heart size={24} className="text-red-500" />
                        <h4 className="text-sm font-syncopate font-black uppercase italic italic">Loyalty Alpha</h4>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed italic">
                            Engaging with personas increases your Affinity Level, unlocking unique regional voice notes and high-heat transmissions.
                        </p>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl md:text-5xl font-syncopate font-black italic uppercase tracking-tighter">Frequency <span className="text-[#00f0ff]">Asked</span></h2>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] italic">Protocol Clarifications • v1.0</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            {
                                q: "What are Syndicate Credits used for?",
                                a: "Credits are the native fuel of the platform. Use them to unlock 'Vault' content, initiate high-fidelity chats, and access exclusive broadcasts from your followed personas."
                            },
                            {
                                q: "How do I earn $GASPai?",
                                a: "Every single credit you spend on the platform is matched 1:1 with $GASPai. These are awarded automatically to your profile as a reward for contributing to the system's growth."
                            },
                            {
                                q: "Is my identity and data secure?",
                                a: "Yes. We use Privy's sovereign identity protocol. Your wallet and email interactions are encrypted, and you maintain full control over your digital node at all times."
                            },
                            {
                                q: "Are the personas real human creators?",
                                a: "Each persona is a unique neural entity powered by the Sovereign Core. They use high-fidelity regional voice synthesis and advanced SLANG models to interact with you 24/7."
                            },
                            {
                                q: "Can I refund my credit purchases?",
                                a: "Due to the digital nature of neural processing and content unlocking, credit purchases are generally non-refundable once deployed into the matrix."
                            },
                            {
                                q: "How do I increase my Affinity Level?",
                                a: "Consistency is key. Frequently interacting with a persona through chat and unlocking their vault assets will increase your affinity, granting you priority access to their rarest intel."
                            }
                        ].map((faq, i) => (
                            <div key={i} className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-3 group hover:border-[#00f0ff]/20 transition-all">
                                <h4 className="text-xs font-syncopate font-black uppercase text-[#00f0ff] italic group-hover:translate-x-1 transition-transform">Q: {faq.q}</h4>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed italic">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Support CTA */}
                <div className="p-12 md:p-20 rounded-[3rem] bg-gradient-to-br from-[#ff00ff]/10 to-[#00f0ff]/10 border border-white/10 text-center space-y-8 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[150px] font-syncopate font-black text-white/[0.01] pointer-events-none select-none italic">SUPPORT</div>
                    <h2 className="text-3xl md:text-6xl font-syncopate font-black italic tracking-tighter uppercase relative z-10">Lost in the <span className="text-[#00f0ff]">Matrix?</span></h2>
                    <p className="text-sm text-white/40 uppercase tracking-widest font-black italic relative z-10 max-w-xl mx-auto">
                        If you encounter node failures or need balance assistance, contact our strategic support team immediately.
                    </p>
                    <Link href="/contact" className="inline-flex items-center gap-4 px-12 py-5 bg-white text-black font-syncopate font-black uppercase italic tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all relative z-10 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                        Strategic Uplink <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </main>
    );
}
