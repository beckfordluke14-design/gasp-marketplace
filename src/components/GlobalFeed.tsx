'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { initialProfiles, proxyImg, getProfileName, type Profile, type Broadcast } from '@/lib/profiles';
import { MessageSquare, Zap, Lock, Heart, Trash2, Star, Brain, X, Save, Pencil, Check } from 'lucide-react';
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

function ProfileEditor({ profile, isOpen, onClose, onSave }: { profile: Profile, isOpen: boolean, onClose: () => void, onSave: (update: any) => void }) {
    const [vibe, setVibe] = useState(profile.vibe || '');
    const [prompt, setPrompt] = useState(profile.systemPrompt || '');
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
                                <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Edit Profile: {profile.name}</h3>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={24} className="text-white/40" /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Public Vibe</label>
                                <textarea value={vibe} onChange={(e) => setVibe(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-outfit min-h-[100px] focus:border-[#ffea00]/30 outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Core Instructions (Hidden)</label>
                                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[#ffea00]/90 font-mono text-xs min-h-[150px] focus:border-[#ffea00]/30 outline-none transition-all" />
                            </div>
                        </div>

                        <button onClick={handleSave} disabled={loading} className="w-full bg-white text-black font-black uppercase py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#ffea00] transition-all disabled:opacity-50">
                            {loading ? <Zap size={24} className="animate-spin" /> : <><Save size={24} /><span>Update Profile Hub</span></>}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function GlobalFeedItem({ profile, broadcast, onSelectProfile, onDeletePost, onToggleFeatured, onUpdatePost, isFeatured, onEditBrain, index }: { profile: Profile; broadcast: Broadcast; onSelectProfile: (id: string, initialMsg?: string) => void; onDeletePost?: (id: string) => void; onToggleFeatured?: (id: string, state: boolean) => void; onUpdatePost?: (id: string, caption: string) => void; isFeatured?: boolean; onEditBrain?: (profile: Profile) => void; index: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(broadcast.content || '');
  const displayName = getProfileName(profile);

  const handleSave = () => {
    if (onUpdatePost) onUpdatePost(broadcast.id, editedCaption);
    setIsEditing(false);
  };
  const [likes, setLikes] = useState(broadcast.likes_count || Math.floor(Math.random() * 500));
  const [hasLiked, setHasLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showChatBubble, setShowChatBubble] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

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
      initial={{ opacity: 0, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      onClick={handleInteraction}
      className="relative w-full h-[100dvh] overflow-hidden bg-transparent flex flex-col items-center justify-center border-b border-white/5 last:border-0 cursor-pointer group"
    >
       <div className="absolute inset-0 z-0 bg-transparent flex items-start md:items-center justify-center transition-all duration-1000 group-active:scale-105 group-active:opacity-80">
          {broadcast.type === 'video' ? (
             <>
                <video src={proxyImg(broadcast.video_url)} autoPlay loop muted playsInline preload="auto" className={`absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-110 pointer-events-none ${broadcast.is_locked ? 'blur-[100px]' : ''}`} />
                <BrandingOverlay profileName={profile.name} />

                {broadcast.is_locked ? (
                   <div className="relative z-20 w-full h-full flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-3xl">
                       <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-[#ffea00]/20 border border-[#ffea00]/40 flex items-center justify-center shadow-[0_0_50px_rgba(255,234,0,0.2)] mb-8 animate-pulse">
                         <Lock size={40} className="text-[#ffea00]" />
                      </div>
                      <div className="text-center space-y-4">
                         <div className="flex items-center justify-center gap-2 mb-2">
                             <div className="px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">Heat Level 5 // Prime Unlock</span>
                             </div>
                         </div>
                         <h3 className="text-2xl md:text-4xl font-syncopate font-black italic tracking-tighter uppercase text-white drop-shadow-2xl">Operational Intelligence Archive</h3>
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">restricted field intelligence sync</p>
                         <button 
                             onClick={(e) => { 
                                  e.stopPropagation(); 
                                  trackEvent('vault_unlock_intent', profile.id, { postId: broadcast.id, type: 'video', price: broadcast.lock_price || COST_PREMIUM_VAULT_UNLOCK });
                                  onSelectProfile(profile.id, 'unlock your video for me baby?'); 
                               }}
                             className="mt-8 px-12 py-5 bg-[#ffea00] text-black rounded-3xl text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,234,0,0.3)] hover:scale-105 active:scale-95 transition-all"
                         >
                            Unlock for {broadcast.lock_price || COST_PREMIUM_VAULT_UNLOCK} credits
                         </button>
                      </div>
                      <video src={proxyImg(broadcast.video_url)} className="absolute inset-0 w-full h-full object-cover -z-10 blur-[130px] opacity-10" />
                   </div>
                ) : (
                    <img 
                       src={proxyImg(broadcast.image_url || profile.image)} 
                       alt="" 
                       referrerPolicy="no-referrer" 
                       className="relative z-10 w-full h-full object-cover md:object-contain pt-0 pb-0 opacity-100" 
                       loading={index < 2 ? "eager" : "lazy"}
                       decoding="async"
                    />
                )}
             </>
          ) : broadcast.type === 'image' ? (
             <>
                <img 
                   src={proxyImg(broadcast.image_url || profile.image)} 
                   alt="" 
                   onError={(e) => {
                       (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=ff00ff&color=fff&bold=true`;
                    }}
                   referrerPolicy="no-referrer" 
                   className={`absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-110 pointer-events-none ${broadcast.is_locked ? 'blur-[100px]' : ''}`} 
                   loading="lazy"
                   decoding="async"
                />
                <BrandingOverlay profileName={profile.name} />
                
                {broadcast.is_locked ? (
                   <div className="relative z-20 w-full h-full flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-3xl">
                       <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-[#ff00ff]/20 border border-[#ff00ff]/40 flex items-center justify-center shadow-[0_0_50px_rgba(255,0,255,0.2)] mb-8 animate-pulse">
                         <Lock size={40} className="text-[#ff00ff]" />
                      </div>
                      <div className="text-center space-y-4">
                         <div className="flex items-center justify-center gap-2 mb-2">
                             <div className="px-3 py-1 bg-[#ff00ff]/20 border border-[#ff00ff]/40 rounded-full flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#ff00ff] animate-ping" />
                                <span className="text-[9px] font-black text-[#ff00ff] uppercase tracking-[0.2em]">Heat Level 4 // Exclusive Set</span>
                             </div>
                         </div>
                         <h3 className="text-2xl md:text-4xl font-syncopate font-black italic tracking-tighter uppercase text-white drop-shadow-2xl">Secure Data Uplink</h3>
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">classified operational briefing</p>
                         <button 
                            onClick={(e) => { 
                                 e.stopPropagation();                                 trackEvent('vault_unlock_intent', profile.id, { type: 'image', price: broadcast.lock_price || COST_VAULT_UNLOCK });
                                 onSelectProfile(profile.id, 'i want to unlock your vault set mi amor'); 
                              }}
                             className="mt-8 px-12 py-5 bg-[#ff00ff] text-white rounded-3xl text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,0,127,0.3)] hover:scale-105 active:scale-95 transition-all"
                         >
                            Unlock for {broadcast.lock_price || COST_VAULT_UNLOCK} credits
                         </button>
                      </div>
                      <img 
                        src={proxyImg(broadcast.image_url || profile.image)} 
                        alt="" 
                        onError={(e) => {
                           (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=ff00ff&color=fff&bold=true`;
                        }}
                        className="absolute inset-0 w-full h-full object-cover -z-10 blur-[130px] opacity-20" 
                      />
                   </div>
                ) : (
                    <img 
                       src={proxyImg(broadcast.image_url || profile.image)} 
                       alt="" 
                       referrerPolicy="no-referrer" 
                       className="relative z-10 w-full h-full object-cover md:object-contain pt-0 pb-0 opacity-100" 
                       loading={index < 2 ? "eager" : "lazy"}
                       decoding="async"
                    />
                )}
             </>
          ) : broadcast.type === 'text' ? (
             <div className="relative z-10 w-full h-full flex items-center justify-center p-6 md:p-12 bg-[#050505]">
                {/* 🛡️ GHOST INFRASTRUCTURE */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,240,255,0.05)_0%,_transparent_70%)] pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                
                <div className="max-w-xl w-full p-4 md:p-10 rounded-[2.5rem] bg-black/60 border border-white/5 backdrop-blur-3xl relative group/card overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                   {/* 🎞️ SCANLINE EFFECT */}
                   <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/[0.02] to-transparent h-[200%] animate-[scan_8s_linear_infinite]" />
                   
                   {/* 💎 MINIMALIST CORNER WATERMARK */}
                   <span className="text-[10px] md:text-[14px] font-black italic tracking-widest text-[#ff00ff] opacity-20 absolute bottom-2 right-4 whitespace-nowrap z-0 pointer-events-none">
                      FOUND ON GASP.FUN
                   </span>
                   {/* 🏷️ YELLOW STRATEGIC TAG */}
                   <div className="absolute top-0 left-6 px-4 py-1 bg-[#ffea00] text-black text-[9px] font-black uppercase italic rounded-b-lg shadow-[0_5px_15px_rgba(255,234,0,0.2)] z-50">
                      Sector Intelligence Hub // High-Heat Node
                   </div>

                   <div className="space-y-3 relative z-10 pt-2 pb-0">
                      {/* 👤 NEURAL HEADER NODE (LINKED) */}
                      <div className="flex items-center gap-3">
                         <div 
                            onClick={() => onSelectProfile(profile.id)}
                            className="w-12 h-12 rounded-full overflow-hidden border border-[#00f0ff]/40 shadow-[0_0_20px_rgba(0,240,255,0.1)] p-0.5 bg-black/40 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer group/avatar"
                         >
                            <div className="w-full h-full rounded-full overflow-hidden">
                               <img 
                                  src={profile.image && profile.image.length > 5 ? proxyImg(profile.image) : `https://api.dicebear.com/7.x/micah/svg?seed=${profile.name}`} 
                                  alt="" 
                                  className="w-full h-full object-cover object-top" 
                               />
                            </div>
                         </div>
                         <div className="flex flex-col grow">
                            <div className="flex items-center justify-between" onClick={() => onSelectProfile(profile.id)}>
                               <span className="text-[10px] md:text-sm font-black italic tracking-tighter text-white uppercase leading-none cursor-pointer hover:text-[#00f0ff] transition-colors">{profile.name}</span>
                               <span className="text-[6px] font-black uppercase text-white/20 tracking-widest">{new Date(broadcast.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                               <div className="px-1.5 py-0.2 bg-[#00f0ff]/10 rounded border border-[#00f0ff]/20">
                                  <span className="text-[6px] font-black text-[#00f0ff] uppercase tracking-widest italic">FIELD ANALYST</span>
                               </div>
                               <span className="text-[6px] font-black uppercase text-[#ffea00] italic tracking-widest animate-pulse">Live Alpha</span>
                            </div>
                         </div>
                      </div>

                      {/* 📄 CONSOLIDATED SIGNAL HUBS */}
                      <div className="space-y-2 pt-1">
                         <div className="flex items-start gap-2">
                           <div className="w-1 h-1 rounded-full bg-[#ffea00] mt-1 shrink-0" />
                           <p className="text-[10px] md:text-xs font-bold text-white uppercase tracking-tight leading-tight opacity-90 font-mono">
                              {broadcast.content}
                           </p>
                         </div>

                         <div className="flex items-center justify-between pt-2 border-t border-white/5 opacity-50">
                            <span className="text-[6px] font-black uppercase text-white/40 tracking-[0.2em]">Verified // 100% Accuracy</span>
                            <span className="text-[6px] font-black uppercase text-[#ffea00] tracking-widest italic">STRATEGIC ASSET CLASS</span>
                         </div>
                      </div>
                   </div>
                </div>

             </div>
          ) : (
             <div className="w-full h-full bg-[#050505]"><BrandingOverlay profileName={profile.name} /></div>
          )}
          {/* Ghost Shield: Pure Transparency Over Content */}
          <div className="absolute inset-0 bg-transparent opacity-100" />
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
                <button onClick={(e) => { e.stopPropagation(); onEditBrain(profile); }} className="p-5 md:p-6 bg-black/60 hover:bg-[#ffea00]/90 backdrop-blur-2xl rounded-l-3xl text-white/40 hover:text-white transition-all border border-r-0 border-white/10">
                   <Brain size={24} />
                </button>
             )}
          </div>
       )}

        <div className="relative z-10 w-full max-w-xl px-4 flex flex-col items-center justify-center min-h-screen pointer-events-none">
              <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-end p-8 md:p-16 pb-32">
                    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                      <div className="flex flex-col gap-2 pointer-events-auto">
                         <div className="flex items-center gap-3 relative">
                         <div className="flex flex-col gap-1.5 mb-2 pointer-events-auto">
                           <div className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-[#00f0ff] animate-pulse" />
                              <span className="text-[7px] font-black uppercase tracking-[0.4em] text-[#00f0ff] opacity-60 italic whitespace-nowrap">Field Analyst // Secure Uplink</span>
                           </div>
                           <span className="text-[12px] font-black uppercase italic tracking-tighter text-white/90 drop-shadow-2xl">{displayName}</span>
                        </div>
                        
                        <AnimatePresence>
                           {showChatBubble && (
                             <motion.div 
                               initial={{ opacity: 0, x: -10, scale: 0.8 }}
                               animate={{ 
                                 opacity: 1, 
                                 x: 0, 
                                 scale: 1,
                                 y: [0, -4, 0] 
                               }}
                               exit={{ opacity: 0, scale: 0.8 }}
                               transition={{
                                 y: {
                                    repeat: Infinity,
                                    duration: 2,
                                    ease: "easeInOut"
                                 }
                               }}
                               onClick={(e) => { 
                                 e.stopPropagation(); 
                                 onSelectProfile(profile.id); 
                                }}
                               className="flex items-center gap-2 px-3 py-1 bg-[#00f0ff] rounded-full shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer hover:scale-105 active:scale-95 transition-all select-none"
                             >
                                <span className="text-[8px] font-black text-black uppercase tracking-widest whitespace-nowrap">Sync Signal?</span>
                             </motion.div>
                           )}
                        </AnimatePresence>

                        <div className="w-1 h-1 rounded-full bg-[#00f0ff] opacity-40 ml-2" />
                     </div>
                    
                     {isEditing ? (
                        <textarea 
                           value={editedCaption}
                           onChange={(e) => setEditedCaption(e.target.value)}
                           onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                           className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-[12px] font-black tracking-tighter text-white italic lowercase selection:bg-[#ff00ff] outline-none"
                           autoFocus
                        />
                     ) : broadcast.type !== 'text' ? (
                        <h2 className="text-[9px] md:text-[10px] font-black tracking-[0.2em] text-white/40 uppercase leading-relaxed italic drop-shadow-2xl max-w-[80%]">
                           {broadcast.content}
                        </h2>
                     ) : null}
                       </div>
                       <div className="flex items-center gap-4 md:gap-6 pointer-events-auto">
                           <button onClick={handleLike} className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl backdrop-blur-md border flex flex-col items-center justify-center transition-all ${hasLiked ? 'bg-red-500/10 border-red-500/40 text-red-500' : 'bg-black/10 border-white/5 text-white/30 hover:scale-110 hover:border-white/20'}`}>
                              <Heart size={20} className={hasLiked ? 'fill-current' : ''} />
                              <span className="text-[7px] font-black mt-0.5 uppercase tracking-widest">{likes > 0 ? likes : 'heat'}</span>
                           </button>
 
                           <button 
                              onClick={async (e) => {
                                 e.stopPropagation();
                                 const gid = localStorage.getItem('gasp_guest_id');
                                 if (!gid) return;
 
                                 const next = !isFollowing;
                                 setIsFollowing(next);
 
                                 try {
                                   await fetch('/api/rpc/db', {
                                     method: 'POST',
                                     body: JSON.stringify({ action: 'toggle-follow', payload: { userId: gid, personaId: profile.id, isFollowing: !next } })
                                   });
                                   window.dispatchEvent(new Event('gasp_sync_follows'));
                                 } catch (err) {
                                   setIsFollowing(!next);
                                 }
                              }}
                              className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl backdrop-blur-md border flex flex-col items-center justify-center transition-all ${isFollowing ? 'bg-[#ffea00]/10 border-[#ffea00]/30 text-[#ffea00]' : 'bg-black/10 border-white/5 text-white/20 hover:scale-110'}`}
                           >
                              <Star size={20} className={isFollowing ? 'fill-[#ffea00]' : ''} />
                              <span className="text-[7px] font-black mt-0.5 uppercase tracking-widest">{isFollowing ? 'secured' : 'secure'}</span>
                           </button>
                        </div>
                   </div>
             </div>
       </div>
    </motion.div>
  );
}

import MobilePulseTicker from './MobilePulseTicker';
import StoriesRow from './StoriesRow';
import ProfileSearch from './ProfileSearch';

export default function GlobalFeed({ onSelectProfile, profiles = [], deadIds = new Set(), setDeadIds = () => {} }: GlobalFeedProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFetching = useRef(false);
  const pageRef = useRef(0);

  useEffect(() => {
     if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'true') {
           document.cookie = "admin_gasp_override=granted; path=/; max-age=31536000; SameSite=Lax";
           setIsAdmin(true);
           setShowAdminControls(true); 
        }
        setIsAdmin(document.cookie.includes('admin_gasp_override=granted'));

         const handleSync = (e: any) => setShowAdminControls(e.detail);
         window.addEventListener('gasp_admin_toggle', handleSync);
         return () => window.removeEventListener('gasp_admin_toggle', handleSync);
      }
   }, []);

   const handleToggleFeatured = async (postId: string, newState: boolean) => {
      try {
        const context = items.find(i => i.broadcast.id === postId);
        if (!context) return;
        
        const localStarred = JSON.parse(localStorage.getItem('gasp_starred_ids') || '[]');
        if (newState) { if (!localStarred.includes(postId)) localStarred.push(postId); }
        else { const idx = localStarred.indexOf(postId); if (idx > -1) localStarred.splice(idx, 1); }
        localStorage.setItem('gasp_starred_ids', JSON.stringify(localStarred));

        setItems(prev => {
           const next = prev.map(item => item.broadcast.id === postId ? { ...item, broadcast: { ...item.broadcast, is_featured: newState } } : item);
           return next.sort((a, b) => {
              if (a.broadcast.is_featured && !b.broadcast.is_featured) return -1;
              if (!a.broadcast.is_featured && b.broadcast.is_featured) return 1;
              return new Date(b.broadcast.created_at).getTime() - new Date(a.broadcast.created_at).getTime();
           });
        });

         await fetch('/api/admin/audit', {
             method: 'POST',
             body: JSON.stringify({ action: 'update-post', payload: { 
                 id: postId, 
                 is_featured: newState,
                 persona_id: context.profile.id,
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

        setItems(prev => prev.map(p => p.broadcast.id === id ? { ...p, broadcast: { ...p.broadcast, content: caption } } : p));

         try {
             await fetch('/api/admin/audit', {
                 method: 'POST',
                 body: JSON.stringify({ action: 'update-post', payload: { 
                    id, 
                    caption,
                    persona_id: item.profile.id,
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
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const item = items.find(i => i.broadcast.id === postId);
      if (!item) return;

      const res = await fetch('/api/admin/audit', {
          method: 'POST',
          body: JSON.stringify({ 
            action: 'delete-post', 
            payload: { 
              id: postId,
              persona_id: item.profile.id,
              content_url: item.broadcast.image_url || item.broadcast.video_url,
              content_type: item.broadcast.type,
              is_vault: item.broadcast.is_locked
            } 
          })
      });
      const data = await res.json();
      if (data.success) {
          setItems(prev => prev.filter(n => n.broadcast.id !== postId));
      } else alert('Delete failed: ' + data.error);
    } catch(e) { console.error(e); }
  };

  const handleSaveProfile = async (update: any) => {
      if (!editingProfile) return;
      try {
          await fetch('/api/admin/persona', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ personaId: editingProfile.id, update })
          });
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
        const res = await fetch(`/api/admin/feed?page=${pageNumber}`);
        const data = await res.json();
        dbPosts = data?.posts || [];
        
        if (dbPosts.length < 20) setHasMore(false);

        mergedItems = dbPosts.map((p: any) => {
           if (!p) return null;
           const isBriefing = !p.content_url;
           const pDataRaw = (Array.isArray(p.personas) ? p.personas[0] : p.personas) || {};
           const fallback = (initialProfiles.find(i => i.id === p.persona_id) || {}) as any;
           const finalProfile = { 
             ...fallback, 
             ...pDataRaw, 
             id: p.persona_id || pDataRaw.id || fallback.id,
             image: pDataRaw.seed_image_url || pDataRaw.image || fallback.image
           };
           if (!finalProfile.name) return null;
           return {
               profile: finalProfile,
               broadcast: { 
                 id: p.id, 
                 content: p.caption || '', 
                 is_featured: p.is_burner || false, 
                 image_url: p.content_url, 
                 video_url: p.content_url,
                 type: p.content_url ? (p.content_type || 'image') : 'text', 
                 is_locked: p.is_vault || false, 
                 likes_count: p.likes_count || 0,
                 created_at: p.created_at || new Date().toISOString() 
               }
           };
        }).filter((i: any) => 
            i !== null && 
            i.profile?.id && 
            i.profile?.name && 
            i.profile?.is_active !== false && 
            !i.broadcast.content?.startsWith('DELETED')
        );
    } catch(e) { 
        console.error('Feed Fetch Failure:', e); 
    }

    const initialItems = pageNumber === 0 
        ? initialProfiles.flatMap(p => (p.broadcasts || []).map(b => ({ profile: p, broadcast: { ...b, created_at: b.created_at || new Date().toISOString(), is_featured: b.is_featured || false } })))
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
        
        // 🧬 SOVEREIGN 2:2 INTERLEAVING (STRICT CADENCE: 2 text → 2 image → repeat)
        const textPosts = unique.filter(i => i.broadcast.type === 'text');
        const mediaPosts = unique.filter(i => i.broadcast.type === 'image' || i.broadcast.type === 'video');

        // If no media at all, just return text sorted by recency
        if (mediaPosts.length === 0) return unique.sort((a, b) => new Date(b.broadcast.created_at).getTime() - new Date(a.broadcast.created_at).getTime());
        // If no text, just return media
        if (textPosts.length === 0) return mediaPosts;

        const interleaved: any[] = [];
        let t = 0;
        let m = 0;
        const totalSlots = Math.max(textPosts.length, mediaPosts.length) * 2;
        let slots = 0;

        while (slots < totalSlots && (t < textPosts.length || m < mediaPosts.length)) {
          // 2x Text (loop if exhausted)
          for (let i = 0; i < 2; i++) {
            interleaved.push(textPosts[t % textPosts.length]);
            t++;
          }
          // 2x Media (loop if exhausted)
          for (let i = 0; i < 2; i++) {
            interleaved.push(mediaPosts[m % mediaPosts.length]);
            m++;
          }
          slots += 4;
          // Stop after cycling each pool once
          if (t >= textPosts.length && m >= mediaPosts.length) break;
        }

        return interleaved;
      });
    setLoading(false);
    isFetching.current = false;
  }, []);

  useEffect(() => {
    fetchFeed(0);

  }, [fetchFeed]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isFetching.current && hasMore && items.length > 0) {
            pageRef.current += 1;
            fetchFeed(pageRef.current);
        }
    }, {
        root: containerRef.current,
        threshold: 0.0,
        rootMargin: '400px',
    });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, items.length, fetchFeed]);

  return (
    <div ref={containerRef} className="flex-1 h-screen overflow-y-auto scroll-smooth no-scrollbar relative w-full touch-pan-y bg-transparent">
      
      <div className="fixed top-14 left-0 right-0 z-[1000] flex flex-col gap-0 pointer-events-none bg-transparent px-4 md:hidden">
          {/* Market Pulse Ticker */}
          <div className="scale-90 origin-top h-10">
             <MobilePulseTicker />
          </div>
          
          {/* Stories Node Uplink: Ultra-Thin Ghost Flow */}
          <div className="scale-[0.85] origin-top -mt-2 opacity-100 hover:opacity-100 transition-opacity">
              <StoriesRow profiles={profiles} onSelectProfile={onSelectProfile} />
          </div>

          {/* Neural Search Hub */}
          <div className="max-w-[200px] mx-auto scale-90 origin-top -mt-2 opacity-100 transition-opacity pointer-events-auto">
             <ProfileSearch deadIds={deadIds} setDeadIds={setDeadIds} />
          </div>
      </div>

      {items.length > 0 ? (
        items.map((item, index) => (
          <GlobalFeedItem 
            key={`${item.profile.id}-${item.broadcast.id}-${index}`} 
            profile={item.profile} 
            broadcast={item.broadcast} 
            index={index}
            onSelectProfile={onSelectProfile} 
            onDeletePost={(isAdmin && showAdminControls) ? handleAdminDelete : undefined} 
            onToggleFeatured={(isAdmin && showAdminControls) ? handleToggleFeatured : undefined} 
            onUpdatePost={(isAdmin && showAdminControls) ? handleUpdatePost : undefined}
            onEditBrain={(isAdmin && showAdminControls) ? setEditingProfile : undefined}
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

      {editingProfile && (
        <ProfileEditor 
          profile={editingProfile} 
          isOpen={!!editingProfile} 
          onClose={() => setEditingProfile(null)} 
          onSave={handleSaveProfile} 
        />
      )}

       <div className="p-12 text-center opacity-20 border-t border-white/5 space-y-2">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white">AllTheseFlows LLC d.b.a. AllTheseFlows Strategic Media</p>
          <p className="text-[7px] font-medium uppercase tracking-[0.2em] text-white/60">© 2026 GASP Syndicate. Strategic Operations Terminal. All Rights Reserved.</p>
      </div>
    </div>
  );
}
