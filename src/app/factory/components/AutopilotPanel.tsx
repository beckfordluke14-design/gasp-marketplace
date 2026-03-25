'use client';

import { useState, useEffect, useRef } from 'react';
import { Zap, Power, RefreshCcw, Activity, Film, Lock, Smartphone, Image as ImageIcon, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CONTENT_MIX = [
  { type: 'casual_selfie', label: 'Casual Selfie',  icon: Smartphone },
  { type: 'gym',           label: 'Gym / Active',   icon: Activity },
  { type: 'editorial',     label: 'Editorial',      icon: ImageIcon },
  { type: 'night_out',     label: 'Night Out',      icon: Zap },
  { type: 'cozy',          label: 'Cozy Mood',      icon: Film },
  { type: 'vault',         label: 'Vault Item',     icon: Lock },
];

const FREQUENCY_OPTIONS = [
  { label: '30 min',  ms: 30 * 60 * 1000 },
  { label: '1 hour',  ms: 60 * 60 * 1000 },
  { label: '2 hours', ms: 2 * 60 * 60 * 1000 },
  { label: '4 hours', ms: 4 * 60 * 60 * 1000 },
  { label: '6 hours', ms: 6 * 60 * 60 * 1000 },
];

export default function AutopilotPanel() {
  const [enabled, setEnabled]           = useState(false);
  const [postsPerRun, setPostsPerRun]   = useState(3);
  const [frequencyMs, setFrequencyMs]   = useState(FREQUENCY_OPTIONS[1].ms);
  const [includeStories, setIncludeStories] = useState(true);
  const [includeVault, setIncludeVault]     = useState(true);
  const [rotationIndex, setRotationIndex]   = useState(0);
  const [logs, setLogs]                 = useState<string[]>(['[autopilot] system standing by...']);
  const [isRunning, setIsRunning]       = useState(false);
  const [runCount, setRunCount]         = useState(0);
  const [lastRun, setLastRun]           = useState<string | null>(null);
  const [countdown, setCountdown]       = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (msg: string) =>
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));

  // ── TRIGGER ONE RUN ──────────────────────────────────────────────
  const fireRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    addLog('🚀 firing autopilot run...');
    try {
      const res = await fetch('/api/factory/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts_per_run: postsPerRun, include_stories: includeStories, include_vault: includeVault, rotation_index: rotationIndex })
      });
      const data = await res.json();
      if (data.status === 'done') {
        setRotationIndex(data.rotation_index || 0);
        setRunCount(c => c + 1);
        setLastRun(new Date().toLocaleTimeString());
        (data.logs || []).forEach((l: string) => addLog(l));
        addLog(`✅ run complete — ${data.results?.length || 0} pieces of content live`);
      } else {
        addLog(`⚠️ ${data.message || 'run failed'}`);
      }
    } catch (e: any) {
      addLog(`[error] ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // ── AUTOPILOT LOOP ───────────────────────────────────────────────
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (!enabled) { setCountdown(0); return; }

    // Immediate first run when turned on
    fireRun();
    setCountdown(frequencyMs / 1000);

    intervalRef.current = setInterval(() => {
      fireRun();
      setCountdown(frequencyMs / 1000);
    }, frequencyMs);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [enabled, frequencyMs]);

  // Format countdown
  const countdownStr = countdown > 0
    ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`
    : '--:--';

  return (
    <div className="space-y-8">
      {/* ── MASTER SWITCH ── */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#050505] p-8">
        {enabled && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff00ff]/5 via-transparent to-[#00f0ff]/5 animate-pulse pointer-events-none" />
        )}
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-400 animate-ping' : 'bg-white/10'}`} />
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">
                {enabled ? 'AUTOPILOT ACTIVE' : 'AUTOPILOT OFFLINE'}
              </span>
            </div>
            <h2 className="text-2xl font-syncopate font-black uppercase italic tracking-tighter">
              Content <span className={enabled ? 'text-[#ff00ff]' : 'text-white/20'}>Machine</span>
            </h2>
            {enabled && (
              <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1">
                next run in <span className="text-[#00f0ff] font-black">{countdownStr}</span>
                {lastRun && <> · last run <span className="text-white/50">{lastRun}</span></>}
                {runCount > 0 && <> · <span className="text-[#ffea00] font-black">{runCount} runs</span> this session</>}
              </p>
            )}
          </div>

          {/* BIG POWER BUTTON */}
          <button
            onClick={() => setEnabled(e => !e)}
            className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center transition-all shadow-2xl ${
              enabled
                ? 'bg-[#ff00ff] shadow-[0_0_60px_rgba(255,0,255,0.6)] hover:scale-95 active:scale-90'
                : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105'
            }`}
          >
            <Power size={32} className={enabled ? 'text-black' : 'text-white/30'} />
          </button>
        </div>
      </div>

      {/* ── SETTINGS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Posts per run */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ffea00]">Posts Per Run</h3>
            <span className="text-2xl font-syncopate font-black text-white">{postsPerRun}</span>
          </div>
          <input
            type="range" min={1} max={10} value={postsPerRun}
            onChange={e => setPostsPerRun(Number(e.target.value))}
            className="w-full accent-[#ff00ff]"
          />
          <p className="text-[8px] text-white/20 uppercase tracking-widest">
            {postsPerRun} posts × all active personas per trigger
          </p>
        </div>

        {/* Frequency */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#00f0ff]">Run Frequency</h3>
          <div className="grid grid-cols-3 gap-2">
            {FREQUENCY_OPTIONS.map(opt => (
              <button
                key={opt.ms}
                onClick={() => setFrequencyMs(opt.ms)}
                className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                  frequencyMs === opt.ms
                    ? 'bg-[#00f0ff] text-black'
                    : 'bg-white/5 text-white/30 hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT MIX TOGGLES ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Content Mix</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Stories toggle */}
          <button
            onClick={() => setIncludeStories(s => !s)}
            className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all text-[8px] font-black uppercase tracking-widest ${
              includeStories ? 'bg-[#ffea00]/10 border-[#ffea00]/30 text-[#ffea00]' : 'bg-white/5 border-white/5 text-white/20'
            }`}
          >
            <Activity size={16} />
            Stories
          </button>

          {/* Vault toggle */}
          <button
            onClick={() => setIncludeVault(v => !v)}
            className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all text-[8px] font-black uppercase tracking-widest ${
              includeVault ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/5 text-white/20'
            }`}
          >
            <Lock size={16} />
            Vault Items
          </button>

          {/* Shot type indicators (read-only rotation display) */}
          {CONTENT_MIX.filter(c => c.type !== 'vault').map((c, i) => {
            const Icon = c.icon;
            const isCurrent = i === (rotationIndex % 5);
            return (
              <div
                key={c.type}
                className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-1.5 border text-[8px] font-black uppercase tracking-widest transition-all ${
                  isCurrent && enabled ? 'bg-[#ff00ff]/10 border-[#ff00ff]/30 text-[#ff00ff]' : 'bg-white/5 border-white/5 text-white/20'
                }`}
              >
                <Icon size={16} />
                {c.label}
                {isCurrent && enabled && <span className="text-[6px] text-[#ff00ff] animate-pulse">→ NEXT</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MANUAL FIRE BUTTON ── */}
      <button
        onClick={fireRun}
        disabled={isRunning}
        className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all ${
          isRunning
            ? 'bg-white/5 text-white/20 animate-pulse'
            : 'bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30'
        }`}
      >
        <RefreshCcw size={14} className={isRunning ? 'animate-spin' : ''} />
        {isRunning ? 'Generating Content...' : 'Fire One Run Now'}
      </button>

      {/* ── NEURAL LOGS ── */}
      <div className="bg-black border border-white/5 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Autopilot Logs</h3>
          <button onClick={() => setLogs(['[autopilot] logs cleared.'])} className="text-[7px] text-white/20 hover:text-white uppercase tracking-widest">Clear</button>
        </div>
        <div className="space-y-1 h-40 overflow-y-auto no-scrollbar font-mono">
          {logs.map((log, i) => (
            <p key={i} className={`text-[9px] truncate ${log.includes('error') || log.includes('⚠️') ? 'text-red-400' : log.includes('✅') || log.includes('📡') || log.includes('🔒') ? 'text-green-400' : 'text-white/30'}`}>
              {log}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}



