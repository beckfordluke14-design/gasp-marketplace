'use client';

import NewsFeed from '@/components/NewsFeed';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';

export default function NewsPage() {
    const [selectedProfileId, setSelectedProfileId] = useState('');
    const [dbProfiles, setDbProfiles] = useState<any[]>([]);

    // 🛰️ SYNC: Fetch personas to hydrate the sidebar
    useEffect(() => {
        const load = async () => {
           try {
              const res = await fetch('/api/personas');
              const json = await res.json();
              if (json.success) setDbProfiles(json.personas);
           } catch (e) {}
        }
        load();
    }, []);

    return (
        <main className="flex h-screen w-full bg-black overflow-hidden font-outfit">
            {/* 🛰️ GLOBAL NAVIGATION */}
            <div className="hidden lg:flex h-full sticky top-0 shrink-0 z-[40]">
                <Sidebar 
                    selectedProfileId={selectedProfileId}
                    onSelectProfile={(id) => {
                        setSelectedProfileId(id);
                        window.location.href = `/?profile=${id}`;
                    }}
                    profiles={dbProfiles}
                    view="feed"
                />
            </div>

            {/* 📰 NEWS TERMINAL */}
            <div className="flex-1 h-full relative overflow-hidden bg-black">
                <div className="h-full">
                    <NewsFeed />
                </div>
            </div>
        </main>
    );
}
