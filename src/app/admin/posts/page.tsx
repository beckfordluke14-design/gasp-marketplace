'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, Search, Filter, RefreshCw, Pencil, Trash2, Star, Hash, Image as ImageIcon,
  Settings, Lock, Unlock, EyeOff, Check, X, UserPlus, ArrowLeftRight, 
  MapPin, Clock, ShieldAlert, Sparkles, UserCheck, Link2, Copy, Gift, FolderHeart, ExternalLink, Package, User
} from 'lucide-react';
import { proxyImg, getProfileName } from '@/lib/profiles';
import NextLink from 'next/link';

interface PersonaPost {
  id: string;
  persona_id: string;
  content_url: string;
  content_type: string;
  is_vault: boolean;
  is_burner: boolean;
  is_freebie?: boolean;
  is_gallery?: boolean;
  caption: string;
  created_at: string;
  personas?: { name: string; age?: number; city?: string };
}

type FilterMode = 'all' | 'vault' | 'hero' | 'feed' | 'orphaned' | 'hidden' | 'gallery' | 'lost';

interface LostNode {
  id: string; // Cloudflare Key
  url: string;
  filename: string;
  size: number;
  lastModified: string;
  suggestedPersona: string;
}

interface EditDraft {
  caption: string;
  content_url: string;
  is_vault: boolean;
  is_burner: boolean;
  is_freebie: boolean;
  is_gallery: boolean;
  // Identity fields — write directly to personas table

  name: string;
  age: string;
  city: string;
}

