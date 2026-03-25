'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Plus, Globe, Zap, ShieldCheck } from 'lucide-react';
import Header from '@/components/Header';

// Use env variables
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

export default function AdminProfiles() {
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        country: '',
        flag: '🇨🇴',
        vibe: '',
        image: '/v1.png',
        status: 'online',
        system_prompt: '',
        model_id: 'meta-llama/llama-3-8b-instruct',
        is_highlighted: false,
        ethnicity: '',
        hair_style: '',
        body_type: 'curvy',
        visual_description: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const { error } = await supabase.from('profiles').upsert([formData]);

        if (error) {
            setMessage(`Error: ${error.message}`);
        } else {
            setMessage('Identity Published Successfully! 🚀');
        }
        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-obsidian text-white font-inter pb-20">
            <Header />
            
            <div className="container max-w-7xl mx-auto py-12 px-6">
                <div className="flex items-center justify-between mb-12">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-neon-blue uppercase text-[10px] font-black tracking-widest italic">
                            <ShieldCheck size={14} />
                            Elite Control Panel
                        </div>
                        <h1 className="text-4xl font-outfit font-black italic uppercase italic tracking-tighter">
                            Identity <span className="text-neon-pink">Architect</span>
                        </h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Column 1: Core Identity */}
                    <div className="space-y-8 bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-2xl">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-2 mb-6">
                            <Globe size={14} /> Core Identity
                        </h3>
                        <Input label="ID Slug" value={formData.id} onChange={(v: string) => setFormData({...formData, id: v.toLowerCase()})} placeholder="valeria" required />
                        <Input label="Public Name" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} placeholder="Valeria" required />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Country" value={formData.country} onChange={(v: string) => setFormData({...formData, country: v})} placeholder="Colombia" required />
                            <Input label="Flag" value={formData.flag} onChange={(v: string) => setFormData({...formData, flag: v})} placeholder="🇨🇴" required />
                        </div>
                        <Input label="Public Vibe / Hook" value={formData.vibe} onChange={(v: string) => setFormData({...formData, vibe: v})} placeholder="Voluptuous and energetic..." required />
                        <Input label="Model Image / Portrait" value={formData.image} onChange={(v: string) => setFormData({...formData, image: v})} placeholder="/v1.png" required />
                    </div>

                    {/* Column 2: Visual DNA (Consistency) */}
                    <div className="space-y-8 bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-2xl">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-blue/60 flex items-center gap-2 mb-6">
                            <ShieldCheck size={14} /> Visual DNA (Consistency)
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Ethnicity" value={formData.ethnicity} onChange={(v: string) => setFormData({...formData, ethnicity: v})} placeholder="Afro-Latina" />
                            <Input label="Hair Style" value={formData.hair_style} onChange={(v: string) => setFormData({...formData, hair_style: v})} placeholder="Long Curly Dark" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30 px-1">Body Type Profile</label>
                            <select 
                                value={formData.body_type}
                                onChange={e => setFormData({...formData, body_type: e.target.value})}
                                className="bg-black/60 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-all text-sm font-medium"
                            >
                                <option value="curvy">Curvy / Voluptuous</option>
                                <option value="slim-thicc">Slim-Thicc</option>
                                <option value="athletic">Athletic / Toned</option>
                                <option value="slim">Slim</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30 px-1">Detailed Visual Characteristics (Mental Map)</label>
                            <textarea 
                                rows={6}
                                value={formData.visual_description}
                                onChange={e => setFormData({...formData, visual_description: e.target.value})}
                                placeholder="Almond eyes, caramel skin, beauty mark on left cheek, likes to wear oversized hoodies..."
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-neon-blue transition-all text-xs leading-relaxed italic placeholder:text-white/10"
                            />
                        </div>
                    </div>

                    {/* Column 3: LLM / AI Config */}
                    <div className="space-y-8 bg-neon-pink/5 p-8 rounded-[2rem] border border-neon-pink/10 backdrop-blur-md shadow-2xl">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-pink/60 flex items-center gap-2 mb-6">
                            <Zap size={14} fill="currentColor" /> AI Neural Config (LLM)
                        </h3>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30 px-1">Brain / LLM Engine</label>
                            <select 
                                value={formData.model_id}
                                onChange={e => setFormData({...formData, model_id: e.target.value})}
                                className="bg-black/60 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-neon-pink transition-all text-sm font-medium"
                            >
                                <option value="meta-llama/llama-3-8b-instruct">Llama 3 (8B) - Ultra Fast</option>
                                <option value="meta-llama/llama-3-70b-instruct">Llama 3 (70B) - Pro Logic</option>
                                <option value="mistralai/mistral-7b-instruct">Mistral Elite</option>
                                <option value="google/gemini-pro-1.5">Gemini 1.5 Pro</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30 px-1">System Persona (Mental Script)</label>
                            <textarea 
                                rows={10}
                                value={formData.system_prompt}
                                onChange={e => setFormData({...formData, system_prompt: e.target.value})}
                                placeholder="You are [Name]..."
                                className="bg-black/60 border border-white/20 rounded-xl px-4 py-4 outline-none focus:border-neon-pink transition-all text-xs leading-relaxed font-mono"
                                required
                            />
                        </div>
                        <button 
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 px-10 py-5 bg-neon-pink text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_50px_rgba(255,0,127,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4"
                        >
                            {loading ? 'INFUSING BRAIN...' : (
                                <>
                                    PUBLISH IDENTITY <Plus size={16} />
                                </>
                            )}
                        </button>
                        {message && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-center text-[10px] font-black uppercase tracking-widest ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                                {message}
                            </motion.p>
                        )}
                    </div>
                </form>
            </div>
        </main>
    );
}

function Input({ label, value, onChange, required, placeholder }: any) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30 px-1">{label}</label>
            <input 
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                required={required}
                placeholder={placeholder}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-pink transition-all text-sm font-medium"
            />
        </div>
    )
}



