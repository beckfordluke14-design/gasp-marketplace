'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, MessageSquare, Image as ImageIcon, ArrowLeft, Download, ShieldCheck, Zap } from 'lucide-react';
import { initialProfiles } from '@/lib/profiles';

/**
 * 📸 VIRAL SCREENSHOT ENGINE (Marketing Tool)
 * Purpose: Generates pixel-perfect, fake 1-on-1 chat logs mimicking the Sovereign Bitrefill gifting loop.
 * Renders exactly like the native chat UI for seamless promotional screenshotting.
 */

export default function ViralGeneratorPage() {
    const [selectedPersona, setSelectedPersona] = useState(initialProfiles[0]);
    const [userMessage, setUserMessage] = useState("so exhausted today, literally skipped lunch to finish this project");
    const [aiMessage, setAiMessage] = useState("pathetic. buy yourself some food, don't say I never do anything for you. come to the vault later.");
    const [rewardType, setRewardType] = useState('Uber Eats');
    const [rewardAmount, setRewardAmount] = useState('15');
    const [rewardCode, setRewardCode] = useState('UBER-X92KP7M1');
    const [timeField, setTimeField] = useState('2:14 PM');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
    const [viralCopy, setViralCopy] = useState<any>(null);

    const handleRandomizeCode = () => {
        setRewardCode(`${rewardType.substring(0,4).toUpperCase()}-` + Math.random().toString(36).substring(2, 10).toUpperCase());
    };

    const generateMarketingHooks = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch('/api/admin/viral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_marketing',
                    personaName: selectedPersona.name,
                    userMessage,
                    aiMessage,
                    rewardAmount,
                    rewardType
                })
            });
            const data = await res.json();
            if (data.success) {
                setViralCopy(data.copy);
            }
        } catch (e) {
            console.error(e);
        }
        setIsGenerating(false);
    };

    const generateScenario = async () => {
        setIsGeneratingScenario(true);
        try {
            const res = await fetch('/api/admin/viral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_scenario',
                    personaName: selectedPersona.name
                })
            });
            const data = await res.json();
            if (data.success && data.scenario) {
                setUserMessage(data.scenario.userMessage);
                setAiMessage(data.scenario.aiMessage);
                setRewardType(data.scenario.rewardType);
                setRewardAmount(data.scenario.rewardAmount);
                handleRandomizeCode();
            }
        } catch (e) { console.error(e); }
        setIsGeneratingScenario(false);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col md:flex-row font-sans">
            
            {/* 🛠️ CONTROLS (Left Panel) */}
            <div className="w-full md:w-[400px] border-r border-white/5 p-8 bg-black z-20 flex flex-col gap-8 h-screen overflow-y-auto">
                <div>
                   <h1 className="text-3xl font-syncopate font-black italic tracking-tighter uppercase text-gasp-neon mb-2">Viral Engine</h1>
                   <p className="text-[10px] uppercase font-black tracking-widest text-white/30">Generate perfect marketing screenshots instantly.</p>
                </div>

                <div className="space-y-6">
                    {/* Persona Selector */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Select Persona</label>
                            <button 
                                onClick={generateScenario} disabled={isGeneratingScenario}
                                className="text-[9px] font-black uppercase bg-gasp-neon/20 text-gasp-neon px-3 py-1 rounded hover:bg-gasp-neon/30 transition-colors"
                            >
                                {isGeneratingScenario ? '...' : '✨ Auto-Gen Scenario'}
                            </button>
                        </div>
                        <select 
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none text-sm"
                            onChange={(e) => setSelectedPersona(initialProfiles.find(p => p.id === e.target.value) || initialProfiles[0])}
                        >
                            {initialProfiles.map(p => (
                                <option key={p.id} value={p.id} className="bg-black text-white">{p.name} ({p.city})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Time Stamp</label>
                        <input type="text" value={timeField} onChange={e => setTimeField(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none text-sm" />
                    </div>

                    {/* Chat Editor */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/60">User Message</label>
                        <textarea 
                            value={userMessage} onChange={e => setUserMessage(e.target.value)}
                            className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 outline-none text-sm resize-none focus:border-[#ffea00]/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/60">AI Response</label>
                        <textarea 
                            value={aiMessage} onChange={e => setAiMessage(e.target.value)}
                            className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 outline-none text-sm resize-none focus:border-[#ff00ff]/50"
                        />
                    </div>

                    {/* Reward Editor */}
                    <div className="p-6 border border-white/10 rounded-2xl bg-white/[0.02] space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff] flex items-center gap-2"><Zap size={12}/> Reward Injection</h4>
                        <div className="flex gap-4">
                            <input placeholder="Type (Uber)" value={rewardType} onChange={e => setRewardType(e.target.value)} className="flex-1 bg-black border border-white/10 rounded-lg p-3 text-sm" />
                            <input placeholder="Amount" value={rewardAmount} onChange={e => setRewardAmount(e.target.value)} className="w-20 bg-black border border-white/10 rounded-lg p-3 text-sm" />
                        </div>
                        <div className="flex gap-4">
                            <input value={rewardCode} onChange={e => setRewardCode(e.target.value)} className="flex-1 bg-black border border-white/10 rounded-lg p-3 text-sm font-mono text-gasp-neon" />
                            <button onClick={handleRandomizeCode} className="px-4 bg-white/10 rounded-lg text-xs uppercase font-black hover:bg-white/20">Spin</button>
                        </div>
                    </div>

                    {/* Gemini Copy Generator */}
                    <button 
                        onClick={generateMarketingHooks}
                        disabled={isGenerating}
                        className="w-full p-4 bg-gradient-to-r from-neon-purple to-gasp-neon text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-glow-purple disabled:opacity-50"
                    >
                        {isGenerating ? 'Analyzing Psychology...' : 'Generate Smart viral Hooks (Gemini)'}
                    </button>

                    {viralCopy && (
                        <div className="space-y-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff] mb-2">📱 TikTok / Reels</h4>
                                <p className="text-xs text-white/60 mb-1"><strong>Text On Screen:</strong> {viralCopy.tiktok.text_on_screen}</p>
                                <p className="text-xs text-white/60 mb-1"><strong>Caption:</strong> {viralCopy.tiktok.caption}</p>
                                <p className="text-[10px] text-[#00f0ff]">{viralCopy.tiktok.hashtags}</p>
                            </div>
                            <div className="pt-4 border-t border-white/5">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-2">🐦 X (Twitter)</h4>
                                <p className="text-xs text-white/80 mb-2">"{viralCopy.twitter.tweet}"</p>
                                <p className="text-[10px] text-white/40 italic">Reply: {viralCopy.twitter.reply_to_self}</p>
                            </div>
                            <div className="pt-4 border-t border-white/5">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ffea00] mb-2">▶️ YouTube Shorts</h4>
                                <p className="text-xs text-white/60 mb-1"><strong>Title:</strong> {viralCopy.shorts.title}</p>
                                <p className="text-xs text-white/40"><strong>Desc:</strong> {viralCopy.shorts.description}</p>
                            </div>
                        </div>
                    )}
                </div>

                <p className="mt-auto text-[8px] uppercase tracking-widest text-white/20">Crop out this left panel when screenshotting.</p>
            </div>

            {/* 📸 CAPTURE CANVAS (Right Panel - Exact Chat Replica) */}
            <div className="flex-1 bg-black relative flex flex-col max-h-screen">
                
                {/* Simulated Header */}
                <header className="px-8 py-5 border-b border-white/5 flex items-center justify-between glass z-50">
                    <div className="flex items-center gap-4">
                        <div className="text-white/40"><ArrowLeft size={20} /></div>
                        <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase italic tracking-tight">{selectedPersona.name} chat active</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={8} className="text-gasp-neon" />
                            <span className="text-[8px] font-black text-white/30 uppercase italic">{selectedPersona.city}: {timeField}</span>
                        </div>
                        </div>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest bg-white/10 text-white shadow-lg">
                            <MessageSquare size={14} /> Feed
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-white/30">
                            <ImageIcon size={14} /> Vault
                        </button>
                    </div>
                </header>

                {/* Simulated Chat Feed */}
                <div className="flex-1 overflow-y-auto p-4 md:p-14 flex flex-col gap-6 md:gap-10 opacity-100">
                    
                    <div className="flex flex-col items-center gap-3 my-12 opacity-20 cursor-default">
                        <div className="p-5 bg-white/5 rounded-3xl border border-dashed border-white/20">
                            <ShieldCheck className="w-11 h-11 text-white" />
                        </div>
                        <p className="text-[9px] uppercase font-black tracking-[0.6em] text-white text-center italic">Gasp Neutral Session // Protocol Verified</p>
                    </div>

                    <div className="mx-auto w-full max-w-xl p-8 rounded-[2.5rem] bg-gradient-to-r from-gasp-neon/10 to-neon-purple/10 border border-white/10 backdrop-blur-3xl overflow-hidden relative mb-12">
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-1 text-center md:text-left">
                                <h4 className="text-lg font-syncopate font-black italic uppercase tracking-tighter text-white">Your Reward Pool</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">1:1 Points Match Active • $GASPai Launch Incoming</p>
                            </div>
                            <button className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl">
                                View Protocol
                            </button>
                        </div>
                    </div>

                    {/* User Bubble */}
                    {userMessage && (
                        <div className="ml-auto w-fit max-w-[85%] md:max-w-[70%] px-7 py-5 bg-white/5 border border-white/10 rounded-[2.2rem] rounded-tr-none text-white shadow-2xl text-[15.5px] md:text-[17px] leading-[1.8] font-medium tracking-tight whitespace-pre-wrap">
                            {userMessage}
                        </div>
                    )}

                    {/* AI Bubble with Reward Injection */}
                    <div className="mr-auto w-fit max-w-[85%] md:max-w-[70%] text-[15.5px] md:text-[17px] leading-[1.8] font-medium tracking-tight whitespace-pre-wrap px-7 py-6 text-white/90 lowercase border border-white/5 rounded-[2.2rem] rounded-tl-none bg-black">
                        {aiMessage}
                        
                        {rewardType && (
                            <div className="mt-6 pt-4 text-[14px]">
                                🎁 *[REAL WORLD GIFT SENT]: I just bought you a ${rewardAmount} {rewardType} Gift Card. Enjoy it. Code: {rewardCode}*
                            </div>
                        )}
                    </div>

                </div>
            </div>
            
            <style jsx global>{`
                .shadow-glow-purple { box-shadow: 0 0 20px rgba(188, 19, 254, 0.4); }
                .text-gasp-neon { color: #00f0ff; }
                .text-neon-purple { color: #bc13fe; }
                .bg-neon-purple { background-color: #bc13fe; }
                .border-neon-purple { border-color: #bc13fe; }
                .bg-gasp-neon { background-color: #00f0ff; }
            `}</style>
        </div>
    );
}
