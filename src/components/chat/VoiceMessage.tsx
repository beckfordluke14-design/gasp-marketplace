'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoiceMessageProps {
    audioUrl?: string; // If undefined, it's rendering/recording
    isLocked?: boolean;
    unlockCost?: number;
    onUnlock?: () => void;
    personaName: string;
}

export default function VoiceMessage({ audioUrl, isLocked = false, unlockCost = 49, onUnlock, personaName }: VoiceMessageProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Simulate animated waveform bars
    const waveSticks = Array.from({ length: 30 }).map(() => Math.random() * 60 + 20);

    const togglePlay = () => {
        if (isLocked || !audioUrl || !audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    return (
        <div className="relative w-full max-w-[280px] rounded-2xl bg-black/40 border border-white/5 backdrop-blur-xl p-3 flexItems-center overflow-hidden">
            {/* AUDIO ELEMENT */}
            {audioUrl && (
                <audio 
                    ref={audioRef} 
                    src={audioUrl} 
                    onEnded={() => setIsPlaying(false)}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                />
            )}

            {/* FROSTED PAYWALL OVERLAY */}
            {isLocked && (
                <div className="absolute inset-0 z-10 backdrop-blur-md bg-black/60 flex flex-col items-center justify-center border border-[#00f0ff]/20 cursor-pointer hover:bg-black/40 transition" onClick={onUnlock}>
                    <Lock size={16} className="text-[#00f0ff] mb-1" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-white/90">Unlock w/ {unlockCost} PTS</span>
                </div>
            )}

            <div className={`flex items-center gap-3 w-full ${isLocked ? 'blur-sm opacity-50' : ''}`}>
                
                {/* PLAY/PAUSE OR RECORDING STATUS BUTTON */}
                <button 
                    onClick={togglePlay}
                    className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black transition-colors"
                >
                    {!audioUrl ? (
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1] }} 
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="h-3 w-3 rounded-full bg-[#ff003c]"
                        />
                    ) : isPlaying ? (
                        <Pause size={16} fill="currentColor" />
                    ) : (
                        <Play size={16} fill="currentColor" className="ml-1" />
                    )}
                </button>

                {/* THE WAVEFORM */}
                <div className="flex-1 flex items-center justify-between h-8 overflow-hidden gap-[2px]">
                    {!audioUrl ? (
                        // RECORDING STATE
                        <div className="flex flex-col">
                            <span className="text-[10px] text-[#ff003c] font-bold uppercase tracking-widest">{personaName} is recording...</span>
                            <span className="text-[9px] text-white/30 hidden">Simulated Neural Link</span>
                        </div>
                    ) : (
                        // AUDIO READY STATE
                        waveSticks.map((height, i) => (
                            <motion.div
                                key={i}
                                className="w-[3px] rounded-full bg-[#00f0ff]/50"
                                animate={{
                                    height: isPlaying ? [height * 0.4, height, height * 0.4] : height * 0.4,
                                    backgroundColor: isPlaying ? '#00f0ff' : 'rgba(0, 240, 255, 0.3)'
                                }}
                                transition={{
                                    repeat: isPlaying ? Infinity : 0,
                                    duration: 0.8 + Math.random() * 0.5,
                                    ease: "easeInOut",
                                    delay: i * 0.05
                                }}
                            />
                        ))
                    )}
                </div>

                {/* DURATION */}
                {audioUrl && (
                    <div className="text-[9px] font-mono text-white/40 shrink-0">
                        {duration > 0 ? `0:0${Math.floor(duration)}` : '0:00'}
                    </div>
                )}
            </div>
        </div>
    );
}



