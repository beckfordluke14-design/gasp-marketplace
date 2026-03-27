'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { initialPersonas, proxyImg, getPersonaName, type Persona, type Broadcast } from '@/lib/profiles';
import { MessageSquare, Zap, Lock, Heart, Trash2, Star, Brain, X, Save, Pencil, Check } from 'lucide-react';
import { trackEvent } from '@/lib/telemetry';
import { useUser } from '@/components/providers/UserProvider';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect, useRef, useCallback } from 'react';
import { COST_VAULT_UNLOCK, COST_PREMIUM_VAULT_UNLOCK } from '@/lib/economy/constants';
import BrandingOverlay from '@/components/ui/BrandingOverlay';
// postAliases removed — identity reads directly from personas table (DB is source of truth)


interface GlobalFeedProps {
  onSelectPersona: (id: string, initialMsg?: string) => void;
}


function BrainEditor({ persona, isOpen, onClose, onSave }: { persona: Persona, isOpen: boolean, onClose: () => void, onSave: (update: any) => void }) {
    const [vibe, setVibe] = useState(persona.vibe);
    const [prompt, setPrompt] = useState(persona.systemPrompt);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        await onSave({ vibe, systemPrompt: prompt });
        setLoading(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-3xl">
                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#ffea00]/10 rounded-xl text-[#ffea00]"><Brain size={24} /></div>
                                <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Re-Script: {persona.name}</h3>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={24} className="text-white/40" /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Public Vibe</label>
                                <textarea value={vibe} onChange={(e) => setVibe(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-outfit min-h-[100px] focus:border-[#ffea00]/30 outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Neural System Prompt (Hidden)</label>
                                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[#ffea00]/90 font-mono text-xs min-h-[150px] focus:border-[#ffea00]/30 outline-none transition-all" />
                            </div>
                        </div>

                        <button onClick={handleSave} disabled={loading} className="w-full bg-white text-black font-black uppercase py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#ffea00] transition-all disabled:opacity-50">
                            {loading ? <Zap size={24} className="animate-spin" /> : <><Save size={24} /><span>Execute Re-Script</span></>}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function GlobalFeedItem({ persona, broadcast, onSelectPersona, onDeletePost, onToggleFeatured, onUpdatePost, isFeatured, onEditBrain, index }: { persona: Persona; broadcast: Broadcast; onSelectPersona: (id: string, initialMsg?: string) => void; onDeletePost?: (id: string) => void; onToggleFeatured?: (id: string, state: boolean) => void; onUpdatePost?: (id: string, caption: string) => void; isFeatured?: boolean; onEditBrain?: (persona: Persona) => void; index: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(broadcast.content || '');
  // Identity reads directly from persona (which the Post Studio writes to personas table)
  const displayName = getPersonaName(persona);
  const displayAge  = String(persona.age || '22');
  const displayCity = persona.city || '';

  const handleSave = () => {
    if (onUpdatePost) onUpdatePost(broadcast.id, editedCaption);
    setIsEditing(false);
  };
  const [likes, setLikes] = useState(broadcast.likes_count || Math.floor(Math.random() * 500));
  const [hasLiked, setHasLiked] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  // 🏁 NEURAL STARE: Dwell-time Tracking 
  useEffect(() => {
    let stareTimer: any;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
          trackEvent('post_view', persona.id, { postId: broadcast.id });
          stareTimer = setTimeout(() => {
             trackEvent('post_dwell', persona.id, { postId: broadcast.id, duration: '3s+' });
          }, 3000);
      } else {
          clearTimeout(stareTimer);
      }
    }, { threshold: 0.7 });

    if (itemRef.current) observer.observe(itemRef.current);
    return () => { observer.disconnect(); clearTimeout(stareTimer); };
  }, [broadcast.id]);

  // 🏁 ENGAGEMENT CACHE: Sync with local storage
  useEffect(() => {
    const localLikes = JSON.parse(localStorage.getItem('gasp_liked_ids') || '[]');
    if (localLikes.includes(broadcast.id)) {
        setHasLiked(true);
    }
  }, [broadcast.id]);

  const handleLike = async () => {
    if (hasLiked) return;
    setHasLiked(true);
    setLikes(prev => prev + 1);
    
    const localLikes = JSON.parse(localStorage.getItem('gasp_liked_ids') || '[]');
    localLikes.push(broadcast.id);
    localStorage.setItem('gasp_liked_ids', JSON.stringify(localLikes));

    try {
        await fetch('/api/admin/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: broadcast.id })
        });
    } catch (e) {
        console.error('Like sync failure:', e);
    }
  };

  return (
    <motion.div 
      ref={itemRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-screen overflow-hidden bg-black flex flex-col items-center justify-center border-b border-white/5 last:border-0"
    >
       <div className="absolute inset-0 z-0 bg-black flex items-start md:items-center justify-center">
          {broadcast.type === 'video' ? (
             <>
                <video src={proxyImg(broadcast.video_url)} autoPlay loop muted playsInline preload="auto" className={`absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-110 pointer-events-none ${broadcast.is_locked ? 'blur-[100px]' : ''}`} />
                <BrandingOverlay personaName={persona.name} />

                {broadcast.is_locked ? (
                   <div className="relative z-20 w-full h-full flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-3xl">
                      <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-[#ffea00]/20 border border-[#ffea00]/40 flex items-center justify-center shadow-[0_0_50px_rgba(255,234,0,0.2)] mb-8">
                         <Lock size={40} className="text-[#ffea00]" />
                      </div>
                      <div className="text-center space-y-4">
                         <h3 className="text-2xl md:text-4xl font-syncopate font-black italic tracking-tighter uppercase text-white drop-shadow-2xl">Lifestyle Vault</h3>
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">locked motion session</p>
                         <button 
                             onClick={(e) => { 
                                 e.stopPropagation(); 
                                 trackEvent('vault_unlock_intent', persona.id, { postId: broadcast.id, type: 'video', price: broadcast.lock_price || COST_PREMIUM_VAULT_UNLOCK });
                                 onSelectPersona(persona.id, 'unlock your video for me baby?'); 
                              }}
                             className="mt-8 px-12 py-5 bg-[#ffea00] text-black rounded-3xl text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,234,0,0.3)] hover:scale-105 active:scale-95 transition-all"
                         >
                            Unlock for {broadcast.lock_price || COST_PREMIUM_VAULT_UNLOCK} credits
                         </button>
                      </div>
                      <video src={proxyImg(broadcast.video_url)} className="absolute inset-0 w-full h-full object-cover -z-10 blur-[130px] opacity-10" />
                   </div>
                ) : (
                   <video src={proxyImg(broadcast.video_url)} autoPlay loop muted playsInline preload="auto" className="relative z-10 w-full h-full object-cover md:object-contain pt-16 md:pt-24 pb-8 md:pb-12 opacity-100" />
                )}
             </>
          ) : broadcast.type === 'image' ? (
             <>
                <img 
                   src={proxyImg(broadcast.image_url || (!persona.image?.toLowerCase()?.endsWith('.mp4') ? persona.image : '/v1.png'))} 
                   alt="" 
                   onError={(e) => {
                       (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(persona.name)}&background=ff00ff&color=fff&bold=true`;
                    }}
                   referrerPolicy="no-referrer" 
                   className={`absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-110 pointer-events-none ${broadcast.is_locked ? 'blur-[100px]' : ''}`} 
                   loading="lazy"
                   decoding="async"
                />
                <BrandingOverlay personaName={persona.name} />
                
                {broadcast.is_locked ? (
                   <div className="relative z-20 w-full h-full flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-3xl">
                      <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-[#ff00ff]/20 border border-[#ff00ff]/40 flex items-center justify-center shadow-[0_0_50px_rgba(255,0,255,0.2)] mb-8">
                         <Lock size={40} className="text-[#ff00ff]" />
                      </div>
                      <div className="text-center space-y-4">
                         <h3 className="text-2xl md:text-4xl font-syncopate font-black italic tracking-tighter uppercase text-white drop-shadow-2xl">Vault Drop</h3>
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">private archive node</p>
                         <button 
                            onClick={(e) => { 
                                e.stopPropagation();                                 trackEvent('vault_unlock_intent', persona.id, { type: 'image', price: broadcast.lock_price || COST_VAULT_UNLOCK });
                                 onSelectPersona(persona.id, 'i want to unlock your vault set mi amor'); 
                              }}
                             className="mt-8 px-12 py-5 bg-[#ff00ff] text-white rounded-3xl text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,0,127,0.3)] hover:scale-105 active:scale-95 transition-all"
                         >
                            Unlock for {broadcast.lock_price || COST_VAULT_UNLOCK} credits
                         </button>
                      </div>
                      <img 
                        src={proxyImg(broadcast.image_url || (!persona.image?.toLowerCase()?.endsWith('.mp4') ? persona.image : '/v1.png'))} 
                        alt="" 
                        onError={(e) => {
                           (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(persona.name)}&background=ff00ff&color=fff&bold=true`;
                        }}
                        className="absolute inset-0 w-full h-full object-cover -z-10 blur-[130px] opacity-20" 
                      />
                   </div>
                ) : (
                    <img 
                      src={proxyImg(broadcast.image_url || (!persona.image?.toLowerCase()?.endsWith('.mp4') ? persona.image : '/v1.png'))} 
                      alt="" 
                      referrerPolicy="no-referrer" 
                      className="relative z-10 w-full h-full object-cover md:object-contain pt-16 md:pt-24 pb-8 md:pb-12 opacity-100" 
                      loading={index < 2 ? "eager" : "lazy"}
                      decoding="async"
                    />
                )}
             </>
          ) : (
             <div className="w-full h-full bg-[#050505]"><BrandingOverlay personaName={persona.name} /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
      </div>
      {(onDeletePost || onToggleFeatured || onUpdatePost || onEditBrain) && (
          <div className="absolute top-16 right-0 z-50 flex flex-col gap-4">
             {onDeletePost && (
                <button onClick={(e) => { e.stopPropagation(); onDeletePost(broadcast.id); }} className="p-5 md:p-6 bg-black/60 hover:bg-red-500/90 backdrop-blur-2xl rounded-l-3xl text-white/40 hover:text-white transition-all border border-r-0 border-white/10">
                   <Trash2 size={24} />
                </button>
             )}
             
             {onToggleFeatured && (
                <button onClick={(e) => { e.stopPropagation(); onToggleFeatured(broadcast.id, !isFeatured); }} className={`p-5 md:p-6 bg-black/60 backdrop-blur-2xl rounded-l-3xl transition-all border border-r-0 border-white/10 ${isFeatured ? 'text-[#ffea00] shadow-[0_0_30px_#ffea0022]' : 'text-white/20 hover:text-[#ffea00]'}`}>
                   <Star size={24} fill={isFeatured ? '#ffea00' : 'none'} />
                </button>
             )}

             {onUpdatePost && (
                <button 
                   onClick={(e) => { e.stopPropagation(); isEditing ? handleSave() : setIsEditing(true); }} 
                   className={`p-5 md:p-6 bg-black/60 backdrop-blur-2xl rounded-l-3xl transition-all border border-r-0 border-white/10 ${isEditing ? 'bg-green-600/50 text-white' : 'text-white/20 hover:text-[#00f0ff]'}`}
                >
                   {isEditing ? <Check size={24} /> : <Pencil size={24} />}
                </button>
             )}

             {onEditBrain && (
                <button onClick={(e) => { e.stopPropagation(); onEditBrain(persona); }} className="p-5 md:p-6 bg-black/60 hover:bg-[#ffea00]/90 backdrop-blur-2xl rounded-l-3xl text-white/40 hover:text-white transition-all border border-r-0 border-white/10">
                  <Brain size={24} />
                </button>
             )}
          </div>
      )}

      <div className="relative z-10 w-full max-w-xl px-4 flex flex-col items-center justify-center min-h-screen">
            <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-end p-8 md:p-16">
                  <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                     <div className="flex flex-col gap-2 pointer-events-auto">
                        <div className="flex items-center gap-3">
                      <span className="text-[14px] md:text-[18px] font-black uppercase italic tracking-tighter text-white/90 drop-shadow-2xl">{displayName}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]" />
                   </div>
                   
                   {isEditing ? (
                      <textarea 
                         value={editedCaption}
                         onChange={(e) => setEditedCaption(e.target.value)}
                         onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                         className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-[20px] md:text-[28px] lg:text-[36px] font-black tracking-tighter text-white italic lowercase leading-[1.1] selection:bg-[#ff00ff] outline-none"
                         autoFocus
                      />
                   ) : (
                      <h2 className="text-[20px] md:text-[28px] lg:text-[36px] font-black tracking-tighter text-white italic lowercase leading-[1.1] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                         {broadcast.content}
                      </h2>
                   )}
                     </div>
                     <div className="flex items-center gap-4 md:gap-6 pointer-events-auto">
                        <button onClick={handleLike} className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl backdrop-blur-3xl border flex flex-col items-center justify-center transition-all ${hasLiked ? 'bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_30px_#ff000044]' : 'bg-black/60 border-white/10 text-white/40 hover:scale-110 hover:border-white/30'}`}><Heart size={26} className={hasLiked ? 'fill-current' : ''} /><span className="text-[8px] md:text-[10px] font-black mt-1 uppercase">{likes}</span></button>
                        <button onClick={() => onSelectPersona(persona.id)} className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-black/60 backdrop-blur-3xl border border-white/10 flex flex-col items-center justify-center text-[#00f0ff]/80 hover:scale-110 hover:border-[#00f0ff]/40 transition-all"><MessageSquare size={26} /><span className="text-[8px] md:text-[10px] font-black mt-1 uppercase">chat</span></button>
                        <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-[#ffea00]/10 backdrop-blur-3xl border border-[#ffea00]/20 flex flex-col items-center justify-center text-[#ffea00] animate-pulse"><Zap size={24} /><span className="text-[8px] md:text-[10px] font-black mt-1 uppercase italic font-black">elite</span></div>
                     </div>
                  </div>
            </div>
      </div>
    </motion.div>
  );
}

export default function GlobalFeed({ onSelectPersona }: GlobalFeedProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // the actual scroll container
  const isFetching = useRef(false);
  const pageRef = useRef(0); // ref copy of page so fetchFeed never reads stale state

  useEffect(() => {
     if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'true') {
           document.cookie = "admin_gasp_override=granted; path=/; max-age=31536000; SameSite=Lax";
           console.log('[Neural Command]: Admin Auth Etched.');
           setIsAdmin(true);
           setShowAdminControls(true); // Auto-show on URL trigger
        }
        setIsAdmin(document.cookie.includes('admin_gasp_override=granted'));

         // 🛡️ SYNC: Listen for Header star toggle
         const handleSync = (e: any) => setShowAdminControls(e.detail);
         window.addEventListener('gasp_admin_toggle', handleSync);
         return () => window.removeEventListener('gasp_admin_toggle', handleSync);
      }
   }, []);

   const handleToggleFeatured = async (postId: string, newState: boolean) => {
      try {
        const context = items.find(i => i.broadcast.id === postId);
        if (!context) return;
        
        // 1. SESSION OVERRIDE (Local UI Stability)
        const localStarred = JSON.parse(localStorage.getItem('gasp_starred_ids') || '[]');
        if (newState) { if (!localStarred.includes(postId)) localStarred.push(postId); }
        else { const idx = localStarred.indexOf(postId); if (idx > -1) localStarred.splice(idx, 1); }
        localStorage.setItem('gasp_starred_ids', JSON.stringify(localStarred));

        // 2. OPTIMISTIC UI RE-SORT
        setItems(prev => {
           const next = prev.map(item => item.broadcast.id === postId ? { ...item, broadcast: { ...item.broadcast, is_featured: newState } } : item);
           return next.sort((a, b) => {
              if (a.broadcast.is_featured && !b.broadcast.is_featured) return -1;
              if (!a.broadcast.is_featured && b.broadcast.is_featured) return 1;
              return new Date(b.broadcast.created_at).getTime() - new Date(a.broadcast.created_at).getTime();
           });
        });

         // 3. GLOBAL CLOUD SYNC: High-Fidelity Master Bridge
         await fetch('/api/admin/audit', {
             method: 'POST',
             body: JSON.stringify({ action: 'update-post', payload: { 
                 id: postId, 
                 is_featured: newState,
                 persona_id: context.persona.id,
                 caption: context.broadcast.content,
                 content_url: context.broadcast.image_url || context.broadcast.video_url,
                 content_type: context.broadcast.type,
                 is_vault: context.broadcast.is_locked
             }})
         });
      } catch(e) { console.error('Cloud Sync Failure:', e); }
    };
 
    const handleUpdatePost = async (id: string, caption: string) => {
        const item = items.find(i => i.broadcast.id === id);
        if (!item) return;

        // 1. OPTIMISTIC UI
        setItems(prev => prev.map(p => p.broadcast.id === id ? { ...p, broadcast: { ...p.broadcast, content: caption } } : p));

         try {
             await fetch('/api/admin/audit', {
                 method: 'POST',
                 body: JSON.stringify({ action: 'update-post', payload: { 
                    id, 
                    caption,
                    persona_id: item.persona.id,
                    content_url: item.broadcast.image_url || item.broadcast.video_url,
                    content_type: item.broadcast.type,
                    is_vault: item.broadcast.is_locked,
                    is_featured: item.broadcast.is_featured
                 }})
             });
         } catch (e) {
             console.error('[Neural Update Failure]:', e);
         }
    };

  const handleAdminDelete = async (postId: string) => {
    if (!confirm('Execute DB Purge on this Node?')) return;
    try {
      const item = items.find(i => i.broadcast.id === postId);
      if (!item) return;

      const res = await fetch('/api/admin/audit', {
          method: 'POST',
          body: JSON.stringify({ 
            action: 'delete-post', 
            payload: { 
              id: postId,
              persona_id: item.persona.id,
              content_url: item.broadcast.image_url || item.broadcast.video_url,
              content_type: item.broadcast.type,
              is_vault: item.broadcast.is_locked
            } 
          })
      });
      const data = await res.json();
      if (data.success) {
          setItems(prev => prev.filter(n => n.broadcast.id !== postId));
      } else alert('Neural Wipe Refused: ' + data.error);
    } catch(e) { console.error(e); }
  };

  const handleSaveBrain = async (update: any) => {
      if (!editingPersona) return;
      try {
          await fetch('/api/admin/persona', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ personaId: editingPersona.id, update })
          });
          // Refresh list to reflect changes
          fetchFeed(0);
      } catch(e) { console.error(e); }
  };

  const fetchFeed = useCallback(async (pageNumber = 0) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);

    let dbPosts: any[] = [];
    let mergedItems: any[] = [];
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const feedRes = await fetch(`/api/admin/feed?page=${pageNumber}`, { 
            signal: controller.signal,
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        clearTimeout(timeoutId);

        if (!feedRes.ok) throw new Error('Network response was not ok');
        const data = await feedRes.json();
        dbPosts = data?.posts || [];
        
        if (dbPosts.length < 20) setHasMore(false);

        mergedItems = dbPosts.map((p: any) => {
           if (!p || !p.content_url) return null;
           const pDataRaw = (Array.isArray(p.personas) ? p.personas[0] : p.personas) || {};
           const fallback = (initialPersonas.find(i => i.id === p.persona_id) || {}) as any;
           const finalPersona = { 
             ...fallback, 
             ...pDataRaw, 
             id: p.persona_id || pDataRaw.id || fallback.id,
             image: pDataRaw.seed_image_url || pDataRaw.image || fallback.image
           };
           if (!finalPersona.name) return null;
           return {
               persona: finalPersona,
               broadcast: { 
                 id: p.id, 
                 type: p.content_type || 'image',
                 content: p.caption || '', 
                 is_featured: p.is_burner || false, 
                 image_url: p.content_url, 
                 video_url: p.content_url, 
                 is_locked: p.is_vault || false, 
                 likes_count: p.likes_count || 0,
                 created_at: p.created_at || new Date().toISOString() 
               }
           };
        }).filter((i: any) => 
            i !== null && 
            i.persona?.id && 
            i.persona?.name && 
            i.persona?.is_active !== false && 
            !i.broadcast.content?.startsWith('DELETED')
        );
    } catch(e) { 
        console.error('Feed Fetch Failure:', e); 
    }

    const initialItems = pageNumber === 0 
        ? initialPersonas.flatMap(p => (p.broadcasts || []).map(b => ({ persona: p, broadcast: { ...b, created_at: b.created_at || new Date().toISOString(), is_featured: b.is_featured || false } })))
        : [];
    
    setItems(prev => {
        const combined = pageNumber === 0 ? [...initialItems, ...mergedItems] : [...prev, ...mergedItems];
        const localStarred = JSON.parse(localStorage.getItem('gasp_starred_ids') || '[]');
        const starredSet = new Set(localStarred);
        const registry = new Map();
        combined.forEach(item => {
           if (!registry.has(item.broadcast.id) || item.broadcast.id.includes('-')) {
               const isFeatured = starredSet.has(item.broadcast.id) ? true : (item.broadcast.is_featured);
               registry.set(item.broadcast.id, { ...item, broadcast: { ...item.broadcast, is_featured: isFeatured } });
           }
        });
        const unique = Array.from(registry.values());
        if (typeof window !== 'undefined') (window as any).__last_feed = unique;
        return unique.sort((a, b) => {
            if (a.broadcast.is_featured && !b.broadcast.is_featured) return -1;
            if (!a.broadcast.is_featured && b.broadcast.is_featured) return 1;
            return new Date(b.broadcast.created_at).getTime() - new Date(a.broadcast.created_at).getTime();
        });
    });
    setLoading(false);
    isFetching.current = false;
  }, []); // stable — reads nothing from render scope except refs

  useEffect(() => {
    fetchFeed(0);
    let debounceTimer: any;
    
    const channel = supabase.channel('public:posts-and-personas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => { 
          // ⚡ NEURAL DEBOUNCE: Don't hammer the DB during mass generation events
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => fetchFeed(0), 3000); 
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'personas' }, () => {
          // 🔄 Identity sync: persona name/age/city changed in Post Studio — refresh feed
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => fetchFeed(0), 1000);
      })
      .subscribe();
      
    return () => { 
        supabase.removeChannel(channel); 
        clearTimeout(debounceTimer);
    };
  }, []);

  useEffect(() => {
    // KEY FIX: root must be the scroll container div, not the window/viewport.
    // Without root, IntersectionObserver checks against the viewport — but the
    // feed is inside an overflow-y-auto div, so the loader is never 'visible'
    // to the viewport even when the user scrolls to the bottom.
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isFetching.current && hasMore && items.length > 0) {
            pageRef.current += 1;
            fetchFeed(pageRef.current);
        }
    }, {
        root: containerRef.current, // ← the actual scrollable div
        threshold: 0.0,
        rootMargin: '400px',        // load next page 400px before hitting bottom
    });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, items.length, fetchFeed]);

  return (
    <div ref={containerRef} className="flex-1 h-screen overflow-y-auto scroll-smooth no-scrollbar relative w-full touch-pan-y">
      {items.length > 0 ? (
        items.map((item, index) => (
          <GlobalFeedItem 
            key={`${item.persona.id}-${item.broadcast.id}-${index}`} 
            persona={item.persona} 
            broadcast={item.broadcast} 
            index={index}
            onSelectPersona={onSelectPersona} 
            onDeletePost={(isAdmin && showAdminControls) ? handleAdminDelete : undefined} 
            onToggleFeatured={(isAdmin && showAdminControls) ? handleToggleFeatured : undefined} 
            onUpdatePost={(isAdmin && showAdminControls) ? handleUpdatePost : undefined}
            onEditBrain={(isAdmin && showAdminControls) ? setEditingPersona : undefined}
            isFeatured={item.broadcast.is_featured} 
          />
        ))
      ) : (
        <div className="h-screen flex items-center justify-center p-20"><Zap size={40} className="text-[#ffea00] animate-pulse" /></div>
      )}

      {hasMore && (
        <div ref={loaderRef} className="h-40 flex items-center justify-center bg-black">
           <Zap size={20} className="text-[#ffea00] animate-pulse opacity-20" />
        </div>
      )}

      {isAdmin && (
         <button 
           onClick={() => setShowAdminControls(!showAdminControls)}
           className={`fixed bottom-28 right-6 z-[2000] w-14 h-14 rounded-full flex items-center justify-center transition-all ${showAdminControls ? 'bg-[#ffea00] text-black shadow-[0_0_30px_#ffea00]' : 'bg-black/60 text-white/40 border border-white/10'}`}
         >
            <Star size={24} fill={showAdminControls ? 'currentColor' : 'none'} />
         </button>
      )}

      {editingPersona && (
        <BrainEditor 
          persona={editingPersona} 
          isOpen={!!editingPersona} 
          onClose={() => setEditingPersona(null)} 
          onSave={handleSaveBrain} 
        />
      )}
    </div>
  );
}



