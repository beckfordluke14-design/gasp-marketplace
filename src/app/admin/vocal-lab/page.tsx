'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Terminal, Settings, AlertTriangle, Play, Pause, Activity, Cpu, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 🛰️ SOVEREIGN VOCAL AUDIT LAB (V4.11)
 * Secret administrative interface for real-time Gemini 2.5 TTS debugging.
 * Bypasses all standard economy and forced voice-note probability.
 */
export default function VocalLabPage() {
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState<any[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
    const [audioError, setAudioError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 🧬 SOVEREIGN IDENTITY: Astra (The Neural Auditor)
    const ADMIN_PERSONA_ID = 'astra-auditor';

    const addLog = (type: string, message: string, data?: any) => {
        setLogs(prev => [...prev, { 
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            type, 
            message, 
            data 
        }]);
    };

    const sendAuditRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userText = input;
        setInput('');
        setIsThinking(true);
        setAudioError(null);
        addLog('USER', userText);

        try {
            addLog('SYSTEM', '🛰️ Initiating forced 3.2 High-Heat Synthesis...');
            
            const start = Date.now();
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: userText }],
                    userId: 'admin-auditor-root',
                    personaId: ADMIN_PERSONA_ID,
                    forceVoice: true // 🛡️ GLOBAL BYPASS: Always return audio
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                addLog('ERROR', `📡 API Rejection (${res.status}): ${errText}`);
                setIsThinking(false);
                return;
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            
            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const lines = decoder.decode(value).split('\n');
                for (const line of lines) {
                    if (line.startsWith('0:')) {
                        addLog('ASTRA', JSON.parse(line.slice(2)));
                    } else if (line.startsWith('2:')) {
                        const event = JSON.parse(line.slice(2));
                        if (event.type === 'voice_note' && event.audioUrl) {
                            const latency = Date.now() - start;
                            addLog('SYNTH', `✅ Audio Node Ready (${latency}ms)`, event);
                            handleAutoPlay(event.audioUrl);
                        } else if (event.type === 'voice_failed') {
                            addLog('FATAL', '❌ Synthesis Engine Timeout', event.error);
                        }
                    }
                }
            }
        } catch (err: any) {
            addLog('ERROR', `🛸 Connection Lost: ${err.message}`);
        } finally {
            setIsThinking(false);
        }
    };

    const handleAutoPlay = (url: string) => {
       try {
           if (currentAudio) {
               currentAudio.pause();
               currentAudio.currentTime = 0;
           }
           const audio = new Audio(url);
           setCurrentAudio(audio);
           audio.play().catch(e => {
               setAudioError(`🚫 Browser Autoplay Blocked: ${e.message}`);
               addLog('PLAY_ERR', 'Browser prevented instant playback. Click manual play.', e.message);
           });
       } catch (err: any) {
           setAudioError(`💥 Audio Buffer Crash: ${err.message}`);
       }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [logs]);

    return (
        <div className="min-h-screen bg-[#050505] text-[#00f0ff] font-mono p-4 md:p-8 flex flex-col gap-6">
            
            {/* 🛰️ HEADER: MISSION CONTROL */}
            <div className="flex items-center justify-between border-b border-[#00f0ff]/20 pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-[#00f0ff] flex items-center justify-center animate-pulse">
                        <Terminal size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter uppercase italic">Vocal Lab · V4.11</h1>
                        <p className="text-[10px] text-[#00f0ff]/40 font-bold uppercase tracking-widest">Sovereign Neural Auditor Fleet</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-[#ff00ff]">ENGINE STATUS</span>
                        <div className="flex items-center gap-2">
                             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                             <span className="text-xs">GEMINI_2.5_STABLE</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-[#ffea00]">HEAT STANDARD</span>
                        <span className="text-xs">3.2 THEIPIAN</span>
                    </div>
                </div>
            </div>

            {/* 🏛️ TERMINAL ENGINE: LIVE FEED */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                
                {/* LOGS: THE AUDIT TRAIL */}
                <div ref={scrollRef} className="flex-1 bg-black/40 border border-[#00f0ff]/10 rounded-2xl p-6 overflow-y-auto no-scrollbar flex flex-col gap-4">
                    {logs.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full opacity-20 gap-4">
                            <Activity size={48} />
                            <p className="text-xs uppercase tracking-[0.2em] font-black">Waiting for neural handshake...</p>
                        </div>
                    )}
                    {logs.map(log => (
                        <div key={log.id} className={`p-4 rounded-xl border ${
                            log.type === 'ASTRA' ? 'bg-[#00f0ff]/5 border-[#00f0ff]/20' : 
                            log.type === 'SYNTH' ? 'bg-green-500/5 border-green-500/20 text-green-400' :
                            log.type === 'ERROR' || log.type === 'FATAL' || log.type === 'PLAY_ERR' ? 'bg-red-500/5 border-red-500/20 text-red-500 animate-pulse' :
                            'bg-white/5 border-white/10 text-white/60'
                        }`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded ${
                                     log.type === 'ASTRA' ? 'bg-[#00f0ff] text-black' : 
                                     log.type === 'SYNTH' ? 'bg-green-500 text-black' :
                                     log.type === 'ERROR' ? 'bg-red-500 text-white' : 'bg-white/10'
                                }`}>{log.type}</span>
                                <span className="text-[8px] opacity-40">{log.timestamp}</span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed underline-offset-4 decoration-dotted decoration-[#00f0ff]/20">
                                {log.message}
                            </p>
                            {log.data && (
                                <pre className="mt-3 text-[10px] bg-black/60 p-3 rounded-lg border border-white/5 text-white/30 overflow-x-auto">
                                    {JSON.stringify(log.data, null, 2)}
                                </pre>
                            )}
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl animate-pulse text-[#00f0ff]/40">
                             <Cpu size={16} className="animate-spin" />
                             <span className="text-xs uppercase tracking-widest font-black italic">Astra is refining vocal DNA at 3.2 heat...</span>
                        </div>
                    )}
                </div>

                {/* SIDEBAR: SYSTEM STATS & PLAYBACK */}
                <div className="w-full md:w-80 flex flex-col gap-6">
                    
                    {/* PLAYER NODE */}
                    <div className="bg-[#111] border border-[#00f0ff]/20 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,240,255,0.05)]">
                        <div className="flex items-center gap-3 mb-6">
                            <Settings size={18} />
                            <h3 className="text-xs font-black uppercase tracking-widest underline decoration-[#ff00ff]">Active Synthesis</h3>
                        </div>

                        {currentAudio ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-center">
                                    <button 
                                        onClick={() => currentAudio.paused ? currentAudio.play() : currentAudio.pause()}
                                        className="w-20 h-20 rounded-full border-2 border-[#00f0ff] flex items-center justify-center text-[#00f0ff] hover:bg-[#00f0ff]/10 transition-all shadow-[0_0_30px_#00f0ff44]"
                                    >
                                        <Play size={40} className="ml-2" />
                                    </button>
                                </div>
                                <div className="bg-black/60 p-4 rounded-xl border border-white/5 space-y-3">
                                    <p className="text-[9px] text-white/30 font-black mb-1">DATA URI SOURCE</p>
                                    <p className="text-[8px] truncate opacity-50">{currentAudio.src}</p>
                                    <a 
                                      href={currentAudio.src} 
                                      download={`vocal_audit_${Date.now()}.mp3`}
                                      className="flex items-center justify-center gap-2 w-full py-2 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-lg text-[9px] font-black uppercase text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black transition-all"
                                    >
                                       EXPORT NODE
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center border border-dashed border-white/10 rounded-xl opacity-20">
                                <p className="text-[10px] uppercase font-black tracking-widest">No audio generated</p>
                            </div>
                        )}

                        {audioError && (
                            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/40 rounded-xl flex gap-3 text-red-500">
                                <AlertTriangle size={18} className="shrink-0" />
                                <p className="text-[10px] font-black uppercase leading-tight">{audioError}</p>
                            </div>
                        )}
                    </div>

                    {/* REDEPLOY CHECKLIST */}
                    <div className="bg-black/80 border border-white/5 rounded-2xl p-6 flex-1">
                         <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                             <ShieldAlert size={14} className="text-[#ffea00]" /> High-Heat Audit Checklist
                         </h3>
                         <div className="space-y-5">
                            {[
                                { t: 'GOOGLE_BRAIN_KEY', s: 'Verified (New Key)' },
                                { t: 'SYNTHESIS_MODEL', s: '2.5-pro-preview-tts' },
                                { t: 'REFINER_MODEL', s: '1.5-flash-acting' },
                                { t: 'HEAT_PROFILE', s: '3.2 Overdriven' }
                            ].map(item => (
                                <div key={item.t} className="flex flex-col gap-1 border-l-2 border-[#00f0ff]/20 pl-4 py-1">
                                    <span className="text-[8px] font-black text-[#00f0ff]/40 uppercase tracking-tighter">{item.t}</span>
                                    <span className="text-[11px] font-bold text-white uppercase italic">{item.s}</span>
                                </div>
                            ))}
                         </div>
                    </div>

                </div>
            </div>

            {/* ⌨️ COMMAND INPUT */}
            <form onSubmit={sendAuditRequest} className="relative mt-auto">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="ENTER NEURAL TEST QUERY..."
                    className="w-full bg-[#111] border-2 border-[#00f0ff]/40 rounded-full py-5 px-8 pl-16 outline-none focus:border-[#00f0ff] focus:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all uppercase font-black text-[#00f0ff] placeholder:text-[#00f0ff]/20 italic"
                />
                <Mic size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#00f0ff]" />
                <button 
                  type="submit"
                  disabled={!input.trim() || isThinking}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 px-8 bg-[#00f0ff] text-black rounded-full font-black uppercase text-[10px] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_#00f0ff] disabled:opacity-20"
                >
                    SYNTHESIZE
                </button>
            </form>
        </div>
    );
}
