'use client';

/**
 * GASP GHOST ACTIVITY ENGINE v2.0
 * Makes the site feel ALIVE.
 * Shows real-looking social proof toasts: chats, vault unlocks, follows.
 * Mobile-first. Never blocks content. Subtle but powerful.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Lock, Heart, Eye, Zap } from 'lucide-react';

// ── USERNAME GENERATOR ────────────────────────────────────────────────────────
const PREFIXES = [
  'Miami', 'Brooklyn', 'ATL', 'NYC', 'LA', 'Chicago', 'Houston', 'Dallas',
  'London', 'Toronto', 'Dubai', 'Vegas', 'Boston', 'Bronx', 'Queens',
  'Philly', 'Phoenix', 'Denver', 'Baller', 'Real', 'Raw', 'Slick', 'Wave'
];
const SUFFIXES = [
  'Banger', 'Vibes', 'Grind', 'Flow', 'King', 'God', 'Wolf', 'Flex',
  'Heat', 'Ice', 'Cash', 'Gang', 'Boss', 'Plug', 'Mode', 'Drip',
  'Lord', 'Sauce', 'Haze', 'Rider', 'Star', 'Elite', 'Alpha'
];

function randomUsername(): string {
  const pre = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const suf = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  const num = Math.floor(Math.random() * 900) + 10;
  return `${pre}${suf}${num}`;
}

// ── PERSONA NAMES ─────────────────────────────────────────────────────────────
const PERSONA_NAMES = [
  'Isabella', 'Valeria', 'Elena', 'Bianca', 'Valentina', 'Ana', 'Sofia'
];
function randomPersona(): string {
  return PERSONA_NAMES[Math.floor(Math.random() * PERSONA_NAMES.length)];
}

// ── CITIES ────────────────────────────────────────────────────────────────────
const CITIES = [
  'Miami', 'New York', 'Atlanta', 'Los Angeles', 'Houston', 'Chicago',
  'Dallas', 'London', 'Toronto', 'Dubai', 'Toronto', 'Phoenix'
];
function randomCity(): string {
  return CITIES[Math.floor(Math.random() * CITIES.length)];
}

// ── ACTIVITY TEMPLATES ────────────────────────────────────────────────────────
interface ActivityEvent {
  id: string;
  icon: any;
  color: string;
  text: string;
}

function generateEvent(): ActivityEvent {
  const user = randomUsername();
  const persona = randomPersona();
  const city = randomCity();
  const id = `${Date.now()}-${Math.random()}`;

  const templates = [
    // Chat activity — most common (drives DM aspiration)
    { icon: MessageSquare, color: '#00f0ff', text: `${user} is chatting with ${persona} 💬` },
    { icon: MessageSquare, color: '#00f0ff', text: `Someone from ${city} just opened ${persona}'s chat` },
    { icon: MessageSquare, color: '#00f0ff', text: `${user} sent ${persona} a message 👀` },

    // Vault unlocks — social proof for sales
    { icon: Lock, color: '#ff00ff', text: `${user} unlocked ${persona}'s vault 🔒` },
    { icon: Lock, color: '#ff00ff', text: `Someone from ${city} unlocked premium content 💎` },
    { icon: Lock, color: '#ff00ff', text: `${user} just upgraded to access ${persona}'s archive 🔥` },

    // Scarcity / activity signals
    { icon: Eye, color: '#ffea00', text: `${Math.floor(Math.random() * 40) + 15} people viewing ${persona} right now` },
    { icon: Zap, color: '#ffea00', text: `${persona}'s vault is ${Math.floor(Math.random() * 20) + 75}% full — spots limited 💎` },

    // Hearts / follows
    { icon: Heart, color: '#ff4444', text: `${user} added ${persona} to favorites ❤️` },
    { icon: Heart, color: '#ff4444', text: `${user} from ${city} just followed ${persona}` },
  ];

  const t = templates[Math.floor(Math.random() * templates.length)];
  return { id, ...t };
}

export default function GhostActivityTicker() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  const pushEvent = useCallback(() => {
    const ev = generateEvent();
    setEvents(prev => [ev, ...prev].slice(0, 3)); // max 3 visible at once
    // Auto-dismiss after 5s
    setTimeout(() => {
      setEvents(prev => prev.filter(e => e.id !== ev.id));
    }, 5000);
  }, []);

  useEffect(() => {
    // First event: 4-8s after load (feels organic, not instant)
    const firstDelay = 4000 + Math.random() * 4000;
    const firstTimer = setTimeout(pushEvent, firstDelay);

    // Subsequent events: every 12-30s (realistic cadence)
    const interval = setInterval(() => {
      pushEvent();
    }, 12000 + Math.random() * 18000);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [pushEvent]);

  return (
    // Bottom-left on mobile, bottom-left on desktop — never covers the main CTA
    <div className="fixed bottom-20 left-3 md:bottom-8 md:left-6 z-[800] flex flex-col-reverse gap-2 pointer-events-none max-w-[240px] md:max-w-[300px]">
      <AnimatePresence>
        {events.map((ev) => {
          const Icon = ev.icon;
          return (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20 }}
              className="flex items-center gap-2.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${ev.color}15`, border: `1px solid ${ev.color}30` }}
              >
                <Icon size={12} style={{ color: ev.color }} />
              </div>
              <p className="text-[9px] font-black uppercase tracking-wide text-white/70 leading-tight">
                {ev.text}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}


