'use client';

import { useState, useEffect } from 'react';
import { Shield, Zap, RefreshCw, Layers, Edit3, Trash2, Lock, Unlock, Check, Star, CornerRightDown } from 'lucide-react';
import { initialProfiles, proxyImg, getProfileName } from '@/lib/profiles';

/**
 * 🛰️ MASTER POST STUDIO (Restored & High-Fidelity)
 * Objective: Deep editorial control, node assignment, text/media merging, and Vault toggles.
 */
export default function PostStudio() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState('');
  
  const [mergingSourceId, setMergingSourceId] = useState<number | null>(null);

  async function loadStudio() {
    setLoading(true);
    try {
        const textRes = await fetch('/api/admin/feed?limit=100&type=text');
        const mediaRes = await fetch('/api/admin/feed?limit=100&type=media');
        const txtData = await textRes.json();
        const mdaData = await mediaRes.json();
        const allPosts = [...(txtData.posts || []), ...(mdaData.posts || [])].sort((a,b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setPosts(allPosts);
    } catch (e) {
        console.error('Studio sync fault:', e);
    }
    setLoading(false);
  }

  useEffect(() => { loadStudio(); }, []);

  const saveEdit = async (id: number) => {
    try {
        await fetch('/api/rpc/db', {
            method: 'POST',
            body: JSON.stringify({ action: 'update_post_caption', payload: { id, caption: editCaption } })
        });
        setPosts(prev => prev.map(p => p.id === id ? { ...p, content: editCaption, caption: editCaption } : p));
    } catch (e) {}
    setEditingId(null);
  };

  const deletePost = async (id: number) => {
    if (!confirm('Obliterate this intelligence node?')) return;
    try {
        await fetch('/api/rpc/db', {
            method: 'POST',
            body: JSON.stringify({ action: 'delete_post', payload: { id } })
        });
        setPosts(prev => prev.filter(p => p.id !== id));
    } catch (e) {}
  };

  const toggleVault = async (id: number, current: boolean) => {
    try {
        await fetch('/api/admin/feed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggleVault', postId: id, locked: !current })
        });
        setPosts(prev => prev.map(p => p.id === id ? { ...p, is_locked: !current } : p));
    } catch (e) {}
  };

  const toggleStar = async (id: number, current: boolean) => {
    try {
        await fetch('/api/admin/feed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggleStar', postId: id, featured: !current })
        });
        setPosts(prev => prev.map(p => p.id === id ? { ...p, is_featured: !current } : p));
    } catch (e) {}
  };

  // Merge Media post into Text post (attaches caption to media or media URL to text)
  const handleMerge = async (targetId: number) => {
     if (!mergingSourceId || mergingSourceId === targetId) {
         setMergingSourceId(null);
         return;
     }
     if (!confirm('Merge these two transmission nodes? The target will consume the source attributes.')) return;
     
     const source = posts.find(p => p.id === mergingSourceId);
     const target = posts.find(p => p.id === targetId);
     if (!source || !target) return;

     const mergedUrl = source.content_url || target.content_url;
     const mergedCaption = source.content || source.caption || target.content || target.caption;
     const mergedType = source.content_type === 'video' || target.content_type === 'video' ? 'video' 
                      : source.content_type === 'image' || target.content_type === 'image' ? 'image' : 'text';

     try {
         await fetch('/api/rpc/db', {
             method: 'POST',
             body: JSON.stringify({ 
                 action: 'merge_post', 
                 payload: { targetId, sourceId: mergingSourceId, mergedUrl, mergedCaption, mergedType }
             })
         });
         loadStudio(); // full refresh
     } catch (e) {}
     setMergingSourceId(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-outfit pb-32">
       <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-[#ff00ff]/10 rounded-2xl border border-[#ff00ff]/20 text-[#ff00ff]">
               <Layers size={32} />
            </div>
            <div>
               <h1 className="text-3xl font-black uppercase italic tracking-tighter">Sovereign Post Studio</h1>
               <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">Deep Editorial & Asset Merging Console</p>
            </div>
         </div>
         <button onClick={loadStudio} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white hover:text-black transition-all">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
         </button>
       </div>

       {mergingSourceId && (
           <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[500] px-6 py-3 bg-[#ffea00] text-black rounded-full font-black uppercase text-[10px] tracking-widest shadow-[0_0_50px_#ffea00] flex items-center gap-3 animate-pulse cursor-pointer" onClick={() => setMergingSourceId(null)}>
               <CornerRightDown size={14} /> Merge Origin Selected. Click a Target Profile below, or click here to cancel.
           </div>
       )}

       {loading && posts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-30 gap-6">
             <Zap size={40} className="animate-spin text-[#ff00ff]" />
             <span className="text-[10px] font-black uppercase tracking-widest">Hydrating Studio Memory...</span>
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {posts.map(post => {
                 const postType = post.content_type || post.type || 'text';
                 const postUrl = post.content_url || post.media_url || post.image_url;
                 const postText = post.content || post.caption || '';
                 const profile = initialProfiles.find(p => String(p.id) === String(post.persona_id));
                 
                 const isEditing = editingId === post.id;
                 const isMergingSrc = mergingSourceId === post.id;

                 return (
                     <div key={post.id} className={`bg-white/5 border rounded-[2rem] p-6 flex flex-col relative overflow-hidden transition-all ${isMergingSrc ? 'border-[#ffea00] shadow-[0_0_50px_rgba(255,234,0,0.2)]' : mergingSourceId ? 'border-white/20 hover:border-[#ffea00] cursor-pointer' : 'border-white/5 hover:border-white/20'}`} onClick={() => mergingSourceId && handleMerge(post.id)}>
                         
                         {/* Header */}
                         <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                               <img src={proxyImg(profile?.image || '/v1.png')} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="" />
                               <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff]">{profile?.name || post.persona_id}</p>
                                  <p className="text-[8px] text-white/20 uppercase font-bold italic">Node: {String(post.persona_id).substring(0,8)}</p>
                               </div>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-white/10 rounded-md text-white/40">{postType}</span>
                         </div>

                         {/* Content Preview */}
                         <div className="bg-black/40 rounded-xl overflow-hidden mb-6 relative aspect-video flex-shrink-0 flex items-center justify-center border border-white/5">
                             {postType !== 'text' && postUrl ? (
                                postType === 'video' ? <video src={proxyImg(postUrl)} autoPlay loop muted playsInline className="w-full h-full object-contain opacity-50" />
                                                     : <img src={proxyImg(postUrl)} className="w-full h-full object-contain opacity-50" alt="" />
                             ) : (
                                <Zap size={24} className="text-white/10" />
                             )}
                             {(post.is_locked || post.is_featured) && (
                                <div className="absolute top-2 right-2 flex gap-2">
                                   {post.is_locked && <Lock size={12} className="text-[#ff00ff]" />}
                                   {post.is_featured && <Star size={12} fill="#ffea00" className="text-[#ffea00]" />}
                                </div>
                             )}
                         </div>

                         {/* Text Editor */}
                         <div className="flex-1 mb-6">
                             {isEditing ? (
                                <div className="space-y-3">
                                    <textarea 
                                        value={editCaption}
                                        onChange={e => setEditCaption(e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                        className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-white/60 focus:outline-none focus:border-[#00f0ff] resize-none"
                                    />
                                    <div className="flex gap-2">
                                       <button onClick={(e) => { e.stopPropagation(); saveEdit(post.id); }} className="flex-1 py-2 bg-[#00f0ff]/10 text-[#00f0ff] text-[10px] font-black uppercase hover:bg-[#00f0ff] hover:text-black rounded-lg transition-all flex items-center justify-center gap-2"><Check size={12} /> Save Hash</button>
                                       <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="px-4 py-2 bg-white/5 text-white/40 text-[10px] font-black uppercase hover:bg-white/10 hover:text-white rounded-lg transition-all">Cancel</button>
                                    </div>
                                </div>
                             ) : (
                                <div className="group/txt relative cursor-text" onClick={(e) => { if (mergingSourceId) return; e.stopPropagation(); setEditCaption(postText); setEditingId(post.id); }}>
                                    <p className="text-[11px] text-white/40 font-mono whitespace-pre-wrap leading-relaxed min-h-[40px] group-hover/txt:text-white transition-colors">{postText || 'NO_TEXT_ATTACHED'}</p>
                                    <Edit3 size={12} className="absolute -top-4 -right-2 opacity-0 group-hover/txt:opacity-100 text-[#00f0ff] transition-opacity" />
                                </div>
                             )}
                         </div>

                         {/* Tools Menu */}
                         {!mergingSourceId && (
                             <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                 <div className="flex items-center gap-1">
                                     <button onClick={(e) => { e.stopPropagation(); toggleVault(post.id, post.is_locked); }} className={`p-3 rounded-lg flex items-center justify-center transition-all ${post.is_locked ? 'bg-[#ff00ff]/20 text-[#ff00ff] hover:bg-[#ff00ff]/30' : 'bg-white/5 text-white/20 hover:text-white'}`}>
                                         {post.is_locked ? <Lock size={14} /> : <Unlock size={14} />}
                                     </button>
                                     <button onClick={(e) => { e.stopPropagation(); toggleStar(post.id, post.is_featured); }} className={`p-3 rounded-lg flex items-center justify-center transition-all ${post.is_featured ? 'bg-[#ffea00]/20 text-[#ffea00] hover:bg-[#ffea00]/30' : 'bg-white/5 text-white/20 hover:text-white'}`}>
                                         <Star size={14} fill={post.is_featured ? 'currentColor' : 'none'} />
                                     </button>
                                     <button onClick={(e) => { e.stopPropagation(); setMergingSourceId(post.id); }} className="p-3 bg-white/5 text-white/20 hover:text-[#ffea00] hover:bg-[#ffea00]/10 rounded-lg flex items-center justify-center transition-all title='Merge with another node'">
                                         <Layers size={14} />
                                     </button>
                                 </div>
                                 <button onClick={(e) => { e.stopPropagation(); deletePost(post.id); }} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg flex items-center justify-center transition-all">
                                    <Trash2 size={14} />
                                 </button>
                             </div>
                         )}
                     </div>
                 );
             })}
          </div>
       )}
    </div>
  );
}
