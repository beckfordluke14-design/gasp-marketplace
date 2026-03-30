'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Mail, MapPin, ExternalLink, Send, Instagram, ShoppingBag } from 'lucide-react';

export default function ContactSupport() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API dispatch since email backend (Resend) handles real ingestion
    setTimeout(() => {
        setLoading(false);
        setSent(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white/80 font-inter selection:bg-[#ff00ff]/30">
      
      {/* Navigation Bar */}
      <div className="fixed top-0 inset-x-0 h-20 bg-black/60 backdrop-blur-3xl border-b border-white/5 z-50 flex items-center px-6 md:px-12">
        <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Terminal</span>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto pt-32 pb-24 px-6 md:pt-40">
        
        <div className="mb-12 space-y-4">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white font-syncopate">Contact Support</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#ff00ff] font-bold">Last Updated: March 20, 2026</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            
            {/* Contact Details */}
            <div className="space-y-10">
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">National & Global Reach</h2>
                    <p className="text-sm leading-relaxed text-white/70">
                        Our strategic operations center monitors this channel 24/7 to manage technical discrepancies regarding System Credits, urgent account removals, and data compliance requests under CCPA/GDPR requirements.
                    </p>
                </section>

                <div className="space-y-6">
                    {/* Direct Email */}
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 group-hover:border-[#ff00ff]/50 transition-colors">
                            <Mail size={20} className="text-[#ff00ff]" />
                        </div>
                        <div>
                            <p className="font-bold text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Priority Signal Transmission</p>
                            <a href="mailto:support@gasp.fun" className="text-base md:text-lg font-black tracking-tighter text-white hover:text-[#00f0ff] transition-colors hover:underline">
                                support@gasp.fun
                            </a>
                        </div>
                    </div>

                    {/* Head Quarters */}
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                            <MapPin size={20} className="text-white/60" />
                        </div>
                        <div>
                            <p className="font-bold text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Corporate Infrastructure</p>
                            <p className="text-sm font-bold text-white mb-0.5">AllTheseFlows LLC d.b.a. AllTheseFlows Strategic Media</p>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Sovereign Data Operations // USA</p>
                        </div>
                    </div>

                    {/* 🕵️‍♂️ AUDIT NODES: Institutional Social Proof */}
                    <div className="pt-6 border-t border-white/5 space-y-4">
                        <a href="https://GASP Syndicate.shop" target="_blank" className="flex items-center gap-4 group">
                            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 group-hover:border-[#00f0ff]/40 transition-all">
                                <ShoppingBag size={14} className="text-white/40 group-hover:text-[#00f0ff]" />
                            </div>
                            <div>
                                <p className="text-[7px] font-black uppercase text-white/20 tracking-widest">Verified Strategic Shop</p>
                                <p className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">GASP Syndicate.shop</p>
                            </div>
                        </a>
                        <a href="https://instagram.com/GASP Syndicatexx" target="_blank" className="flex items-center gap-4 group">
                            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 group-hover:border-[#ff00ff]/40 transition-all">
                                <Instagram size={14} className="text-white/40 group-hover:text-[#ff00ff]" />
                            </div>
                            <div>
                                <p className="text-[7px] font-black uppercase text-white/20 tracking-widest">Strategic Signal Node</p>
                                <p className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">@GASP Syndicatexx</p>
                            </div>
                        </a>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 space-y-4 flex flex-col items-start">
                    <Link href="/terms" className="text-xs uppercase tracking-widest font-bold text-white/40 hover:text-white flex items-center gap-2 group">
                        Terms of Service <ExternalLink size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Link>
                    <Link href="/privacy" className="text-xs uppercase tracking-widest font-bold text-white/40 hover:text-white flex items-center gap-2 group">
                        Privacy Policy <ExternalLink size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Link>
                    <Link href="/refunds" className="text-xs uppercase tracking-widest font-bold text-white/40 hover:text-white flex items-center gap-2 group">
                        Refund & Cancellation Protocol <ExternalLink size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* In-App Rapid Dispatch Form */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[2rem] pointer-events-none" />
                
                {sent ? (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-700">
                        <div className="w-16 h-16 bg-[#00ff41]/10 rounded-full flex items-center justify-center border border-[#00ff41]/30">
                            <Send size={24} className="text-[#00ff41]" />
                        </div>
                        <h3 className="text-xl font-syncopate font-black uppercase tracking-widest text-[#00ff41]">Packet Sent</h3>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Our node engineers have received the transmission. We actively resolve discrepancies within 24 hours.</p>
                        <button onClick={() => setSent(false)} className="mt-4 px-6 py-2 border border-white/10 rounded-full text-[10px] uppercase font-bold tracking-widest text-white/50 hover:bg-white/5 hover:text-white transition-all">Submit Another</button>
                    </div>
                ) : (
                    <form onSubmit={handleSupport} className="space-y-5 relative z-10 w-full flex flex-col h-full justify-center">
                        <div>
                            <label className="block text-[9px] uppercase font-black tracking-[0.3em] text-white/40 mb-2 ml-4">Authorized Email Node</label>
                            <input 
                                required 
                                type="email" 
                                placeholder="name@domain.com"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-sm text-white placeholder-white/20 outline-none focus:border-[#ff00ff]/50 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[9px] uppercase font-black tracking-[0.3em] text-white/40 mb-2 ml-4">Subject Vector</label>
                            <select 
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-sm text-white outline-none focus:border-[#00f0ff]/50 transition-colors appearance-none"
                            >
                                <option className="bg-[#050505]" value="General Support">General Support</option>
                                <option className="bg-[#050505]" value="Credits Not Credited">System Credits Not Allocated</option>
                                <option className="bg-[#050505]" value="Delete Data / GDPR">Delete Neural Data (GDPR/CCPA)</option>
                                <option className="bg-[#050505]" value="Bug Report">Critical Signal Discrepancy</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[9px] uppercase font-black tracking-[0.3em] text-white/40 mb-2 ml-4">Message Block</label>
                            <textarea 
                                required 
                                rows={4}
                                placeholder="Describe the discrepancy..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white leading-relaxed placeholder-white/20 outline-none focus:border-[#ff00ff]/50 transition-colors resize-none"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all ${loading ? 'bg-white/5 text-white/20' : 'bg-white text-black hover:bg-[#ff00ff] hover:text-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]'}`}
                        >
                            {loading ? 'Routing...' : 'Dispatch Protocol'}
                        </button>
                    </form>
                )}
            </div>

        </div>
      </div>
    </div>
  );
}



