'use client';

import NewsFeed from '@/components/NewsFeed';
import Sidebar from '@/components/Sidebar';
import GlobalFeed from '@/components/GlobalFeed';
import TopUpDrawer from '@/components/economy/TopUpDrawer';
import ChatDrawer from '@/components/ChatDrawer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, X, Zap, MessageSquare, Loader2 } from 'lucide-react';
import { initialProfiles, proxyImg } from '@/lib/profiles';

export default function NewsPage() {
    const [selectedProfileId, setSelectedProfileId] = useState('');
    const [dbProfiles, setDbProfiles] = useState<any[]>([]);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [isFeedOpen, setIsFeedOpen] = useState(false);

    // Chat state
    const [openChatIds, setOpenChatIds] = useState<string[]>([]);
    const [minimizedIds, setMinimizedIds] = useState<string[]>([]);
    const [chatProfileCache, setChatProfileCache] = useState<Record<string, any>>({});

    // 🛰️ SYNC: Fetch personas to hydrate the sidebar + feed
    useEffect(() => {
        const load = async () => {
           try {
              const res = await fetch('/api/personas');
              const json = await res.json();
              if (json.success) setDbProfiles(json.personas.map((p: any) => ({
                  ...p,
                  image: proxyImg(p.seed_image_url || p.image)
              })));
           } catch (e) {}
        }
        load();
    }, []);

    const handleSelectProfile = async (id: string) => {
        const sId = String(id);
        setSelectedProfileId(sId);

        let targetProfile = initialProfiles.find(p => String(p.id) === sId) ||
                            dbProfiles.find(p => String(p.id) === sId) ||
                            chatProfileCache[sId];

        if (!targetProfile) {
            try {
                const res = await fetch(`/api/admin/persona/${sId}`);
                const data = await res.json();
                if (data && data.id) {
                    targetProfile = { ...data, id: String(data.id), image: proxyImg(data.seed_image_url || data.image) };
                    setChatProfileCache(prev => ({ ...prev, [sId]: targetProfile }));
                }
            } catch {}
        } else if (!chatProfileCache[sId]) {
            setChatProfileCache(prev => ({ ...prev, [sId]: targetProfile }));
        }

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        setOpenChatIds(prev => (isMobile ? [sId] : prev.includes(sId) ? prev : [...prev, sId]));
        setMinimizedIds(prev => prev.filter(m => m !== sId));
        setIsFeedOpen(false); // close feed panel when chat opens
    };

    const handleCloseChat = (id: string) => {
        setOpenChatIds(prev => prev.filter(cid => cid !== id));
        setMinimizedIds(prev => prev.filter(mid => mid !== id));
    };

    return (
        <main className="flex h-screen w-full bg-black overflow-hidden font-outfit relative">
            {/* 🛰️ GLOBAL NAVIGATION */}
            <div className="hidden lg:flex h-full sticky top-0 shrink-0 z-[40]">
                <Sidebar 
                    selectedProfileId={selectedProfileId}
                    onSelectProfile={handleSelectProfile}
                    profiles={dbProfiles}
                    view="feed"
                    onOpenTopUp={() => setIsTopUpOpen(true)}
                />
            </div>

            {/* 📰 NEWS TERMINAL */}
            <div className="flex-1 h-full relative overflow-hidden bg-black">
                <div className="h-full">
                    <NewsFeed onSelectProfile={handleSelectProfile} />
                </div>

                {/* 🌐 GLOBAL FEED TOGGLE BUTTON — Floating */}
                <motion.button
                    onClick={() => setIsFeedOpen(prev => !prev)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`fixed bottom-8 right-8 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl transition-all border font-syncopate italic ${
                        isFeedOpen
                            ? 'bg-[#ff00ff] text-white border-[#ff00ff] shadow-[0_0_40px_rgba(255,0,255,0.4)]'
                            : 'bg-black/80 backdrop-blur-xl text-white/80 border-white/10 hover:border-[#00f0ff]/40 hover:text-[#00f0ff] shadow-[0_0_30px_rgba(0,0,0,0.8)]'
                    }`}
                >
                    {isFeedOpen ? <X size={16} /> : <LayoutGrid size={16} />}
                    <span>{isFeedOpen ? 'Close Feed' : 'Global Feed'}</span>
                </motion.button>
            </div>

            {/* 🌐 GLOBAL FEED PANEL — Slides in from right */}
            <AnimatePresence>
                {isFeedOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm lg:hidden"
                            onClick={() => setIsFeedOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 z-[250] w-full max-w-sm lg:max-w-md bg-black border-l border-white/10 shadow-[-40px_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
                        >
                            {/* Panel Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0 bg-black/60 backdrop-blur-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping shadow-[0_0_8px_#00f0ff]" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white font-syncopate italic">Global Feed</span>
                                </div>
                                <button
                                    onClick={() => setIsFeedOpen(false)}
                                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Feed Content */}
                            <div className="flex-1 overflow-hidden">
                                <GlobalFeed
                                    onSelectProfile={handleSelectProfile}
                                    profiles={dbProfiles}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* 💬 CHAT DRAWERS */}
            <div className="fixed inset-0 pointer-events-none z-[1000] flex items-end justify-end p-6 gap-4">
                <AnimatePresence>
                    {openChatIds.filter(id => !minimizedIds.includes(id)).map((sId, index) => {
                        const p = initialProfiles.find((pi: any) => String(pi.id) === sId) ||
                                  dbProfiles.find((pi: any) => String(pi.id) === sId) ||
                                  chatProfileCache[sId];

                        if (!p) return (
                            <motion.div
                                key={sId}
                                initial={{ x: '100%', opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: '100%', opacity: 0 }}
                                className="h-full pointer-events-auto bg-black border-l border-white/5 shadow-2xl w-full max-w-md flex items-center justify-center"
                            >
                                <div className="flex flex-col items-center gap-4 text-center p-10">
                                    <Zap className="text-[#ffea00] animate-pulse" size={36} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Syncing...</p>
                                    <Loader2 className="text-white/10 animate-spin" size={18} />
                                </div>
                            </motion.div>
                        );

                        return (
                            <motion.div
                                key={sId}
                                initial={{ x: '100%', scale: 0.95, opacity: 0 }}
                                animate={{ x: `-${index * 24}px`, scale: 1, opacity: 1 }}
                                exit={{ x: '100%', scale: 0.95, opacity: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 150 }}
                                style={{ zIndex: 1000 - index }}
                                className="h-full pointer-events-auto bg-black shadow-[-40px_0_80px_rgba(0,0,0,0.9)] origin-right"
                            >
                                <ErrorBoundary key={sId}>
                                    <ChatDrawer
                                        profileId={sId}
                                        profile={p}
                                        onClose={() => handleCloseChat(sId)}
                                        onMinimize={() => setMinimizedIds([...minimizedIds, sId])}
                                        onOpenTopUp={() => setIsTopUpOpen(true)}
                                        profiles={dbProfiles}
                                    />
                                </ErrorBoundary>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Minimized Chat Bubbles */}
            {minimizedIds.length > 0 && (
                <div className="fixed bottom-6 left-6 z-[2000] flex flex-col gap-3">
                    {minimizedIds.map(id => (
                        <motion.div
                            key={id}
                            initial={{ scale: 0, x: -20 }}
                            animate={{ scale: 1, x: 0 }}
                            onClick={() => setMinimizedIds(prev => prev.filter(m => m !== id))}
                            className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all group relative"
                        >
                            <MessageSquare size={18} className="text-[#00f0ff] group-hover:scale-110 transition-transform" />
                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ff00ff] shadow-[0_0_10px_#ff00ff]" />
                        </motion.div>
                    ))}
                </div>
            )}

            {/* 💳 TOP-UP DRAWER */}
            {isTopUpOpen && (
                <TopUpDrawer
                    isOpen={isTopUpOpen}
                    onClose={() => setIsTopUpOpen(false)}
                />
            )}
        </main>
    );
}
