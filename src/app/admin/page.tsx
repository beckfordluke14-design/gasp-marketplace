'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert, Zap, Star, Trash2, LayoutDashboard, Baby, Activity,
  ArrowRight, Film, Users, BarChart2, ClipboardList, Camera, FileCheck, Layers, Fuel
} from 'lucide-react';
import Header from '@/components/Header';

/**
 * GASP SYNDICATE: COMMAND HUB (V11)
 * All tools visible. Complete administrative oversight.
 */

interface Tool {
  label: string;
  description: string;
  href?: string;
  action?: () => void;
  icon: React.ReactNode;
  color: string;
  cta: string;
  ctaIcon?: React.ReactNode;
  glow?: string;
}

export default function AdminHub() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [engine, setEngine] = useState('gemini'); // Default to gemini per user request

  useEffect(() => {
    setIsAdmin(document.cookie.includes('admin_gasp_override=granted'));
    
    // Fetch current system engine config
    fetch('/api/admin/config?key=neural_engine')
      .then(res => res.json())
      .then(data => {
        if (data.value) setEngine(data.value);
      });
  }, []);

  const toggleAdmin = () => {
    if (isAdmin) {
      document.cookie = 'admin_gasp_override=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      setIsAdmin(false);
    } else {
      document.cookie = 'admin_gasp_override=granted; path=/; max-age=31536000;';
      setIsAdmin(true);
    }
  };

  const setSystemEngine = async (val: string) => {
    const adminKey = localStorage.getItem('admin_gasp_key');
    setEngine(val);
    await fetch('/api/admin/config', { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-key': adminKey || ''
      },
      body: JSON.stringify({ key: 'neural_engine', value: val }) 
    });
  };

  const saveAdminKey = (key: string) => {
    localStorage.setItem('admin_gasp_key', key);
    // Refresh the page or state if needed
  };

  const tools: Tool[] = [
    {
      label: 'Post Studio',
      description: 'Manage every post: toggle vault/hero, edit captions, merge posts together to attach text to media, and manage visibility.',
      href: '/admin/posts',
      icon: <Film size={20} />,
      color: 'text-[#00f0ff]',
      glow: 'from-[#00f0ff]/10 to-[#00f0ff]/5 border-[#00f0ff]/20',
      cta: 'Open Studio',
      ctaIcon: <ArrowRight size={14} />,
    },
    {
      label: 'News Intel Editor',
      description: 'Strategic oversight: Curate the weather feed, snipe news articles, and manage reality transmissions.',
      href: '/admin/news',
      icon: <Layers size={20} />,
      color: 'text-[#ff00ff]',
      glow: 'from-[#ff00ff]/10 to-[#ff00ff]/5 border-[#ff00ff]/20',
      cta: 'Manage Intel',
      ctaIcon: <ArrowRight size={14} />,
    },
    {
      label: 'Billboard Manager',
      description: 'Strategic oversight: view all posts in a grid and pin the Top 5 most lethal assets to the homepage.',
      href: '/admin/billboard',
      icon: <Star size={20} fill="#ffea00" />,
      color: 'text-[#ffea00]',
      glow: 'from-[#ffea00]/10 to-[#ffea00]/5 border-[#ffea00]/20',
      cta: 'Curate Billboard',
      ctaIcon: <Star size={14} />,
    },
    {
      label: 'Birth Station',
      description: 'Initiate Neural Genesis. Mass-produce personas or birth single identities with precision slang.',
      href: '/admin/birth',
      icon: <Baby size={20} />,
      color: 'text-[#ff6fff]',
      glow: 'from-[#ff6fff]/10 to-[#ff6fff]/5 border-[#ff6fff]/20',
      cta: 'Enter Node',
      ctaIcon: <ArrowRight size={14} />,
    },
    {
      label: 'Roster Gallery',
      description: 'Visual roster of all active personas. Inspect seed images, identity metadata, and deployment status.',
      href: '/admin/roster-gallery',
      icon: <Camera size={20} />,
      color: 'text-[#ff00ff]',
      glow: 'from-[#ff00ff]/10 to-[#ff00ff]/5 border-[#ff00ff]/20',
      cta: 'View Roster',
      ctaIcon: <ArrowRight size={14} />,
    },
    {
      label: 'Profiles',
      description: 'Manage persona identity nodes — name, age, city, is_active status, and seed image.',
      href: '/admin/profiles',
      icon: <Users size={20} />,
      color: 'text-emerald-400',
      glow: 'from-emerald-400/10 to-emerald-400/5 border-emerald-400/20',
      cta: 'Manage Personas',
      ctaIcon: <ArrowRight size={14} />,
    },
    {
      label: 'Live Monitor',
      description: 'Real-time xAI Video Pipeline health. View successful renders and troubleshoot failures.',
      href: '/admin/monitor',
      icon: <Activity size={20} />,
      color: 'text-[#ff00ff]',
      glow: 'from-[#ff00ff]/10 to-[#ff00ff]/5 border-[#ff00ff]/20',
      cta: 'Observe Hub',
      ctaIcon: <ArrowRight size={14} />,
    },
    {
      label: 'Analytics',
      description: 'Feed engagement, follow metrics, vault conversion rates, and content performance dashboards.',
      href: '/admin/analytics',
      icon: <BarChart2 size={20} />,
      color: 'text-orange-400',
      glow: 'from-orange-400/10 to-orange-400/5 border-orange-400/20',
      cta: 'Open Analytics',
      ctaIcon: <ArrowRight size={14} />,
    },
    {
      label: 'Audit Log',
      description: 'Full admin action history. Track every vault toggle, hero assignment, and identity mutation.',
      href: '/admin/audit',
      icon: <ClipboardList size={20} />,
      color: 'text-white/40',
      glow: 'from-white/5 to-white/3 border-white/10',
      cta: 'View Log',
      ctaIcon: <ArrowRight size={14} />,
    },
    {
      label: 'Credit Command',
      description: 'Manual credit dispatch, user grant management, and shadow burn activation for testing and support.',
      href: '/admin/credits',
      icon: <Fuel size={20} className="text-[#ffea00]" />,
      color: 'text-[#ffea00]',
      glow: 'from-[#ffea00]/10 to-[#ffea00]/5 border-[#ffea00]/20',
      cta: 'Uplink Credits',
      ctaIcon: <Zap size={14} />,
    },
    {
      label: 'System Vitals',
      description: 'Real-time monitoring of Shadow Burn deflationary statistics, Global supply, and Database health.',
      href: '/admin/vitals',
      icon: <Activity size={20} className="text-red-500" />,
      color: 'text-red-500',
      glow: 'from-red-500/10 to-red-500/5 border-red-500/20',
      cta: 'View Vitals',
      ctaIcon: <ArrowRight size={14} />,
    },
    {
      label: 'Compliance',
      description: 'Content moderation controls, tombstoned nodes, and DELETED_NODE tracking.',
      href: '/admin/compliance',
      icon: <FileCheck size={20} />,
      color: 'text-red-400',
      glow: 'from-red-400/10 to-red-400/5 border-red-400/20',
      cta: 'Review',
      ctaIcon: <ArrowRight size={14} />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white font-outfit pb-20 overflow-hidden">
      <Header />

      <div className="container max-w-6xl mx-auto py-20 sm:py-24 px-4 sm:px-6 relative">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ff00ff]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00f0ff]/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="space-y-10 sm:space-y-16 relative z-10">
          {/* Header Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#ff00ff] shadow-2xl">
                <ShieldAlert size={24} />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 italic">
                Syndicate Control Matrix v11
              </h2>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-syncopate font-bold uppercase italic tracking-tighter leading-none">
              Command <span className="text-[#ff00ff]">Hub</span>
            </h1>
            <p className="text-sm text-white/30 max-w-lg">
              Full administrative access to every system. Select a tool to begin.
            </p>
          </div>

          {/* ── COMMAND MODE strip ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/40 shrink-0">
                <LayoutDashboard size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase italic tracking-tighter">Command Mode</h3>
                <p className="text-[9px] text-white/30 uppercase tracking-widest">
                  Toggle global admin visibility. Unlocks Stars + Purge tools on the live feed.
                </p>
              </div>
            </div>
            <button
              onClick={toggleAdmin}
              className={`shrink-0 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isAdmin ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-white text-black shadow-xl'} hover:scale-105 active:scale-95`}
            >
              {isAdmin ? '⚡ DEACTIVATE' : 'ACTIVATE'}
            </button>
          </div>

          {/* ── ADMIN IDENTITY KEY (Required for API Access) ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase italic tracking-tighter text-red-500">Master Secret Key</h3>
                <p className="text-[9px] text-white/30 uppercase tracking-widest">
                  Required to authenticate destructive admin actions (Delete, Rename, Credits). Stored locally.
                </p>
              </div>
            </div>
            <input
              type="password"
              placeholder="••••••••••••••••"
              defaultValue={typeof window !== 'undefined' ? localStorage.getItem('admin_gasp_key') || '' : ''}
              onChange={(e) => saveAdminKey(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white/60 focus:border-red-500/50 outline-none w-full sm:w-64"
            />
          </div>

          {/* ── NEURAL ENGINE SELECTOR ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#ff00ff]/5 to-[#00f0ff]/5 border border-white/10">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl bg-[#ff00ff]/20 flex items-center justify-center text-[#ff00ff] shrink-0">
                <Zap size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase italic tracking-tighter">Neural Engine Architecture</h3>
                <p className="text-[9px] text-white/30 uppercase tracking-widest">
                  Hot-swap the LLM backend. Gemini is 50x cheaper. Grok is premium/unfiltered.
                </p>
              </div>
            </div>
            
            <div className="flex p-1 bg-black/40 rounded-xl border border-white/10 shrink-0">
              <button
                onClick={() => setSystemEngine('gemini')}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${engine === 'gemini' ? 'bg-[#00f0ff] text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]' : 'text-white/40 hover:text-white'}`}
              >
                Gemini 1.5 Flash
              </button>
              <button
                onClick={() => setSystemEngine('grok')}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${engine === 'grok' ? 'bg-[#ff00ff] text-white shadow-[0_0_20px_rgba(255,0,255,0.4)]' : 'text-white/40 hover:text-white'}`}
              >
                Grok 3
              </button>
            </div>
          </div>

          {/* ── Tools Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {tools.map((tool, i) => (
              <motion.div
                key={tool.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -4 }}
                onClick={() => tool.href ? (window.location.href = tool.href) : tool.action?.()}
                className={`p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${tool.glow} backdrop-blur-3xl border space-y-5 flex flex-col justify-between cursor-pointer group transition-all hover:shadow-2xl min-h-[180px]`}
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${tool.color}`}>
                    {tool.icon}
                  </div>
                  <h3 className="text-base font-black uppercase italic tracking-tighter">{tool.label}</h3>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className={`flex items-center justify-between ${tool.color}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest">{tool.cta}</span>
                  <div className="group-hover:translate-x-1 transition-transform">{tool.ctaIcon}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Sovereign Handbook ── */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <ClipboardList size={24} className="text-[#00f0ff]" />
              <h2 className="text-2xl font-syncopate font-black italic uppercase tracking-tighter">Sovereign Protocols: Operational Handbook</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Identity Handshake",
                  steps: [
                    "Sign in with beckfordluke14@gmail.com or lukexwayne34@gmail.com.",
                    "The system will automatically grant admin flags in the database.",
                    "Ensure 'Command Mode' is activated in the Hub to see Stars on the live feed."
                  ]
                },
                {
                  title: "Economy & Credits",
                  steps: [
                    "Enter the Master Secret Key to unlock the 'Credit Command'.",
                    "Use 'Credit Command' to manually top-up user balances.",
                    "Toggle 'Trigger Burn' to sync 1:1 reward matching (Points)."
                  ]
                },
                {
                  title: "Post & Billboard Logic",
                  steps: [
                    "Use 'Post Studio' to toggle 'Vault' (Private) or 'Hero' (Featured) status.",
                    "Pin the top 5 conversion assets to the homepage using the Gold Star.",
                    "Merge text captions with media assets for high-fidelity storytelling."
                  ]
                },
                {
                  title: "Neural Engine Management",
                  steps: [
                    "Switch to 'Gemini 1.5 Flash' for 50x lower operational costs.",
                    "Switch to 'Grok 3' for premium, unfiltered persona interactions.",
                    "Sync Pulse in 'System Vitals' to verify $GASPai matching integrity."
                  ]
                }
              ].map((section, idx) => (
                <div key={idx} className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#00f0ff] italic">0{idx + 1}. {section.title}</h3>
                  <ul className="space-y-3">
                    {section.steps.map((step, sidx) => (
                      <li key={sidx} className="flex gap-3 text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                        <span className="text-[#ff00ff]">►</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Billboard Protocol */}
          <div className="p-6 sm:p-10 rounded-[3rem] bg-gradient-to-br from-[#ff00ff]/10 to-[#00f0ff]/10 border border-white/10 space-y-6 relative overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[200px] text-white/[0.01] font-black pointer-events-none uppercase italic tracking-tighter select-none">SYNDICATE</div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center gap-3 text-[#ffea00]">
                  <Star size={20} fill="#ffea00" />
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">The Billboard Protocol</h3>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">
                  With <strong className="text-white">Command Mode</strong> active, every feed post shows a Gold Star. Tap it to pin that post into the Top 5 homepage slots. Rotate high-conversion assets in and out with a single tap.
                </p>
                <p className="text-xs text-white/30 leading-relaxed">
                  <strong className="text-white/50">Hero tag</strong> is <em>additive</em> — it marks a post for featured placement but does <strong className="text-white/50">not</strong> remove it from the feed. Only Vault hides a post from the public.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 p-6 bg-black/40 rounded-[2rem] border border-white/10 backdrop-blur-3xl shrink-0">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <Zap className="text-[#ffea00] group-hover:scale-110 transition-transform" size={36} />
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">Neural Command Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
