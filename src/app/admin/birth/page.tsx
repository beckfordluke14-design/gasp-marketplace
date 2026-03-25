'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Sparkles, Camera, Users, Send } from 'lucide-react';
import Header from '@/components/Header';

export default function NeuralBirth() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [visionPrompt, setVisionPrompt] = useState('');
    const [batchSize, setBatchSize] = useState(10);
    const [logs, setLogs] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        id: 'new-baddie',
        name: 'New Persona',
        ethnicity: 'Blasian',
        height: '5\'3"',
        body: 'Thick, Wide Hips',
        hair: 'Curly Obsidian',
        agency: 'Independent',
        personality: 'Spicy, Playful, Strategic',
        target_bin: 'feed',
        outfit: 'Pink velvet sweatsuit, cropped top.',
        manual_profile_url: ''
    });

    const handleBirth = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/factory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vibe_hint: formData.outfit,
                    agency_id: formData.agency.toLowerCase().replace(/\s+/g, '-'),
                    manual_profile_url: formData.manual_profile_url
                })
            });
            const data = await res.json();
            setResult(data);
            if (data.success) setStep(3);
        } catch (err: any) {
            alert('Birth Failure: ' + err.message);
        }
        setLoading(false);
    };

    const addLog = (msg: string) => {
        setLogs(prev => [...prev.slice(-9), `> ${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    const handleMassGenesis = async () => {
        if (!visionPrompt) return alert('Enter a vision, Commander.');
        setLoading(true);
        setLogs([]);
        addLog(`Initiating Syndicate Rush for ${batchSize} personas...`);
        
        const logSequence = [
            "Connecting to Neural Hub (GASP V16.2)...",
            "Channeling Gemini 2.0 Flash for identity brainstorming...",
            "Analyzing DNA Templates...",
            "Quota Check: Proceeding...",
            "Identities Brainstormed. Synchronizing...",
            "Initializing Grok Imagine Pro...",
            "Enforcing iPhone 16 Pro Camera...",
            "Baking Fashion Nova Aesthetic...",
            "Vault Strike: Slotting Suggestive Items...",
            "Permanent Ingestion active...",
            "Neural Birth Finalizing. Pushing to Feed..."
        ];

        let logIdx = 0;
        const interval = setInterval(() => {
            if (logIdx < logSequence.length) {
                addLog(logSequence[logIdx]);
                logIdx++;
            }
        }, 3500);

        try {
            const res = await fetch('/api/factory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    vision_prompt: visionPrompt,
                    agency_id: formData.agency.toLowerCase().replace(/\s+/g, '-'),
                    batch_size: batchSize
                })
            });
            const data = await res.json();
            clearInterval(interval);
            if (data.success) {
                addLog(`SUCCESS: ${data.count} personas born.`);
                setResult(data);
                setTimeout(() => setStep(3), 2000);
            } else {
                addLog(`FAILURE: ${data.message}`);
                alert('Sync Fail: ' + data.message);
            }
        } catch (e: any) { 
            clearInterval(interval);
            addLog(`ERROR: ${e.message}`);
            alert(e.message); 
        }
        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-obsidian text-white font-inter pb-20 pt-32 md:pt-48">
            <Header />
            
            <div className="container max-w-4xl mx-auto py-8 md:py-12 px-4 md:px-6">
                <div className="flex flex-col gap-2 mb-8 md:mb-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-neon-blue uppercase text-[9px] md:text-[10px] font-black tracking-widest italic">
                        <Zap size={14} /> Neural Genesis Node
                    </div>
                    <h1 className="text-4xl md:text-6xl font-outfit font-black italic uppercase tracking-tighter">
                        Persona <span className="text-neon-pink">Birth</span> Station
                    </h1>
                </div>

                <div className="bg-white/5 p-1 px-4 md:px-8 rounded-[2rem] md:rounded-[3rem] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-pink to-neon-blue animate-pulse" />
                    
                    <div className="py-12 space-y-10">
                        {/* 🏁 MASS GENESIS */}
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-neon-pink/5 border border-neon-pink/20 rounded-[2rem] space-y-6 relative group">
                            <div className="absolute top-0 right-10 -translate-y-1/2 bg-neon-pink text-black px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,0,127,0.4)] transition-transform group-hover:scale-110">
                                Syndicate Pulse Mode
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter text-white/90 flex items-center gap-3">
                                    <Sparkles className="text-neon-pink" size={24} /> Mass Genesis Vision
                                </h3>
                                <p className="text-[9px] md:text-[10px] text-white/30 uppercase tracking-[0.2em] leading-relaxed max-w-lg">
                                    Describe your wave. Hyper-Realism & Suggestive Injections Active.
                                </p>
                            </div>
                            <div className="flex flex-col md:flex-row gap-3">
                                <input 
                                    className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-6 py-4 md:py-5 text-sm font-medium focus:border-neon-pink transition-all outline-none min-h-[56px]"
                                    placeholder="e.g. 10 Thick Colombian Baddies..."
                                    value={visionPrompt}
                                    onChange={(e) => setVisionPrompt(e.target.value)}
                                />
                                <div className="flex gap-3">
                                    <div className="w-20 md:w-24">
                                        <input 
                                            type="number"
                                            value={batchSize}
                                            onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                                            className="w-full h-full bg-black/60 border border-white/10 rounded-2xl px-4 py-4 md:py-5 text-sm font-medium focus:border-neon-pink transition-all outline-none text-center"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleMassGenesis}
                                        disabled={loading}
                                        className="flex-1 md:px-10 bg-neon-pink text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,0,127,0.4)] disabled:opacity-30 border-2 border-white/20 py-4 md:py-0"
                                    >
                                        {loading ? 'PULSING...' : 'GENERATE'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        <div className="flex items-center gap-4 py-4">
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em]">Or Manual Single Birth</span>
                            <div className="flex-1 h-px bg-white/5" />
                        </div>

                        {step === 1 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Slug ID" value={formData.id} onChange={(v:any) => setFormData({...formData, id: v.toLowerCase()})} placeholder="kaelani-x" />
                                    <Input label="Public Name" value={formData.name} onChange={(v:any) => setFormData({...formData, name: v})} placeholder="Kaelani" />
                                    <Input label="Ethnicity" value={formData.ethnicity} onChange={(v:any) => setFormData({...formData, ethnicity: v})} placeholder="Blasian" />
                                    <Input label="Body Type" value={formData.body} onChange={(v:any) => setFormData({...formData, body: v})} placeholder="Thick, Wide Hips" />
                                    <Input label="Agency" value={formData.agency} onChange={(v:any) => setFormData({...formData, agency: v})} placeholder="Independent" />
                                    <Input label="Custom Profile Pic (Optional URL)" value={formData.manual_profile_url} onChange={(v:any) => setFormData({...formData, manual_profile_url: v})} placeholder="https://..." />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-white/30 px-1">Debut Outfit & Action</label>
                                    <input 
                                       className="bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm font-medium focus:border-neon-blue transition-all" 
                                       value={formData.outfit} 
                                       onChange={(e) => setFormData({...formData, outfit: e.target.value})}
                                    />
                                </div>
                                <button 
                                    onClick={() => setStep(2)}
                                    className="w-full py-6 bg-neon-blue text-black rounded-3xl text-sm font-black uppercase tracking-[0.4em] shadow-[0_0_60px_rgba(0,240,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all border-2 border-white/20"
                                >
                                    PROCEED TO CALIBRATION <Sparkles className="inline ml-2 mt--1" size={18} />
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-center py-10">
                                <Users size={60} className="mx-auto text-neon-pink animate-pulse" />
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Ready for Neural Binding?</h3>
                                <button 
                                    disabled={loading}
                                    onClick={handleBirth}
                                    className="w-full py-6 bg-neon-pink text-black rounded-3xl text-sm font-black uppercase tracking-[0.3em] shadow-[0_0_50px_rgba(255,0,127,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 border-2 border-white/20"
                                >
                                    {loading ? 'CALIBRATING...' : 'INITIATE NEURAL BIRTH'} <Send className="inline ml-2" size={16} />
                                </button>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 text-center">
                                <ShieldCheck className="text-green-500 mx-auto" size={40} />
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-green-500">Identity Active</h3>
                                <div className="flex gap-4">
                                    <a href="/admin/monitor" className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Open Monitor</a>
                                    <button onClick={() => { setStep(1); setLogs([]); }} className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">New Birth</button>
                                </div>
                            </motion.div>
                        )}

                        {/* 🔥 TERMINAL */}
                        {logs.length > 0 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-8">
                                <div className="bg-black/80 rounded-2xl border border-white/10 overflow-hidden font-mono shadow-inner">
                                    <div className="bg-white/5 px-4 py-2 border-b border-white/5 text-[9px] uppercase font-black text-white/20">Neural Trace Console</div>
                                    <div className="p-4 space-y-1.5 max-h-[200px] overflow-y-auto">
                                        {logs.map((log, i) => <div key={i} className="text-[10px] text-neon-blue/80 font-medium">{log}</div>)}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

function Input({ label, value, onChange, placeholder, disabled }: any) {
    return (
        <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] uppercase font-black tracking-widest text-white/30 px-1">{label}</label>
            <input 
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-neon-blue transition-all text-sm font-medium"
            />
        </div>
    );
}



