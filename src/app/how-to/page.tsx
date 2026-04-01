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
            title: 'Join the Club',
            icon: <ShieldCheck size={24} className="text-[#00f0ff]" />,
            description: 'Sign in with your Email or Wallet to create your account and start exploring.',
            color: 'border-[#00f0ff]/20 bg-[#00f0ff]/5'
        },
        {
            title: 'The Feed',
            icon: <Users size={24} className="text-[#ff00ff]" />,
            description: 'Follow your favorite creators to see their latest news and posts in real-time.',
            color: 'border-[#ff00ff]/20 bg-[#ff00ff]/5'
        },
        {
            title: 'Add Credits',
            icon: <Coins size={24} className="text-[#ffea00]" />,
            description: 'Load up on Gasp Credits. Use them to unlock exclusive messages and premium media.',
            color: 'border-[#ffea00]/20 bg-[#ffea00]/5'
        },
        {
            title: 'The Archive',
            icon: <Lock size={24} className="text-red-500" />,
            description: 'Unlock exclusive "Archive" content to see high-quality photos and videos.',
            color: 'border-red-500/20 bg-red-500/5'
        },
        {
            title: 'Gasp Rewards',
            icon: <Zap size={24} className="text-[#ff9d00]" />,
            description: 'Every credit you spend is matched 1:1 with points. These rewards show your status in the community.',
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
                        Member Access Guide v1.0
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="text-4xl sm:text-7xl md:text-8xl font-syncopate font-black italic tracking-tighter uppercase leading-none"
                    >
                        Explore <span className="text-[#ff00ff]">Gasp</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                        className="text-sm md:text-base text-white/40 font-black italic uppercase tracking-widest leading-relaxed"
                    >
                        How to get the most out of your experience.
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
                        <h4 className="text-sm font-syncopate font-black uppercase italic italic">Direct Messaging</h4>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed italic">
                            Connect with creators directly. Every message is personalized to provide a realistic and immersive experience.
                        </p>
                    </div>
                    <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] space-y-4">
                        <Activity size={24} className="text-[#ff00ff]" />
                        <h4 className="text-sm font-syncopate font-black uppercase italic italic">Member Activity</h4>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed italic">
                            The platform tracks your engagement and rewards you with points. No tokens—just simple rewards for being active.
                        </p>
                    </div>
                    <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] space-y-4">
                        <Heart size={24} className="text-red-500" />
                        <h4 className="text-sm font-syncopate font-black uppercase italic italic">Loyalty Rewards</h4>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed italic">
                            Talking to creators increases your loyalty level, unlocking voice notes and exclusive content in the archive.
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
                                q: "What are Gasp Credits used for?",
                                a: "Credits are the currency of the site. Use them to unlock 'Archive' content, message creators, and get exclusive posts."
                            },
                            {
                                q: "How do I earn points?",
                                a: "Every credit you spend is matched 1:1 with points. These are added automatically to your profile as a reward."
                            },
                            {
                                q: "Is my data secure?",
                                a: "Yes. We use standard secure login protocols. Your wallet and email are encrypted and safe."
                            },
                            {
                                q: "Are the creators real?",
                                a: "Each creator is a unique AI persona. They use realistic voice messages and smart behavior to chat with you 24/7."
                            },
                            {
                                q: "Can I get a refund?",
                                a: "Due to the digital nature of the content and messaging, all credit purchases are final once they are used."
                            },
                            {
                                q: "How do I unlock voice notes?",
                                a: "The more you chat and unlock archive items, the higher your loyalty level goes—unlocking voice notes and rarer content."
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