export default function PostStudio() {
  const [mounted, setMounted]       = useState(false);
  const [posts, setPosts]           = useState<PersonaPost[]>([]);
  const [personas, setPersonas]     = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [personaFilter, setPersonaFilter] = useState('all');
  const [syncing, setSyncing]       = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [editPost, setEditPost]     = useState<PersonaPost | null>(null);
  const [draft, setDraft]           = useState<EditDraft | null>(null);
  const [saving, setSaving]         = useState(false);
  // Linked posts for the edit modal
  const [linkedPosts, setLinkedPosts] = useState<PersonaPost[]>([]);
  const [loadingLinked, setLoadingLinked] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // ── Lost Files (R2) State ──
  const [lostNodes, setLostNodes] = useState<LostNode[]>([]);
  const [loadingLost, setLoadingLost] = useState(false);

  const fetchLostNodes = useCallback(async () => {
     setLoadingLost(true);
     try {
       const res = await fetch('/api/admin/lostfiles');
       const json = await res.json();
       if (json.success) setLostNodes(json.nodes || []);
     } catch (e) {
       console.error('[PostStudio] Lost Nodes Scan Failure:', e);
     }
     setLoadingLost(false);
  }, []);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const longPressTimer = useState<any>(null)[0]; // Ref-like but simple

  // ── Identity Convergence State ──
  const [showSoloModal, setShowSoloModal]   = useState<PersonaPost | null>(null);
  const [soloDraft, setSoloDraft]           = useState({ name: '', age: '22', city: '', vibe: 'mysterious' });
  const [mergingPost, setMergingPost]       = useState<PersonaPost | null>(null);
  const [identityTarget, setIdentityTarget] = useState<{ id: string, name: string } | null>(null);

  // ── Sovereign Modals State ──
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState({ content_url: '', persona_id: '', caption: '', is_vault: true });
  
  const [linkTargetNode, setLinkTargetNode] = useState<LostNode | null>(null);
  const [linkPersonaId, setLinkPersonaId] = useState('');
  useEffect(() => { setMounted(true); }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      // all=true bypasses public-feed filters so admin sees vault/hidden posts too
      const res = await fetch('/api/admin/feed?page=0&limit=500&all=true');
      const json = await res.json();
      if (json.success) setPosts((json.posts || []) as PersonaPost[]);
    } catch (e) {
      console.error('[PostStudio] fetchPosts failed:', e);
    }
    setLoading(false);
  }, []);

  const fetchPersonas = useCallback(async () => {
    try {
      const res = await fetch('/api/personas');
      const json = await res.json();
      if (json.success) setPersonas(json.personas || []);
    } catch (e) {
      console.error('[PostStudio] fetchPersonas failed:', e);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchPosts();
    fetchPersonas();
  }, [mounted, fetchPosts, fetchPersonas]);

  if (!mounted) return null;

  const callAudit = async (action: string, payload: Record<string, any>) => {
    const res = await fetch('/api/admin/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
    return res.json();
  };

  const flash = (postId: string) => {
    setSavedFlash(postId);
    setTimeout(() => setSavedFlash(null), 2000);
  };

  // ── Vault toggle: does NOT affect hero status
  const toggleVault = async (post: PersonaPost) => {
    setSyncing(post.id);
    const next = !post.is_vault;
    const data = await callAudit('update-post', { id: post.id, is_vault: next });
    if (data.success) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_vault: next } : p));
      flash(post.id);
    }
    setSyncing(null);
  };

  // ── Hero toggle: sets post as hero AND forces it to feed (clears vault)
  const toggleHero = async (post: PersonaPost) => {
    setSyncing(post.id);
    const next = !post.is_burner;
    // Hero = always in feed: clear vault when enabling
    const data = await callAudit('update-post', {
      id: post.id,
      is_featured: next,
      ...(next ? { is_vault: false } : {}),  // hero forces feed
    });
    if (data.success) {
      setPosts(prev => prev.map(p =>
        p.id === post.id
          ? { ...p, is_burner: next, ...(next ? { is_vault: false } : {}) }
          : p
      ));
      // When SETTING hero: promote this post's image as the persona's canonical photo
      if (next && post.content_url) {
        await callAudit('update-persona', { id: post.persona_id, seed_image_url: post.content_url });
      }
      flash(post.id);
    }
    setSyncing(null);
  };

  // ── One-click push a vault post to the public feed
  const pushToFeed = async (post: PersonaPost) => {
    setSyncing(post.id);
    const data = await callAudit('update-post', { id: post.id, is_vault: false });
    if (data.success) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_vault: false } : p));
      flash(post.id);
    }
    setSyncing(null);
  };

  const toggleFreebie = async (post: PersonaPost) => {
    setSyncing(post.id);
    const next = !post.is_freebie;
    const data = await callAudit('mark-freebie', { id: post.id, is_freebie: next });
    if (data.success) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_freebie: next, is_vault: next ? false : p.is_vault } : p));
      flash(post.id);
    }
    setSyncing(null);
  };

  const toggleGallery = async (post: PersonaPost) => {
    setSyncing(post.id);
    const next = !post.is_gallery;
    const data = await callAudit('toggle-gallery', { id: post.id, is_gallery: next });
    if (data.success) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_gallery: next } : p));
      flash(post.id);
    }
    setSyncing(null);
  };

  const softHide = async (postId: string) => {
    if (!confirm('Hide this post from the public feed?')) return;
    setSyncing(postId);
    const data = await callAudit('delete-post', { id: postId });
    if (data.success) setPosts(prev => prev.filter(p => p.id !== postId));
    setSyncing(null);
  };

  // ── Mark as duplicate: instantly hides from feed in real time
  const markDuplicate = async (postId: string) => {
    setSyncing(postId);
    const data = await callAudit('delete-post', { id: postId });
    if (data.success) setPosts(prev => prev.filter(p => p.id !== postId));
    setSyncing(null);
  };

  const hardDelete = async (postId: string) => {
    if (!confirm('⚠️ PERMANENT DELETE — remove this post from the database entirely?')) return;
    setSyncing(postId);
    const data = await callAudit('delete-post-hard', { id: postId });
    if (data.success) setPosts(prev => prev.filter(p => p.id !== postId));
    setSyncing(null);
  };

  // ── Restore a hidden post: clears tombstone + promotes to Hero in the public feed
  const restoreAsHero = async (post: PersonaPost) => {
    setSyncing(post.id);
    // 1. Clear the DELETED_NODE_SYNC_V15 tombstone, promote to hero, push to feed
    const data = await callAudit('update-post', {
      id: post.id,
      caption: '',       // clear the tombstone
      is_burner: true,   // hero status
      is_vault: false,   // move to public feed
      is_featured: true,
    });
    if (data.success) {
      // 2. Promote the post's image as the persona's seed photo
      if (post.content_url) {
        await callAudit('update-persona', { id: post.persona_id, seed_image_url: post.content_url });
      }
      // 3. Update local state: remove from hidden list (it's now a feed post)
      setPosts(prev => prev.map(p =>
        p.id === post.id
          ? { ...p, caption: '', is_burner: true, is_vault: false }
          : p
      ));
      flash(post.id);
    }
    setSyncing(null);
  };

  // ── Open edit modal + fetch sibling posts
  const openEdit = async (post: PersonaPost) => {
    setEditPost(post);
    setDraft({
      caption:     post.caption || '',
      content_url: post.content_url || '',
      is_vault:    post.is_vault,
      is_burner:   post.is_burner,
      is_freebie:  post.is_freebie || false,
      is_gallery:  post.is_gallery || false,
      name: post.personas?.name || '',

      age:  String(post.personas?.age  || ''),
      city: post.personas?.city || '',
    });

    // Load sibling posts from same persona using service-role API
    setLoadingLinked(true);
    setLinkedPosts([]);
    try {
      const res = await fetch(`/api/admin/feed?persona_id=${post.persona_id}&limit=50`);
      const json = await res.json();
      const siblings = (json.posts || []).filter((p: PersonaPost) => p.id !== post.id);
      setLinkedPosts(siblings);
    } catch (e) {
      console.error('[PostStudio] linked posts fetch failed:', e);
    }
    setLoadingLinked(false);
  };

  const closeEdit = () => { setEditPost(null); setDraft(null); setLinkedPosts([]); };

  const saveAll = async () => {
    if (!editPost || !draft) return;
    setSaving(true);

    // 1. Save post DB fields
    await callAudit('update-post', {
      id:          editPost.id,
      caption:     draft.caption,
      content_url: draft.content_url,
      is_vault:    draft.is_vault,
      is_featured: draft.is_burner,
      is_freebie:  draft.is_freebie,
      is_gallery:  draft.is_gallery,
    });


    // 2. Write identity fields directly to personas table — single source of truth
    //    Chat API, story bar, and feed all read from here automatically.
    const originalName = editPost.personas?.name || '';
    const originalAge  = String(editPost.personas?.age || '');
    const originalCity = editPost.personas?.city || '';

    const identityChanged = (
      (draft.name && draft.name !== originalName) ||
      (draft.age  && draft.age  !== originalAge)  ||
      (draft.city && draft.city !== originalCity)
    );

    if (identityChanged) {
      const personaUpdate: Record<string, string> = {};
      if (draft.name && draft.name !== originalName) personaUpdate.name = draft.name;
      if (draft.age  && draft.age  !== originalAge)  personaUpdate.age  = draft.age;
      if (draft.city && draft.city !== originalCity) personaUpdate.city = draft.city;
      await callAudit('update-persona', { id: editPost.persona_id, ...personaUpdate });
    }

    // 3. Update local React state immediately (no flicker)
    setPosts(prev => prev.map(p => p.id === editPost.id ? {
      ...p,
      caption:     draft.caption,
      content_url: draft.content_url,
      is_vault:    draft.is_vault,
      is_burner:   draft.is_burner,
      is_freebie:  draft.is_freebie,
      is_gallery:  draft.is_gallery,
      personas: p.personas ? {

        ...p.personas,
        name: draft.name || p.personas.name,
        age:  draft.age ? Number(draft.age) : p.personas.age,
        city: draft.city || p.personas.city,
      } : p.personas,
    } : p));

    setSaving(false);
    flash(editPost.id);
    closeEdit();
  };

  // ── Bulk Console Actions ──
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) setSelectionMode(false);
      } else {
        next.add(id);
        setSelectionMode(true);
      }
      return next;
    });
  };

  const selectAll = () => {
    const allIds = filtered.map(p => p.id);
    setSelectedIds(new Set(allIds));
    setSelectionMode(true);
  };

  const cancelSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const bulkSoftHide = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length || !confirm(`Soft-hide ${ids.length} nodes from the public feed?`)) return;
    setLoading(true);
    const data = await callAudit('bulk-delete', { ids });
    if (data.success) {
      setPosts(prev => prev.filter(p => !selectedIds.has(p.id)));
      cancelSelection();
    }
    setLoading(false);
  };

  const bulkHardDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length || !confirm(`⚠️ PERMANENT PURGE — remove ${ids.length} nodes from existence?`)) return;
    setLoading(true);
    const data = await callAudit('bulk-delete-hard', { ids });
    if (data.success) {
      setPosts(prev => prev.filter(p => !selectedIds.has(p.id)));
      cancelSelection();
    }
    setLoading(false);
  };

  const deleteLinkedPost = async (lp: PersonaPost) => {
    if (!confirm('⚠️ Hard delete this post from the database?')) return;
    const data = await callAudit('delete-post-hard', { id: lp.id });
    if (data.success) {
      setLinkedPosts(prev => prev.filter(p => p.id !== lp.id));
      setPosts(prev => prev.filter(p => p.id !== lp.id));
    }
  };

  // ── Toggle vault on a linked post directly from the modal
  const toggleLinkedVault = async (post: PersonaPost) => {
    const next = !post.is_vault;
    await callAudit('update-post', { id: post.id, is_vault: next });
    setLinkedPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_vault: next } : p));
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_vault: next } : p));
  };

  const toggleLinkedHero = async (post: PersonaPost) => {
    const next = !post.is_burner;
    // Hero forces feed: clear vault flag when enabling hero
    await callAudit('update-post', {
      id: post.id,
      is_featured: next,
      ...(next ? { is_vault: false } : {}),
    });
    if (next && post.content_url) {
      await callAudit('update-persona', { id: post.persona_id, seed_image_url: post.content_url });
    }
    const patch = { is_burner: next, ...(next ? { is_vault: false } : {}) };
    setLinkedPosts(prev => prev.map(p => p.id === post.id ? { ...p, ...patch } : p));
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, ...patch } : p));
  };

  // ── Filtering — HERO posts appear in feed too (is_burner is additive)
  // Orphaned = persona has ONLY vault posts (no feed presence)
  const feedPersonaIds  = new Set(posts.filter(p => !p.is_vault).map(p => p.persona_id));
  const vaultPersonaIds = new Set(posts.filter(p =>  p.is_vault).map(p => p.persona_id));
  const orphanedPersonaIds = new Set(
    [...vaultPersonaIds].filter(id => !feedPersonaIds.has(id))
  );

  const filtered = posts.filter(p => {
    const name    = p.personas?.name || p.persona_id || '';
    const caption = p.caption || '';
    const s       = search.toLowerCase();
    const matchSearch  = !s || name.toLowerCase().includes(s) || caption.toLowerCase().includes(s) || (p.content_url || '').toLowerCase().includes(s);
    const matchPersona = personaFilter === 'all' || p.persona_id === personaFilter;
    const isHidden = (p.caption || '').startsWith('DELETED_NODE_SYNC_V15') || (p.caption || '').startsWith('DELETED');
    
    // 🛡️ Global Exclusion: Hidden items shouldn't show in ANY major feed except their own
    if (filterMode !== 'hidden' && isHidden) return false;

    const matchMode =
      filterMode === 'all'      ? !isHidden :
      filterMode === 'vault'    ? (!!p.is_vault && !isHidden) :
      filterMode === 'hero'     ? (!!p.is_burner && !isHidden) :
      filterMode === 'gallery'  ? (!!p.is_gallery && !isHidden) :
      filterMode === 'orphaned' ? (!!p.is_vault && orphanedPersonaIds.has(p.persona_id) && !isHidden) :
      filterMode === 'hidden'   ? isHidden :
      // Feed = not vault and not gallery
      (!p.is_vault && !p.is_gallery && !isHidden);

    return matchSearch && matchPersona && matchMode;
  });


  const filterTabs: { label: string; value: FilterMode; alert?: boolean }[] = [
    { label: `All (${posts.length})`,                                                              value: 'all' },
    { label: `Feed (${posts.filter(p => !p.is_vault).length})`,                                   value: 'feed' },
    { label: `Vault (${posts.filter(p => p.is_vault && !p.caption?.startsWith('DELETED')).length})`,    value: 'vault' },
    { label: `Gallery (${posts.filter(p => p.is_gallery && !p.caption?.startsWith('DELETED')).length})`, value: 'gallery' },
    { label: `Hero (${posts.filter(p => p.is_burner && !p.caption?.startsWith('DELETED')).length})`,    value: 'hero' },
    { label: `Orphaned (${orphanedPersonaIds.size})`,                                              value: 'orphaned', alert: orphanedPersonaIds.size > 0 },
    { label: `Hidden (${posts.filter(p => p.caption?.startsWith('DELETED')).length})`,              value: 'hidden', alert: posts.some(p => p.caption?.startsWith('DELETED')) },
    { label: `Lost Archives (${lostNodes.length || '?'})`,                                          value: 'lost', alert: true },
  ];


  return (
    <div className="min-h-screen bg-[#050505] text-white font-outfit pb-24 overflow-x-hidden">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <NextLink href="/admin" className="w-9 h-9 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
              <ShieldAlert size={16} />
            </NextLink>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-syncopate font-black italic uppercase tracking-tighter">Post Studio</h1>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">
                 {filterMode === 'lost' ? `${lostNodes.length} abandoned assets` : `${filtered.length} of ${posts.length} nodes`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar py-1">
            <div className="relative shrink-0">
              <select
                value={personaFilter}
                onChange={e => { setPersonaFilter(e.target.value); if (filterMode === 'lost') setFilterMode('all'); }}
                className="appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 pr-7 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white/60 outline-none cursor-pointer min-w-[120px]"
              >
                <option value="all">Fleet</option>
                {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#00f0ff]/50 transition-all flex-1 min-w-[140px]">
              <Search size={12} className="text-white/20 shrink-0" />
              <input
                type="text"
                placeholder="Query..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none text-[10px] sm:text-[11px] font-black uppercase tracking-widest placeholder:text-white/10 w-full"
              />
            </div>

            <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="w-10 h-10 shrink-0 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-xl flex items-center justify-center text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black transition-all shadow-[0_0_20px_#00f0ff22]"
                title="Create New Node"
            >
               <UserPlus size={16} />
            </button>

            <button
              onClick={async () => {
                const source = prompt('Source ID:'); if (!source) return;
                const target = prompt(`Target ID (absorbs ${source}):`); if (!target) return;
                if (!confirm(`Merge ${source} → ${target}?`)) return;
                setLoading(true);
                const res = await callAudit('merge-persona', { sourceId: source, targetId: target });
                if (res.success) fetchPosts();
                setLoading(false);
              }}
              className="w-10 h-10 shrink-0 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-all"
            >
              <ArrowLeftRight size={13} />
            </button>

            <button onClick={() => { fetchPosts(); if (filterMode === 'lost') fetchLostNodes(); }} className="w-10 h-10 shrink-0 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
              <RefreshCw size={13} className={loading || loadingLost ? 'animate-spin text-[#00f0ff]' : 'text-white/40'} />
            </button>
            <button 
              onClick={() => { if (selectionMode) cancelSelection(); else selectAll(); }} 
              className={`px-4 h-10 shrink-0 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectionMode ? 'bg-[#ff00ff]/20 border-[#ff00ff]/40 text-[#ff00ff]' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
            >
              {selectionMode ? `Done` : `Batch`}
            </button>
          </div>

        </div>

        {/* Filter tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {filterTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => {
                 setFilterMode(tab.value);
                 if (tab.value === 'lost') fetchLostNodes();
              }}
              className={`relative px-3 sm:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                filterMode === tab.value
                  ? tab.alert ? tab.value === 'lost' ? 'bg-[#ff00ff]/20 border border-[#ff00ff]/40 text-[#ff00ff]' : 'bg-orange-500/20 border border-orange-500/40 text-orange-400' : 'bg-white/10 border border-white/20 text-white'
                  : tab.alert ? tab.value === 'lost' ? 'text-[#ff00ff]/60 hover:text-[#ff00ff]' : 'text-orange-400/60 hover:text-orange-400' : 'text-white/20 hover:text-white/60'
              }`}
            >
              {tab.alert && <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse ${tab.value === 'lost' ? 'bg-[#ff00ff]' : 'bg-orange-500'}`} />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {loading ? (
          <div className="py-40 flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-[#00f0ff]/20 border-t-[#00f0ff] rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#00f0ff] animate-pulse">Loading Nodes...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-40 flex flex-col items-center gap-4 text-white/20">
            <ImageIcon size={48} />
            <p className="text-[11px] font-black uppercase tracking-widest">No posts match this filter</p>
          </div>
        ) : (
          <>
            {/* Orphaned mode banner */}
            {filterMode === 'orphaned' && orphanedPersonaIds.size > 0 && (
              <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                <span className="text-orange-400 text-lg mt-0.5">⚠️</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">{orphanedPersonaIds.size} persona{orphanedPersonaIds.size > 1 ? 's' : ''} invisible to feed</p>
                  <p className="text-[9px] text-white/30 mt-0.5">These personas only have vault posts — click <strong className="text-white/50">→ Feed</strong> on any card to make it their hero image.</p>
                </div>
              </div>
            )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            <AnimatePresence mode="popLayout">
              {filterMode === 'lost' ? (
                lostNodes.map(node => (
                   <motion.div
                    layout
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative bg-[#ff00ff]/5 border border-[#ff00ff]/20 rounded-2xl overflow-hidden active:scale-95 transition-all"
                  >
                    <div className="relative aspect-[3/4] bg-black">
                      <img src={node.url} alt="" className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3 p-4">
                        <button 
                          onClick={() => {
                             setLinkTargetNode(node);
                             setLinkPersonaId(node.suggestedPersona || '');
                          }}
                          className="w-full h-11 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                           <Link2 size={12} /> Link to Node
                        </button>
                        <button 
                          onClick={() => {
                             setShowSoloModal({ id: 'temp', content_url: node.url, persona_id: '' } as any);
                          }}
                          className="w-full h-11 bg-[#ff00ff] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                           <Sparkles size={12} /> Neural Birth
                        </button>
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-[7px] font-black uppercase rounded-full animate-pulse">Abandoned</div>
                    </div>
                    <div className="p-2 space-y-1">
                       <p className="text-[8px] font-black text-white/40 uppercase tracking-widest truncate">{node.filename}</p>
                       <p className="text-[7px] text-[#ff00ff] font-bold uppercase italic">Match: {node.suggestedPersona}</p>
                    </div>
                  </motion.div>
                ))
              ) : filtered.map((post, idx) => {
                const isSelected = selectedIds.has(post.id);
                const showName = post.personas?.name || getProfileName({ id: post.persona_id });
                const showAge = post.personas?.age;
                const showCity = post.personas?.city || '';

                return (
                  <motion.div
                    layout
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: syncing === post.id ? 0.4 : 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`group relative bg-white/[0.02] border rounded-2xl overflow-hidden transition-all ${isSelected ? 'border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.1)]' : 'border-white/10 hover:border-white/30'}`}
                  >
                      {/* Media wrapper */}
                      <div className="relative aspect-[3/4] bg-black overflow-hidden">
                        {/* Media — detect by content_type OR url extension */}
                        {(() => {
                          const isVid = post.content_type === 'video' || /\.mp4|\.mov|\.webm/i.test(post.content_url || '');
                          return isVid ? (
                            <>
                              <video
                                src={post.content_url}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                autoPlay muted loop playsInline
                              />
                              <div className="absolute top-1 right-1 px-1 py-0.5 bg-black/60 rounded text-[6px] font-black text-white uppercase tracking-widest z-10">▶ Vid</div>
                            </>
                          ) : (
                            <img
                              src={proxyImg(post.content_url)}
                              alt="Asset"
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                              loading="lazy"
                            />
                          );
                        })()}

                        {/* Status badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                          {post.is_freebie && <span className="px-2 py-0.5 bg-[#ff00ff] text-white text-[7px] sm:text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1"><Gift size={8} /> Gift</span>}
                          {!post.is_freebie && post.is_vault && <span className="px-2 py-0.5 bg-[#ff00ff] text-white text-[7px] sm:text-[8px] font-black uppercase tracking-widest rounded-full">Vault</span>}
                          {post.is_burner  && <span className="px-2 py-0.5 bg-[#ffea00] text-black text-[7px] sm:text-[8px] font-black uppercase tracking-widest rounded-full">Hero</span>}
                        </div>

                        {/* Selection checkmark */}
                        {(selectionMode || isSelected) && (
                          <div className={`absolute top-2 right-2 z-30 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-lg transition-all ${isSelected ? 'bg-[#00f0ff] border-[#00f0ff] text-black scale-110' : 'bg-black/40 border-white/40 text-transparent'}`}>
                             <Check size={14} strokeWidth={4} />
                          </div>
                        )}

                        {/* Saved flash */}
                        {savedFlash === post.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
                            <div className="flex items-center gap-2 text-[#00f0ff]">
                              <Check size={20} /><span className="text-[10px] font-black uppercase tracking-widest">Saved</span>
                            </div>
                          </div>
                        )}

                        <div 
                          onPointerDown={(e) => {
                             // NEURAL LONG-PRESS: Mobile friendly, clears on scroll/move
                             const id = post.id;
                             const timer = setTimeout(() => toggleSelection(id), 500);
                             (e.target as any)._lp = timer;
                             (e.target as any)._startPos = { x: e.clientX, y: e.clientY };
                          }}
                          onPointerMove={(e) => {
                             const start = (e.target as any)._startPos;
                             if (start) {
                               const dist = Math.sqrt(Math.pow(e.clientX - start.x, 2) + Math.pow(e.clientY - start.y, 2));
                               if (dist > 3) clearTimeout((e.target as any)._lp); // Clear if user is scrolling
                             }
                          }}
                          onPointerUp={(e) => clearTimeout((e.target as any)._lp)}
                          onClick={(e) => { 
                            if (selectionMode) { toggleSelection(post.id); return; }
                            setExpandedId(expandedId === post.id ? null : post.id);
                          }}
                          className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-all flex flex-col items-center justify-center gap-3 z-20 px-4 ${
                            selectionMode || expandedId === post.id
                              ? 'opacity-100 pointer-events-auto cursor-pointer' 
                              : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto'
                          }`}
                        >
                          {selectionMode ? (
                             <div className="text-center">
                               <p className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff]">{isSelected ? 'Deselect Node' : 'Select Node'}</p>
                             </div>
                          ) : (
                            <>
                              <button 
                                onClick={(e) => { e.stopPropagation(); openEdit(post); }}
                                className="w-full h-12 bg-white text-black rounded-full flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest mb-1"
                              >
                                <Pencil size={14} className="mb-0.5" />
                                EDIT
                              </button>

                              <div className="grid grid-cols-4 gap-2 w-full">
                                <button onClick={(e) => { e.stopPropagation(); toggleVault(post); }} title={post.is_vault ? 'Move to Feed' : 'Move to Vault'}
                                  className={`h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 ${post.is_vault ? 'bg-[#ffea00] text-black' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                                  <Lock size={16} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); toggleHero(post); }} title="Set as Hero"
                                  className={`h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 ${post.is_burner ? 'bg-[#ffea00] text-black shadow-[0_0_15px_#ffea0044]' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                                  <Star size={16} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); toggleFreebie(post); }} title={post.is_freebie ? 'Remove Freebie' : 'Mark as Gift'}
                                  className={`h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 ${post.is_freebie ? 'bg-[#ff00ff] text-white shadow-[0_0_15px_#ff00ff44]' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                                  <Gift size={16} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setShowSoloModal(post); }} title="Go Solo: Create New Persona"
                                  className="h-11 rounded-xl bg-white/10 text-white/40 hover:bg-[#00f0ff] hover:text-black flex items-center justify-center transition-all active:scale-95">
                                  <Sparkles size={16} />
                                </button>

                                <button onClick={(e) => { e.stopPropagation(); markDuplicate(post.id); }} title="Hide Duplicate"
                                  className="h-11 rounded-xl bg-white/10 text-white/50 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-all active:scale-95">
                                  <Copy size={16} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); softHide(post.id); }} title="Hide from Feed"
                                  className="h-11 rounded-xl bg-white/10 text-white/50 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all active:scale-95">
                                  <EyeOff size={16} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); toggleGallery(post); }} title={post.is_gallery ? 'Remove from Gallery' : 'Move to Gallery'}
                                  className={`h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 ${post.is_gallery ? 'bg-[#00f0ff] text-black shadow-[0_0_15px_#00f0ff44]' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                                  <FolderHeart size={16} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); hardDelete(post.id); }} title="Permanent Delete"
                                  className="h-11 rounded-xl bg-white/10 text-white/50 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all active:scale-95">
                                  <Trash2 size={16} />
                                </button>

                                <button onClick={(e) => { e.stopPropagation(); setIdentityTarget({ id: post.persona_id, name: showName }); }} title={identityTarget?.id === post.persona_id ? 'Active Target' : 'Set as Pulse Target'}
                                  className={`h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 ${identityTarget?.id === post.persona_id ? 'bg-[#00f0ff] text-black shadow-[0_0_15px_#00f0ff44]' : 'bg-white/5 text-white/40 hover:bg-white/20'}`}>
                                  <UserCheck size={16} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                    {/* Card footer */}
                    <div className="p-2 sm:p-3 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#00f0ff] truncate">{showName}</span>
                        {(showAge || showCity) && (
                          <span className="text-[7px] sm:text-[8px] text-white/20 font-mono shrink-0">{showAge}{showCity ? ` · ${showCity}` : ''}</span>
                        )}
                      </div>
                      <p className="text-[8px] sm:text-[9px] text-white/30 line-clamp-2 leading-relaxed">{post.caption || '—'}</p>
                      <span className="text-[7px] sm:text-[8px] text-white/10 font-mono block">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          </>
        )}
      </div>

      {/* ── Bulk Console (Floating Action Bar) ── */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-[1000] flex items-center justify-center pointer-events-none"
          >
             <div className="bg-[#0e0e0e]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-3 sm:p-4 flex items-center gap-2 sm:gap-4 pointer-events-auto shadow-[0_20px_100px_rgba(0,0,0,1)]">
                <div className="px-4 border-r border-white/10 hidden sm:flex flex-col">
                   <span className="text-[10px] font-black text-[#00f0ff] uppercase">{selectedIds.size} NODES</span>
                   <span className="text-[8px] font-black text-white/20 uppercase">LINK LOCKED</span>
                </div>
                
                <div className="flex items-center gap-2">
                   <button 
                     onClick={async () => {
                       const ids = Array.from(selectedIds);
                       if (!confirm(`Vault ${ids.length} nodes?`)) return;
                       setLoading(true);
                       for (const id of ids) await callAudit('update-post', { id, is_vault: true, is_freebie: false });
                       setPosts(prev => prev.map(p => ids.includes(p.id) ? { ...p, is_vault: true, is_freebie: false } : p));
                       cancelSelection();
                       setLoading(false);
                     }}
                     className="h-14 sm:h-12 px-6 sm:px-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-white/60 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest active:scale-90"
                   >
                      <Lock size={16} /> <span className="hidden sm:inline">Vault</span>
                   </button>
                   <button 
                     onClick={async () => {
                       const ids = Array.from(selectedIds);
                       if (!confirm(`Release ${ids.length} to Feed?`)) return;
                       setLoading(true);
                       for (const id of ids) await callAudit('update-post', { id, is_freebie: false, is_vault: false });
                       setPosts(prev => prev.map(p => ids.includes(p.id) ? { ...p, is_freebie: false, is_vault: false } : p));
                       cancelSelection();
                       setLoading(false);
                     }}
                     className="h-14 sm:h-12 px-6 sm:px-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-white/60 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest active:scale-90"
                   >
                      <Unlock size={16} /> <span className="hidden sm:inline">Feed</span>
                   </button>
                   <button 
                     onClick={bulkHardDelete}
                     className="h-14 sm:h-12 px-6 sm:px-4 bg-red-600/20 border border-red-600/40 rounded-2xl flex items-center justify-center gap-2 text-red-500 hover:bg-red-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest active:scale-90 shadow-[0_0_20px_#dc262622]"
                   >
                      <Trash2 size={16} /> <span className="hidden sm:inline">Purge</span>
                   </button>
                </div>

                <div className="pl-2 border-l border-white/10">
                   <button onClick={cancelSelection} className="w-14 sm:w-12 h-14 sm:h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/20 hover:text-white transition-all active:scale-90" title="Cancel">
                      <X size={20} />
                   </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Active Target Pulse Bar ── */}
      <AnimatePresence>
        {identityTarget && !selectionMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm px-4"
          >
             <div className="bg-black/90 backdrop-blur-2xl border border-[#00f0ff]/40 rounded-[2rem] p-3 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                <div className="flex items-center gap-3 pl-2">
                   <div className="w-8 h-8 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff]">
                      <UserCheck size={16} />
                   </div>
                   <div className="flex flex-col">
                      <p className="text-[9px] font-black uppercase text-[#00f0ff] tracking-widest leading-none">Identity Buffer</p>
                      <p className="text-[8px] font-bold text-white/40 tracking-wider mt-1">{identityTarget.name.toUpperCase()}</p>
                   </div>
                </div>
                <div className="flex items-center gap-1 pr-1">
                   <div className="text-[7px] text-white/20 font-black uppercase pr-2 italic">Click icons to move/merge</div>
                   <button onClick={() => setIdentityTarget(null)} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
                      <X size={14} />
                   </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full Edit Modal ── */}

      <AnimatePresence>
        {editPost && draft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex items-start justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={closeEdit}
          >
            <div className="fixed inset-0 z-[2000] bg-black/95 sm:bg-black/80 backdrop-blur-3xl overflow-y-auto no-scrollbar py-6 sm:py-12 md:py-20 px-3 sm:px-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className="w-full max-w-4xl mx-auto bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,1)] relative overflow-hidden"
              >
                {/* Header / Top Bar */}
                <div className="p-5 sm:p-8 border-b border-white/5 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#ffea00] shrink-0">
                      <Pencil size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-syncopate font-black uppercase italic text-white leading-none">Edit Node</h3>
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-2">Administrative Interface</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                      onClick={saveAll}
                      disabled={saving}
                      className="flex-1 sm:flex-none h-12 px-8 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00f0ff] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save & Close'}
                    </button>
                    <button onClick={closeEdit} className="w-12 h-12 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-all border border-white/5">
                       <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                  {/* Preview */}
                  <div className="relative aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden border border-white/5">
                    <img src={proxyImg(draft.content_url || editPost.content_url)} alt="" className="w-full h-full object-cover opacity-70" />
                     <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex gap-2">
                      {draft.is_freebie && <span className="px-2 py-0.5 bg-[#ff00ff] text-white text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1"><Gift size={8} /> Gift</span>}
                      {!draft.is_freebie && draft.is_vault  && <span className="px-2 py-0.5 bg-[#ff00ff] text-white text-[8px] font-black uppercase tracking-widest rounded-full">Vault</span>}
                      {draft.is_gallery && <span className="px-2 py-0.5 bg-[#00f0ff] text-black text-[8px] font-black uppercase tracking-widest rounded-full">Gallery</span>}
                      {draft.is_burner && <span className="px-2 py-0.5 bg-[#ffea00] text-black text-[8px] font-black uppercase tracking-widest rounded-full">Hero</span>}
                    </div>
                  </div>


                  {/* ── DB Fields ── */}
                  <div className="space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-2">
                      <span className="w-4 h-px bg-white/20" /> Database Fields <span className="flex-1 h-px bg-white/10" />
                    </p>

                    <label className="block space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Caption</span>
                      <textarea
                        value={draft.caption}
                        onChange={e => setDraft(d => d ? { ...d, caption: e.target.value } : d)}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm text-white focus:border-[#00f0ff]/50 outline-none resize-none leading-relaxed transition-all"
                        placeholder="Post caption..."
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5"><Link2 size={10} />Content URL</span>
                      <input
                        type="text"
                        value={draft.content_url}
                        onChange={e => setDraft(d => d ? { ...d, content_url: e.target.value } : d)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-3 text-xs font-mono text-white/70 focus:border-[#00f0ff]/50 outline-none transition-all"
                        placeholder="https://asset.gasp.fun/..."
                      />
                    </label>

                    {/* Vault / Hero / Gift / Gallery toggles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                      <button
                        onClick={() => setDraft(d => d ? { ...d, is_vault: !d.is_vault, is_freebie: !d.is_vault ? false : d.is_freebie, is_gallery: !d.is_vault ? false : d.is_gallery } : d)}
                        className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 ${draft.is_vault ? 'bg-[#ff00ff]/20 border border-[#ff00ff]/40 text-[#ff00ff]' : 'bg-white/5 border border-white/10 text-white/40'}`}
                      >
                        <Lock size={13} /> {draft.is_vault ? 'Vault ✓' : 'Set Vault'}
                      </button>
                      <button
                        onClick={() => setDraft(d => d ? { ...d, is_burner: !d.is_burner } : d)}
                        className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 ${draft.is_burner ? 'bg-[#ffea00]/20 border border-[#ffea00]/40 text-[#ffea00]' : 'bg-white/5 border border-white/10 text-white/40'}`}
                      >
                        <Star size={13} /> {draft.is_burner ? 'Hero ✓' : 'Set Hero'}
                      </button>
                      <button
                        onClick={() => setDraft(d => d ? { ...d, is_freebie: !d.is_freebie, is_vault: !d.is_freebie ? false : d.is_vault } : d)}
                        className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 ${draft.is_freebie ? 'bg-[#ff00ff]/20 border border-[#ff00ff]/40 text-[#ff00ff]' : 'bg-white/5 border border-white/10 text-white/40'}`}
                      >
                        <Gift size={13} /> {draft.is_freebie ? 'Gift ✓' : 'Set Gift'}
                      </button>
                      <button
                        onClick={() => setDraft(d => d ? { ...d, is_gallery: !d.is_gallery, is_vault: !d.is_gallery ? false : d.is_vault } : d)}
                        className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 ${draft.is_gallery ? 'bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff]' : 'bg-white/5 border border-white/10 text-white/40'}`}
                      >
                        <FolderHeart size={13} /> {draft.is_gallery ? 'Gallery ✓' : 'Set Gallery'}
                      </button>
                    </div>

                    <p className="text-[9px] text-white/20 leading-relaxed">
                      ⭐ Hero tag is <strong className="text-white/40">additive</strong>. Vault and Gallery are <strong className="text-white/40">exclusive</strong> — they remove posts from the global feed.
                    </p>
                  </div>

                  {/* ── Identity Fields (DB + Chat + Story sync) ── */}
                  <div className="space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#00f0ff]/60 flex items-center gap-2">
                      <span className="w-4 h-px bg-[#00f0ff]/20" /> Identity Fields
                      <span className="text-white/20 normal-case tracking-normal font-normal">→ syncs to chat · story · feed</span>
                      <span className="flex-1 h-px bg-[#00f0ff]/10" />
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <label className="block space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5"><User size={10} />Name</span>
                        <input
                          type="text"
                          value={draft.name}
                          onChange={e => setDraft(d => d ? { ...d, name: e.target.value } : d)}
                          placeholder={editPost.personas?.name || 'Persona name'}
                          className="w-full bg-[#00f0ff]/5 border border-[#00f0ff]/10 rounded-xl px-3 sm:px-4 py-3 text-sm text-white focus:border-[#00f0ff]/50 outline-none transition-all"
                        />
                        <p className="text-[8px] text-white/20">DB: {editPost.personas?.name || '—'}</p>
                      </label>

                      <label className="block space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5"><Hash size={10} />Age</span>
                        <input
                          type="text"
                          value={draft.age}
                          onChange={e => setDraft(d => d ? { ...d, age: e.target.value } : d)}
                          placeholder={String(editPost.personas?.age || '22')}
                          className="w-full bg-[#00f0ff]/5 border border-[#00f0ff]/10 rounded-xl px-3 sm:px-4 py-3 text-sm text-white focus:border-[#00f0ff]/50 outline-none transition-all"
                        />
                        <p className="text-[8px] text-white/20">DB: {editPost.personas?.age || '—'}</p>
                      </label>

                      <label className="block space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5"><MapPin size={10} />City</span>
                        <input
                          type="text"
                          value={draft.city}
                          onChange={e => setDraft(d => d ? { ...d, city: e.target.value } : d)}
                          placeholder={editPost.personas?.city || 'City'}
                          className="w-full bg-[#00f0ff]/5 border border-[#00f0ff]/10 rounded-xl px-3 sm:px-4 py-3 text-sm text-white focus:border-[#00f0ff]/50 outline-none transition-all"
                        />
                        <p className="text-[8px] text-white/20">DB: {editPost.personas?.city || '—'}</p>
                      </label>
                    </div>

                    <p className="text-[9px] text-[#00f0ff]/40 bg-[#00f0ff]/5 border border-[#00f0ff]/10 rounded-xl px-3 sm:px-4 py-3 leading-relaxed">
                      ⚡ Changes write to the <strong>personas table</strong> — the persona knows their new name in chat, story shows it, feed reflects it. Leave blank to keep existing DB value.
                    </p>
                  </div>

                  {/* ──────────────── Linked Posts ──────────────── */}
                  <div className="space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#ff00ff]/60 flex items-center gap-2">
                      <span className="w-4 h-px bg-[#ff00ff]/20" />
                      <Package size={10} className="text-[#ff00ff]/60" />
                      Linked Posts
                      <span className="text-white/20 normal-case tracking-normal font-normal">
                        ({editPost.personas?.name || editPost.persona_id}&apos;s other posts)
                      </span>
                      <span className="flex-1 h-px bg-[#ff00ff]/10" />
                      <NextLink
                        href={`/admin/posts?persona=${editPost.persona_id}`}
                        className="text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-white flex items-center gap-1"
                        onClick={closeEdit}
                      >
                        <ExternalLink size={9} /> View All
                      </NextLink>
                    </p>

                    {loadingLinked ? (
                      <div className="flex items-center gap-3 py-4 text-white/20">
                        <RefreshCw size={14} className="animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Loading linked posts...</span>
                      </div>
                    ) : linkedPosts.length === 0 ? (
                      <p className="text-[10px] text-white/20 py-4">No other posts from this persona.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
                        {linkedPosts.map(lp => (
                          <div key={lp.id} className="group relative bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all">
                            <div className="relative aspect-[3/4] bg-black">
                               {/* Media Layer */}
                               {(() => {
                                 const isVid = /\.mp4|\.mov|\.webm/i.test(lp.content_url || '');
                                 return isVid ? (
                                   <>
                                     <video src={lp.content_url} className="w-full h-full object-cover opacity-70" autoPlay muted loop playsInline />
                                     <div className="absolute top-1 right-1 px-1 py-0.5 bg-black/60 rounded text-[6px] font-black text-white uppercase tracking-widest">▶ Vid</div>
                                   </>
                                 ) : (
                                   <img src={proxyImg(lp.content_url)} alt="" className="w-full h-full object-cover opacity-70" loading="lazy" />
                                 );
                               })()}
                               
                               {/* Status Badges */}
                               <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                                 {lp.is_vault && <span className="px-1.5 py-0.5 bg-[#ff00ff] text-white text-[6px] font-black uppercase rounded-full">V</span>}
                                 {lp.is_burner && <span className="px-1.5 py-0.5 bg-[#ffea00] text-black text-[6px] font-black uppercase rounded-full">H</span>}
                               </div>

                               {/* Hover Actions */}
                               <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 z-20">
                                 <div className="flex gap-1.5">
                                   <button onClick={(e) => { e.stopPropagation(); toggleLinkedVault(lp); }} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${lp.is_vault ? 'bg-[#ff00ff] text-white' : 'bg-white/10 text-white/40 hover:text-white'}`}><Lock size={12} /></button>
                                   <button onClick={(e) => { e.stopPropagation(); toggleLinkedHero(lp); }} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${lp.is_burner ? 'bg-[#ffea00] text-black' : 'bg-white/10 text-white/40 hover:text-white'}`}><Star size={12} /></button>
                                   <button onClick={(e) => { e.stopPropagation(); deleteLinkedPost(lp); }} className="w-8 h-8 rounded-full bg-white/10 text-white/40 hover:bg-red-500/50 hover:text-white flex items-center justify-center transition-all"><Trash2 size={12} /></button>
                                 </div>
                                 <button onClick={(e) => { e.stopPropagation(); closeEdit(); openEdit(lp); }} className="px-2.5 py-1 bg-white/10 rounded-full text-white text-[8px] font-black uppercase hover:bg-white/20 flex items-center gap-1"><ArrowLeftRight size={10} /> Edit</button>
                               </div>
                            </div>
                            <div className="p-2 border-t border-white/5 bg-black/40">
                              <p className="text-[7px] text-white/30 truncate uppercase tracking-widest font-black leading-none">{lp.caption || 'NO CAPTION'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile-friendly Footer */}
                <div className="p-5 sm:p-8 border-t border-white/5 bg-black/40 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={saveAll}
                    disabled={saving}
                    className="flex-1 py-4 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00f0ff] active:scale-95 transition-all shadow-xl disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save & Close'}
                  </button>
                  <button
                    onClick={closeEdit}
                    className="flex-1 sm:flex-none px-10 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>

              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create Node Modal (V4.18) ── */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4"
            onClick={() => setIsCreateModalOpen(false)}
          >
             <motion.div
               initial={{ scale: 0.9, y: 30 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 30 }}
               className="w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-[0_30px_100px_rgba(0,0,0,1)]"
               onClick={e => e.stopPropagation()}
             >
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                      <UserPlus size={32} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-syncopate font-black italic uppercase tracking-tighter text-white">Create Node</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Manual Fleet Injection</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Asset URL (R2/CDN)</label>
                       <input 
                         type="text" 
                         value={createDraft.content_url} 
                         onChange={e => setCreateDraft(d => ({ ...d, content_url: e.target.value }))}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-mono text-white/60 outline-none focus:border-white/30 transition-all"
                         placeholder="https://asset.gasp.fun/..."
                         autoFocus
                       />
                   </div>
                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Target Persona ID</label>
                       <div className="relative">
                          <select 
                            value={createDraft.persona_id}
                            onChange={e => setCreateDraft(d => ({ ...d, persona_id: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-black uppercase tracking-widest text-white outline-none appearance-none"
                          >
                             <option value="">Select Persona</option>
                             {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                       </div>
                   </div>
                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Initial Caption</label>
                       <textarea 
                         value={createDraft.caption} 
                         onChange={e => setCreateDraft(d => ({ ...d, caption: e.target.value }))}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-white/30 transition-all h-24"
                         placeholder="What's she doing?"
                       />
                   </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                   <button 
                     onClick={async () => {
                        if (!createDraft.content_url || !createDraft.persona_id) return alert('Missing fields.');
                        setSaving(true);
                        const res = await callAudit('create-post', createDraft);
                        if (res.success) {
                           setIsCreateModalOpen(false);
                           setCreateDraft({ content_url: '', persona_id: '', caption: '', is_vault: true });
                           fetchPosts();
                        }
                        setSaving(false);
                     }}
                     disabled={saving || !createDraft.content_url}
                     className="w-full h-16 bg-white text-black rounded-3xl font-syncopate font-black italic uppercase hover:bg-[#00f0ff] transition-all shadow-2xl disabled:opacity-50"
                   >
                     {saving ? 'Transmitting...' : 'Inject Node'}
                   </button>
                   <button onClick={() => setIsCreateModalOpen(false)} className="w-full text-[10px] font-black uppercase text-white/20 hover:text-white transition-colors">Abort Ingress</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Link Lost Node Modal (V4.18) ── */}
      <AnimatePresence>
        {linkTargetNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4"
            onClick={() => setLinkTargetNode(null)}
          >
             <motion.div
               initial={{ scale: 0.9, y: 30 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 30 }}
               className="w-full max-w-lg bg-[#111] border border-[#ff00ff]/20 rounded-[2.5rem] p-8 space-y-8 shadow-[0_40px_100px_rgba(0,0,0,1)]"
               onClick={e => e.stopPropagation()}
             >
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-[#ff00ff]/10 border border-[#ff00ff]/20 flex items-center justify-center text-[#ff00ff]">
                      <Link2 size={28} />
                   </div>
                   <div>
                      <h3 className="text-xl font-syncopate font-black italic uppercase tracking-tighter text-white">Neural Restoration</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#ff00ff]">Resurrecting orphaned archival media</p>
                   </div>
                </div>

                <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(255,0,255,0.1)]">
                   <img src={linkTargetNode.url} alt="" className="w-full h-full object-cover opacity-60" />
                   <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <p className="text-[10px] font-bold text-white uppercase tracking-[0.4em] italic">{linkTargetNode.filename}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Target Identity (Persona ID)</label>
                       <div className="relative">
                          <select 
                            value={linkPersonaId}
                            onChange={e => setLinkPersonaId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-black uppercase tracking-widest text-white outline-none appearance-none"
                          >
                             <option value="">Select Target Persona</option>
                             {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                       </div>
                   </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                   <button 
                     onClick={async () => {
                        if (!linkPersonaId) return alert('Select Persona.');
                        setSaving(true);
                        const res = await callAudit('create-post', { persona_id: linkPersonaId, content_url: linkTargetNode.url, caption: '', is_vault: true });
                        if (res.success) {
                           setLostNodes(prev => prev.filter(n => n.id !== linkTargetNode.id));
                           setLinkTargetNode(null);
                           setLinkPersonaId('');
                        }
                        setSaving(false);
                     }}
                     disabled={saving || !linkPersonaId}
                     className="w-full h-16 bg-[#ff00ff] text-white rounded-3xl font-syncopate font-black italic uppercase hover:bg-white hover:text-black transition-all shadow-2xl shadow-[#ff00ff]/20"
                   >
                     {saving ? <RefreshCw className="animate-spin" /> : 'Re-establish Neural Link'}
                   </button>
                   <button onClick={() => setLinkTargetNode(null)} className="w-full text-[10px] font-black uppercase text-white/20 hover:text-white transition-colors">Abort Resonance</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
