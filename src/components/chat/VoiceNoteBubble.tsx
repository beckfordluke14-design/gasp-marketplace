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
  onUnlockTranslation,
}: VoiceNoteBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [translationUnlocked, setTranslationUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);

  // Seeded waveform heights — deterministic per audio URL so it doesn't jump
  const barCount = 30;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const seed = (audioUrl.charCodeAt(i % audioUrl.length) + i * 17) % 100;
    return 20 + (seed / 100) * 60; // 20–80% height
  });

  useEffect(() => {
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
    if (!onUnlockTranslation || isUnlocking) return;
    setIsUnlocking(true);
    try {
      const success = await onUnlockTranslation();
      if (success) setTranslationUnlocked(true);
    } finally {
      setIsUnlocking(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const displayDuration = duration > 0 ? formatTime(isPlaying ? currentTime : duration) : '0:00';
  const ts = timestamp || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

  return (
    <div className="flex flex-col gap-2 max-w-[300px]">
      {/* MAIN BUBBLE */}
      <div className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-[1.4rem] px-3 py-2.5 min-w-[220px] shadow-lg backdrop-blur-md">
        {/* Play button */}
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#00f0ff]/20 border border-white/10 flex items-center justify-center shrink-0 transition-all active:scale-90"
        >
          {isPlaying
            ? <Pause size={14} className="text-white" />
            : <Play size={14} className="text-white ml-0.5" />
          }
        </button>

        {/* Waveform */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-end gap-[2px] h-7 relative">
            {bars.map((h, i) => {
              const barProgress = (i / barCount) * 100;
              const isFilled = barProgress <= progress;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors duration-75 ${
                    isFilled ? 'bg-[#00f0ff]' : 'bg-white/20'
                  }`}
                  style={{ height: `${h}%` }}
                />
              );
            })}
            {/* Green pulse dot when playing */}
            {isPlaying && (
              <div className="absolute -top-1 left-8 w-2 h-2 bg-[#00ff41] rounded-full shadow-[0_0_8px_rgba(0,255,65,0.8)] animate-pulse" />
            )}
          </div>

          {/* Duration + Timestamp */}
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[9px] font-mono text-white/40">{displayDuration}</span>
            <span className="text-[9px] text-white/30">{ts}</span>
          </div>
        </div>

        {/* Persona avatar + mic badge */}
        {personaImage && (
          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 shrink-0 relative">
            <PersonaAvatar
              src={personaImage}
              alt={personaName || ''}
            />
            {/* Mic badge */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00f0ff] rounded-full flex items-center justify-center">
              <svg width="7" height="9" viewBox="0 0 7 9" fill="none">
                <rect x="2" y="0" width="3" height="5.5" rx="1.5" fill="black"/>
                <path d="M0.5 4.5C0.5 6.43 1.84 8 3.5 8C5.16 8 6.5 6.43 6.5 4.5" stroke="black" strokeWidth="1" strokeLinecap="round"/>
                <line x1="3.5" y1="8" x2="3.5" y2="9" stroke="black" strokeWidth="1"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* TRANSLATION UNLOCK ROW */}
      {translation && (
        <div className="px-1">
          {translationUnlocked ? (
            /* Revealed translation */
            <div className="flex items-start gap-2 px-3 py-2 bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-xl">
              <LockOpen size={10} className="text-[#00f0ff] mt-0.5 shrink-0" />
              <p className="text-[10px] text-white/70 leading-relaxed italic">"{translation}"</p>
            </div>
          ) : (
            /* Locked — coin CTA */
            <button
              onClick={handleUnlockTranslation}
              disabled={isUnlocking}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] hover:bg-[#ff00ff]/10 border border-white/10 hover:border-[#ff00ff]/30 rounded-xl transition-all w-full group"
            >
              <Languages size={11} className="text-[#ff00ff] shrink-0" />
              <span className="text-[9px] font-black uppercase tracking-wider text-white/40 group-hover:text-white/70 transition-colors flex-1 text-left">
                {isUnlocking ? 'unlocking...' : 'decode what she said'}
              </span>
              <span className="text-[9px] font-black text-[#ff00ff] shrink-0">10 credits</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}



