'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Languages, LockOpen } from 'lucide-react';
import Image from 'next/image';
import PersonaAvatar from '../persona/PersonaAvatar';

interface VoiceNoteBubbleProps {
  audioUrl: string;
  personaImage?: string;
  personaName?: string;
  durationSeconds?: number;
  timestamp?: string;
  translation?: string;              // Locked English translation (from DB)
  isUnlocked?: boolean;              // Persistence: is this node already decoded?
  onUnlockTranslation?: () => Promise<boolean>; // Returns true if spend succeeded
}

/**
 * GASP VOICE NOTE BUBBLE
 * WhatsApp-style audio player with waveform bars + translation unlock.
 * Audio plays FREE in native language.
 * Translation = 10 credits (the core voice note monetization mechanic).
 */
export default function VoiceNoteBubble({
  audioUrl,
  personaImage,
  personaName,
  durationSeconds,
  timestamp,
  translation,
  isUnlocked,
  onUnlockTranslation,
}: VoiceNoteBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [translationUnlocked, setTranslationUnlocked] = useState(isUnlocked || false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);

  // Seeded waveform heights — deterministic per audio URL so it doesn't jump
  // Seeded waveform heights
  const barCount = 35;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const seed = (audioUrl.charCodeAt(i % audioUrl.length) + i * 23) % 100;
    return 15 + (seed / 100) * 70; // 15–85% height
  });

  useEffect(() => {
    if (!audioUrl || audioUrl === '') return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      cancelAnimationFrame(animFrameRef.current);
    });
    return () => {
      audio.pause();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioUrl]);

  const tick = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    setProgress(pct);
    setCurrentTime(audio.currentTime);
    if (!audio.paused) animFrameRef.current = requestAnimationFrame(tick);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      cancelAnimationFrame(animFrameRef.current);
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      animFrameRef.current = requestAnimationFrame(tick);
    }
  };

  const handleUnlockTranslation = async () => {
    if (isUnlocking || translationUnlocked) return;
    setIsUnlocking(true);
    // 🧬 SOVEREIGN SYNC: Deducting credits for neural decode
    try {
        if (onUnlockTranslation) {
            const success = await onUnlockTranslation();
            if (success) setTranslationUnlocked(true);
        } else {
            // Mock success for testing if no callback passed
            setTranslationUnlocked(true);
        }
    } finally {
        setIsUnlocking(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const displayDuration = duration > 0 ? formatTime(duration) : '0:04';
  const ts = timestamp || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

  return (
    <div className="flex flex-col gap-3 max-w-full w-[310px]">
      {/* 🧬 MAIN AUDIO HUB: NEON SYNCED PILL */}
      <div className="bg-[#111] border border-white/5 rounded-[2rem] p-5 shadow-2xl relative group pb-7">
        <div className="flex items-center gap-4">
            {/* PLAY BUTTON PORTAL */}
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center shrink-0 transition-all active:scale-90"
            >
              {isPlaying
                ? <Pause size={18} className="text-white fill-current" />
                : <Play size={18} className="text-white fill-current ml-1" />
              }
            </button>

            {/* WAVEFORM ENGINE */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-end gap-[3px] h-9 relative">
                {bars.map((h, i) => {
                  const barProgress = (i / barCount) * 100;
                  const isFilled = barProgress <= progress;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        isFilled ? 'bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]' : 'bg-white/10'
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  );
                })}
              </div>

                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/20 tracking-widest">{displayDuration}</span>
                    <span className="text-[10px] text-white/10 font-black">{ts}</span>
                </div>
            </div>

            {/* CHARACTER IDENTITY NODE */}
            <div className="relative shrink-0 ml-2">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/5 shadow-xl">
                    <PersonaAvatar src={personaImage || '/v1.png'} alt="Lila" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00f0ff] border-2 border-black flex items-center justify-center shadow-[0_0_10px_#00f0ff]">
                    <Mic size={8} className="text-black" />
                </div>
            </div>
        </div>
      </div>

      {/* 🧬 DECODE PORTAL: MONETIZATION NODE */}
      {translation && (
        <div className="px-1 -mt-7 relative z-10 mx-4">
          {translationUnlocked ? (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
               <p className="text-[13px] text-white leading-relaxed font-medium italic">"{translation}"</p>
            </motion.div>
          ) : (
            <button
              onClick={handleUnlockTranslation}
              disabled={isUnlocking}
              className="w-full h-10 px-5 bg-zinc-900 border border-white/10 hover:border-[#ff00ff]/40 rounded-full flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-3">
                 <Languages size={14} className="text-[#ff00ff]" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#ff00ff]">DECODE WHAT SHE SAID</span>
              </div>
              <span className="text-[10px] font-black text-[#ff00ff]">10 credits</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}



