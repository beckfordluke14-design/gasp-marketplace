'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Zap, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileAvatar from './profile/ProfileAvatar';
import { initialProfiles, proxyImg } from '@/lib/profiles';

export default function ProfileSearch({ deadIds, setDeadIds }: { deadIds: Set<string>, setDeadIds: (ids: any) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchAll() {
      // 🚑 NEURAL SYNC: Derive search results from active profiles and feed
      const res = await fetch('/api/admin/feed?limit=200');
      const json = await res.json();
      
      const dbProfiles: any[] = [];
      if (json.success && json.posts) {
         const seen = new Set();
         json.posts.forEach((p: any) => {
            if (p.personas && !seen.has(p.persona_id)) {
               seen.add(p.persona_id);
               dbProfiles.push({
                  ...p.personas,
                  id: p.persona_id,
                  image: proxyImg(p.content_url || p.personas.seed_image_url)
               });
            }
         });
      }

      const combined = [
        ...dbProfiles,
        ...initialProfiles.map(p => ({ id: p.id, name: p.name, city: p.city, race: (p as any).race, tags: p.tags, image: p.image || '/v1.png' }))
      ];
      // Unique by ID
      const unique = combined.filter((p, i, self) => i === self.findIndex(t => t.id === p.id));
      setAllProfiles(unique);
    }
    fetchAll();

    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      const filtered = allProfiles
        .filter(p => !deadIds.has(p.id))
        .filter(p => p.image && p.image !== '/v1.png' && p.image !== '' && p.image !== 'undefined' && p.image !== 'null') 
        .filter(p => 
          p.name.toLowerCase().includes(query.toLowerCase()) || 
          (p.city && p.city.toLowerCase().includes(query.toLowerCase())) ||
          (p.race && p.race.toLowerCase().includes(query.toLowerCase())) ||
          (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(query.toLowerCase())))
        ).slice(0, 10); 
      setResults(filtered);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, allProfiles, deadIds]);

  const handleSelect = (pId: string) => {
    setQuery('');
    setIsOpen(false);
    router.push(`/?profile=${pId}`);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-full md:max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-y-0 left-3 md:left-4 flex items-center pointer-events-none">
          <Search size={14} className="text-white/20 group-focus-within:text-[#ff00ff] transition-colors" />
        </div>
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SEARCH..."
          className="w-full h-9 md:h-11 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl pl-10 md:pl-12 pr-4 text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff00ff]/40 focus:bg-white/10 transition-all text-center md:text-left"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-4 flex items-center text-white/20 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden z-[500] shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
          >
            <div className="p-2 space-y-1">
              {results.map((p) => (
                <button 
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0 relative">
                    <ProfileAvatar 
                      src={p.image} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                      onImageError={() => {
                        console.warn(`[Gasp Search] Purging dead search node: ${p.id} (${p.name})`);
                        setDeadIds((prev: any) => new Set([...Array.from(prev), p.id]));
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-[#ff00ff] transition-colors">{p.name}</h4>
                    <p className="text-[8px] font-bold uppercase text-white/30 tracking-tighter">{p.city}</p>
                  </div>
                  <ChevronRight size={14} className="text-white/20 group-hover:text-[#ff00ff] group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
            <div className="bg-[#ff00ff]/5 p-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[7px] font-black uppercase text-[#ff00ff] tracking-widest">Intel Node Sync Verified</span>
                <Zap size={10} className="text-[#ff00ff] animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
