'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { initialProfiles, proxyImg, getProfileName, type Profile, type Broadcast } from '@/lib/profiles';
import { MessageSquare, Zap, Lock, Heart, Trash2, Star, Brain, X, Save, Pencil, Check, ShieldCheck } from 'lucide-react';
import { trackEvent } from '@/lib/telemetry';
import { useUser } from '@/components/providers/UserProvider';
import Link from 'next/link';

import { useState, useEffect, useRef, useCallback } from 'react';
import { COST_VAULT_UNLOCK, COST_PREMIUM_VAULT_UNLOCK } from '@/lib/economy/constants';
import BrandingOverlay from '@/components/ui/BrandingOverlay';

interface GlobalFeedProps {
  onSelectProfile: (id: string, initialMsg?: string) => void;
  profiles?: any[];
  deadIds?: Set<string>;
  setDeadIds?: (ids: any) => void;
}

function GlobalFeedItem({ 
  profile, 
  broadcast, 
  onSelectProfile, 
  onDeletePost, 
  onToggleFeatured, 
  onUpdatePost, 
  isFeatured, 
  onEditBrain, 
  index 
}: { 
  profile: Profile; 
  broadcast: any; 
  onSelectProfile: (id: string, initialMsg?: string) => void; 
  onDeletePost?: (id: string) => void; 
  onToggleFeatured?: (id: string, state: boolean) => void; 
  onUpdatePost?: (id: string, caption: string) => void; 
  isFeatured?: boolean; 
  onEditBrain?: (profile: Profile) => void; 
  index: number 
}) {
  const postType = broadcast.content_type || broadcast.type || 'text';
  const postUrl = broadcast.content_url || broadcast.media_url || broadcast.image_url || broadcast.video_url;
  const postText = broadcast.caption || broadcast.content || '';

  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(postText);
  const [likes, setLikes] = useState(broadcast.likes_count || Math.floor(Math.random() * 500));
  const [hasLiked, setHasLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showChatBubble, setShowChatBubble] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  const displayName = getProfileName(profile);

  const handleSave = () => {
    if (onUpdatePost) onUpdatePost(broadcast.id, editedCaption);
    setIsEditing(false);
  };

  const syncFollows = useCallback(async () => {
     const gid = localStorage.getItem('gasp_guest_id');
     if (!gid) return;
     try {
       const res = await fetch('/api/rpc/db', {
         method: 'POST',
         body: JSON.stringify({ action: 'check-follow', payload: { userId: gid, personaId: profile.id } })
       });
       const json = await res.json();
       setIsFollowing(json.isFollowing);
     } catch (e) {}
  }, [profile.id]);

  useEffect(() => {
     syncFollows();
     window.addEventListener('gasp_sync_follows', syncFollows);
     return () => window.removeEventListener('gasp_sync_follows', syncFollows);
  }, [syncFollows]);

  useEffect(() => {
    let stareTimer: any;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
          trackEvent('post_view', profile.id, { postId: broadcast.id });
          stareTimer = setTimeout(() => {
             trackEvent('post_dwell', profile.id, { postId: broadcast.id, duration: '2s+' });
             setShowChatBubble(true);
          }, 2000);
      } else {
          clearTimeout(stareTimer);
          setShowChatBubble(false);
      }
    }, { threshold: 0.7 });

    if (itemRef.current) observer.observe(itemRef.current);
    return () => { observer.disconnect(); clearTimeout(stareTimer); };
  }, [broadcast.id, profile.id]);

  useEffect(() => {
    const localLikes = JSON.parse(localStorage.getItem('gasp_liked_ids') || '[]');
    if (localLikes.includes(broadcast.id)) {
        setHasLiked(true);
    }
  }, [broadcast.id]);

  const handleInteraction = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
       handleLike();
    }
    lastTapRef.current = now;
  };

  const handleLike = async () => {
    if (hasLiked) return;
    setHasLiked(true);
    setLikes((prev: number) => prev + 1);
    const localLikes = JSON.parse(localStorage.getItem('gasp_liked_ids') || '[]');
    localLikes.push(broadcast.id);
    localStorage.setItem('gasp_liked_ids', JSON.stringify(localLikes));
    try {
        await fetch('/api/admin/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: broadcast.id })
        });
    } catch (e) {}
  };

  return (
    <motion.div 
      ref={itemRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className={`relative w-full ${postType === 'text' ? 'h-auto py-12' : 'h-[100dvh] md:h-[100vh]'} overflow-hidden bg-transparent flex flex-col items-center justify-center border-b border-white/5 last:border-0 cursor-pointer`}
      onClick={handleInteraction}
    >
       {/* CONTENT LAYER */}
       <div className={`z-0 bg-transparent flex items-center justify-center ${postType === 'text' ? 'relative w-full' : 'absolute inset-0'}`}>
          {postType === 'video' ? (
             <>
                <video src={proxyImg(postUrl)} autoPlay loop muted playsInline className={`absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 ${broadcast.is_locked ? 'blur-[100px]' : ''}`} />
                <BrandingOverlay profileName={profile.name} />
                {broadcast.is_locked ? (
                   <div className="relative z-20 w-full h-full flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-3xl">
                       <Lock size={40} className="text-[#ffea00] mb-8 animate-pulse" />
                       <button onClick={(e) => { e.stopPropagation(); onSelectProfile(profile.id); }} className="px-8 py-4 bg-[#ffea00] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest">Unlock {broadcast.lock_price || COST_PREMIUM_VAULT_UNLOCK} BP</button>
                   </div>
                ) : (
                    <video src={proxyImg(postUrl)} autoPlay loop muted playsInline className="relative z-10 w-full h-full object-cover md:object-contain" />
                )}
             </>
          ) : postType === 'image' ? (
             <>
                <img src={proxyImg(postUrl || profile.image)} alt="" className={`absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 ${broadcast.is_locked ? 'blur-[100px]' : ''}`} />
                <BrandingOverlay profileName={profile.name} />
                {broadcast.is_locked ? (
                   <div className="relative z-20 w-full h-full flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-3xl">
                       <Lock size={40} className="text-[#ff00ff] mb-8 animate-pulse" />
                       <button onClick={(e) => { e.stopPropagation(); onSelectProfile(profile.id); }} className="px-8 py-4 bg-[#ff00ff] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Unlock {broadcast.lock_price || COST_VAULT_UNLOCK} BP</button>
                   </div>
                ) : (
                    <img src={proxyImg(postUrl || profile.image)} alt="" className="relative z-10 w-full h-full object-cover md:object-contain" />
                )}
             </>
          ) : (
             <div className="relative z-10 w-full h-full flex items-center justify-center p-6 md:p-12">
                <div className="max-w-xl w-full p-8 md:p-10 rounded-[2.5rem] bg-black/60 border border-white/5 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
                   <div className="absolute top-0 left-6 px-4 py-1 bg-[#ffea00] text-black text-[9px] font-black uppercase italic rounded-b-lg">Trending // High-Heat</div>
                   <div className="space-y-6 pt-4">
                      <div className="flex items-center gap-3" onClick={() => onSelectProfile(profile.id)}>
                         <img src={proxyImg(profile.image)} className="w-12 h-12 rounded-full border border-[#00f0ff]/40" alt="" />
                         <div className="flex flex-col">
                            <span className="text-sm font-black text-white uppercase italic">{profile.name}</span>
                            <span className="text-[8px] font-black text-[#00f0ff] uppercase tracking-widest italic">Verified Account</span>
                         </div>
                      </div>
                      <p className="text-xs md:text-sm font-bold text-white uppercase tracking-tight leading-relaxed font-mono whitespace-pre-wrap">{postText}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5 opacity-50">
                         <span className="text-[6px] font-black text-white/40 uppercase tracking-widest">Verified // Member Access Only</span>
                         <span className="text-[6px] font-black text-[#ffea00] uppercase tracking-widest italic">Found on GASP.FUN</span>
                      </div>
                   </div>
                </div>
             </div>
          )}
       </div>

       {/* ADMIN CONTROLS */}
       {(onDeletePost || onToggleFeatured || onUpdatePost || onEditBrain) && (
          <div className="absolute top-20 right-0 z-50 flex flex-col gap-2">
             {onDeletePost && <button onClick={(e) => { e.stopPropagation(); onDeletePost(broadcast.id); }} className="p-4 bg-black/60 hover:bg-red-500 rounded-l-2xl text-white/40 hover:text-white transition-all"><Trash2 size={20} /></button>}
             {onToggleFeatured && <button onClick={(e) => { e.stopPropagation(); onToggleFeatured(broadcast.id, !isFeatured); }} className={`p-4 bg-black/60 rounded-l-2xl ${isFeatured ? 'text-[#ffea00]' : 'text-white/20'}`}><Star size={20} fill={isFeatured ? '#ffea00' : 'none'} /></button>}
          </div>
       )}

       {/* INTERACTION OVERLAY (HIDDEN FOR TEXT OR WEATHER LOGS) */}
       {postType !== 'text' && (
          <div className="relative z-10 w-full h-full flex flex-col justify-end p-8 md:p-16 pb-32 pointer-events-none">
              <div className="space-y-6 pointer-events-auto">
                 <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                       <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">{displayName}</h2>
                    </div>
                    {showChatBubble && (
                       <button onClick={(e) => { e.stopPropagation(); onSelectProfile(profile.id); }} className="px-4 py-2 bg-[#00f0ff] text-black text-[8px] font-black uppercase rounded-full animate-bounce underline-offset-4 decoration-black">chat w/ {displayName}?</button>
                    )}
                 </div>
                 <div className="flex items-center gap-4">
                    {/* 🏮 LIKE: The Signal */}
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleLike(); 
                      }} 
                      className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center backdrop-blur-md transition-all active:scale-90 ${hasLiked ? 'bg-red-500/10 border-red-500/40 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-black/20 border-white/10 text-white/40 hover:border-red-500/50 hover:text-white'}`}
                    >
                       <Heart size={22} fill={hasLiked ? 'currentColor' : 'none'} />
                       <span className="text-[7px] font-black uppercase tracking-widest mt-1">Like</span>
                    </button>

                    {/* 🛰️ FAVORITE: The Shadow Syndicate Signal */}
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const newState = !isFollowing;
                        setIsFollowing(newState);
                        // 🛰️ SIGNAL PULSE: Force Sidebar & Bubbles to re-sync live
                        window.dispatchEvent(new CustomEvent('gasp_sync_follows', { 
                          detail: { personaId: profile.id, isFollowing: newState } 
                        }));
                        
                        // Persist to DB
                        fetch('/api/rpc/db', {
                          method: 'POST',
                          body: JSON.stringify({ action: 'toggle-follow', payload: { personaId: profile.id, userId: localStorage.getItem('gasp_guest_id') } })
                        });
                      }} 
                      className={`h-16 px-6 rounded-2xl border flex items-center justify-center gap-3 backdrop-blur-md transition-all active:scale-90 ${isFollowing ? 'bg-[#ffea00] text-black border-[#ffea00] shadow-[0_0_30px_#ffea00]/30' : 'bg-black/20 border-white/10 text-white/40 hover:border-[#ffea00]/50 hover:text-white'}`}
                    >
                       <Star size={20} fill={isFollowing ? 'currentColor' : 'none'} />
                       <span className="text-[9px] font-black uppercase tracking-widest leading-none">{isFollowing ? 'Favorited' : 'Favorite'}</span>
                    </button>
                 </div>
              </div>
          </div>
       )}
    </motion.div>
  );
}

export default function GlobalFeed({ onSelectProfile, profiles = [] }: GlobalFeedProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [textRes, mediaRes] = await Promise.all([
           fetch('/api/admin/feed?limit=50&type=text'),
           fetch('/api/admin/feed?limit=50&type=media')
        ]);
        
        const textData = await textRes.json();
        const mediaData = await mediaRes.json();
        
        const texts = textData.posts || [];
        const media = mediaData.posts || [];
        
        const woven = [];
        let tIndex = 0;
        let mIndex = 0;

        while (tIndex < texts.length || mIndex < media.length) {
            if (tIndex < texts.length) woven.push(texts[tIndex++]);
            if (tIndex < texts.length) woven.push(texts[tIndex++]);
            
            if (mIndex < media.length) woven.push(media[mIndex++]);
            if (mIndex < media.length) woven.push(media[mIndex++]);
        }

        setItems(woven);
      } catch (e) {
        console.error('Feed load fail:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
     <div className="w-full h-full flex flex-col items-center justify-center bg-black gap-6">
        <Zap size={48} className="text-[#ffea00] animate-spin" />
        <span className="text-[10px] font-black text-white/20 uppercase tracking-[.5em] animate-pulse">Loading Syndicate Feed...</span>
     </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto bg-black pt-32 md:pt-40 pb-32">
      {items.map((broadcast, i) => {
        const profile = profiles.find(p => p.id === broadcast.persona_id) || initialProfiles[0];
        return (
          <div key={broadcast.id} className="snap-start snap-always">
             <GlobalFeedItem 
               index={i}
               broadcast={broadcast}
               profile={profile}
               onSelectProfile={onSelectProfile}
             />
          </div>
        );
      })}
    </div>
  );
}
