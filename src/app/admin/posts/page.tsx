'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil, Trash2, Star, Lock, Search,
  RefreshCw, EyeOff, Check, X,
  ChevronDown, Image as ImageIcon, ShieldAlert, User, MapPin, Hash, Link2
} from 'lucide-react';
import { proxyImg } from '@/lib/profiles';
import { createClient } from '@supabase/supabase-js';
import { getAlias, setAlias, clearAlias, type PostAlias } from '@/lib/postAliases';
import NextLink from 'next/link';

export const dynamic = 'force-dynamic';

// ──────────────────────────────────────────────────
// Lazy Supabase: never called during SSR
// ──────────────────────────────────────────────────
let _client: ReturnType<typeof createClient> | null = null;
function getClient() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
  }
  return _client;
}

interface PersonaPost {
  id: string;
  persona_id: string;
  content_url: string;
  content_type: string;
  is_vault: boolean;
  is_burner: boolean;
  caption: string;
  created_at: string;
  personas?: { name: string; age?: number; city?: string };
}

type FilterMode = 'all' | 'vault' | 'hero' | 'feed';

// ── Edit state for the full modal ──
interface EditDraft {
  caption: string;
  content_url: string;
  is_vault: boolean;
  is_burner: boolean;
  // Aliases (per-post overrides, don't touch personas table)
  displayName: string;
  displayAge: string;
  displayCity: string;
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
  // Full edit modal
  const [editPost, setEditPost]     = useState<PersonaPost | null>(null);
  const [draft, setDraft]           = useState<EditDraft | null>(null);
  const [saving, setSaving]         = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await getClient()
      .from('posts')
      .select('*, personas(name, age, city)')
      .order('created_at', { ascending: false });
    if (data) setPosts(data as PersonaPost[]);
    setLoading(false);
  }, []);

  const fetchPersonas = useCallback(async () => {
    const { data } = await getClient()
      .from('personas')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (data) setPersonas(data);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchPosts();
    fetchPersonas();
  }, [mounted, fetchPosts, fetchPersonas]);

  if (!mounted) return null;

  // ── Helpers ────────────────────────────────────
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

  // Quick toggles from card overlay
  const toggleVault = async (post: PersonaPost) => {
    setSyncing(post.id);
    const next = !post.is_vault;
    const data = await callAudit('update-post', { id: post.id, is_vault: next, is_featured: next ? false : undefined });
    if (data.success) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_vault: next, is_burner: next ? false : p.is_burner } : p));
      flash(post.id);
    }
    setSyncing(null);
  };

  const toggleHero = async (post: PersonaPost) => {
    setSyncing(post.id);
    const next = !post.is_burner;
    const data = await callAudit('update-post', { id: post.id, is_featured: next, is_vault: next ? false : undefined });
    if (data.success) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_burner: next, is_vault: next ? false : p.is_vault } : p));
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

  const hardDelete = async (postId: string) => {
    if (!confirm('⚠️ PERMANENT DELETE — remove this post from the database entirely?')) return;
    setSyncing(postId);
    const data = await callAudit('delete-post-hard', { id: postId });
    if (data.success) setPosts(prev => prev.filter(p => p.id !== postId));
    setSyncing(null);
  };

  // ── Full Edit Modal ─────────────────────────────
  const openEdit = (post: PersonaPost) => {
    const alias = getAlias(post.id);
    setEditPost(post);
    setDraft({
      caption:     post.caption || '',
      content_url: post.content_url || '',
      is_vault:    post.is_vault,
      is_burner:   post.is_burner,
      displayName: alias.displayName || post.personas?.name || '',
      displayAge:  alias.displayAge  || String(post.personas?.age  || ''),
      displayCity: alias.displayCity || post.personas?.city || '',
    });
  };

  const saveAll = async () => {
    if (!editPost || !draft) return;
    setSaving(true);

    // 1. Save DB fields (caption, content_url, vault, hero)
    await callAudit('update-post', {
      id:          editPost.id,
      caption:     draft.caption,
      content_url: draft.content_url,
      is_vault:    draft.is_vault,
      is_featured: draft.is_burner,
    });

    // 2. Save display aliases (per-post overrides for name/age/city)
    const originalName = editPost.personas?.name || '';
    const originalAge  = String(editPost.personas?.age || '');
    const originalCity = editPost.personas?.city || '';

    const newAlias: PostAlias = {};
    if (draft.displayName && draft.displayName !== originalName) newAlias.displayName = draft.displayName;
    if (draft.displayAge  && draft.displayAge  !== originalAge)  newAlias.displayAge  = draft.displayAge;
    if (draft.displayCity && draft.displayCity !== originalCity) newAlias.displayCity = draft.displayCity;

    if (Object.keys(newAlias).length > 0) {
      setAlias(editPost.id, newAlias);
    } else {
      clearAlias(editPost.id);
    }

    // Update local state
    setPosts(prev => prev.map(p => p.id === editPost.id ? {
      ...p,
      caption:     draft.caption,
      content_url: draft.content_url,
      is_vault:    draft.is_vault,
      is_burner:   draft.is_burner,
    } : p));

    setSaving(false);
    flash(editPost.id);
    setEditPost(null);
    setDraft(null);
  };

  // ── Filtering ───────────────────────────────────
  const filtered = posts.filter(p => {
    const name = p.personas?.name || p.persona_id;
    const matchSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      (p.caption || '').toLowerCase().includes(search.toLowerCase());
    const matchPersona = personaFilter === 'all' || p.persona_id === personaFilter;
    const matchMode =
      filterMode === 'all'   ? true :
      filterMode === 'vault' ? p.is_vault :
      filterMode === 'hero'  ? p.is_burner :
      (!p.is_vault && !p.is_burner);
    return matchSearch && matchPersona && matchMode;
  });

  const filterTabs: { label: string; value: FilterMode }[] = [
    { label: `All (${posts.length})`, value: 'all' },
    { label: `Feed (${posts.filter(p => !p.is_vault && !p.is_burner).length})`, value: 'feed' },
    { label: `Vault (${posts.filter(p => p.is_vault).length})`, value: 'vault' },
    { label: `Hero (${posts.filter(p => p.is_burner).length})`, value: 'hero' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-outfit pb-24 overflow-x-hidden">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <NextLink href="/admin" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
              <ShieldAlert size={18} />
            </NextLink>
            <div>
              <h1 className="text-2xl font-syncopate font-black italic uppercase tracking-tighter">Post Studio</h1>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">{filtered.length} of {posts.length} nodes</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <select
                value={personaFilter}
                onChange={e => setPersonaFilter(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 pr-8 text-[11px] font-black uppercase tracking-widest text-white/60 outline-none cursor-pointer"
              >
                <option value="all">All Personas</option>
                {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus-within:border-[#00f0ff]/50 transition-all flex-1 min-w-[200px]">
              <Search size={14} className="text-white/20 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none text-[11px] font-black uppercase tracking-widest placeholder:text-white/10 w-full"
              />
            </div>

            <button onClick={fetchPosts} className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
              <RefreshCw size={14} className={loading ? 'animate-spin text-[#00f0ff]' : 'text-white/40'} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="max-w-7xl mx-auto px-6 pb-3 flex items-center gap-2">
          {filterTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilterMode(tab.value)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                filterMode === tab.value
                  ? 'bg-white/10 border border-white/20 text-white'
                  : 'text-white/20 hover:text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-7xl mx-auto p-6">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map(post => {
                const alias = getAlias(post.id);
                const showName = alias.displayName || post.personas?.name || post.persona_id;
                const showAge  = alias.displayAge  || String(post.personas?.age  || '');
                const showCity = alias.displayCity || post.personas?.city || '';
                const hasAlias = !!(alias.displayName || alias.displayAge || alias.displayCity);

                return (
                  <motion.div
                    layout
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: syncing === post.id ? 0.4 : 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:border-white/30 transition-all"
                  >
                    {/* Image */}
                    <div className="relative aspect-[3/4] bg-black">
                      <img
                        src={proxyImg(post.content_url)}
                        alt="Asset"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        loading="lazy"
                      />

                      {/* Status badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {post.is_vault && <span className="px-2 py-0.5 bg-[#ff00ff] text-white text-[8px] font-black uppercase tracking-widest rounded-full">Vault</span>}
                        {post.is_burner && <span className="px-2 py-0.5 bg-[#ffea00] text-black text-[8px] font-black uppercase tracking-widest rounded-full">Hero</span>}
                        {hasAlias && <span className="px-2 py-0.5 bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] text-[8px] font-black uppercase tracking-widest rounded-full">Alias</span>}
                      </div>

                      {/* Saved flash */}
                      {savedFlash === post.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
                          <div className="flex items-center gap-2 text-[#00f0ff]">
                            <Check size={20} /><span className="text-[10px] font-black uppercase tracking-widest">Saved</span>
                          </div>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3 pointer-events-none group-hover:pointer-events-auto z-10">
                        {/* Edit all fields */}
                        <button
                          onClick={() => openEdit(post)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#00f0ff] transition-all"
                        >
                          <Pencil size={14} /> Edit Post
                        </button>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleVault(post)} title="Toggle Vault" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${post.is_vault ? 'bg-[#ff00ff] text-white' : 'bg-white/10 text-white/50 hover:bg-[#ff00ff]/30'}`}>
                            <Lock size={16} />
                          </button>
                          <button onClick={() => toggleHero(post)} title="Toggle Hero" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${post.is_burner ? 'bg-[#ffea00] text-black' : 'bg-white/10 text-white/50 hover:bg-[#ffea00]/30'}`}>
                            <Star size={16} />
                          </button>
                          <button onClick={() => softHide(post.id)} title="Hide from Feed" className="w-10 h-10 rounded-full bg-white/10 text-white/50 hover:bg-orange-500/20 hover:text-orange-400 flex items-center justify-center transition-all">
                            <EyeOff size={16} />
                          </button>
                          <button onClick={() => hardDelete(post.id)} title="Permanent Delete" className="w-10 h-10 rounded-full bg-white/10 text-white/50 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#00f0ff] truncate">{showName}</span>
                        {(showAge || showCity) && (
                          <span className="text-[8px] text-white/20 font-mono">{showAge}{showCity ? ` · ${showCity}` : ''}</span>
                        )}
                      </div>
                      <p className="text-[9px] text-white/30 line-clamp-2 leading-relaxed">{post.caption || '—'}</p>
                      <span className="text-[8px] text-white/10 font-mono block">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Full Edit Modal ── */}
      <AnimatePresence>
        {editPost && draft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => { setEditPost(null); setDraft(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0e0e0e] border border-white/10 rounded-[2.5rem] w-full max-w-2xl my-8 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-syncopate font-black italic uppercase tracking-tighter">Edit Post</h2>
                  <p className="text-[9px] text-[#00f0ff] font-black uppercase tracking-widest mt-0.5">
                    {editPost.personas?.name || editPost.persona_id} · {new Date(editPost.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={() => { setEditPost(null); setDraft(null); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Preview */}
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/5">
                  <img src={proxyImg(draft.content_url || editPost.content_url)} alt="" className="w-full h-full object-cover opacity-70" />
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    {draft.is_vault && <span className="px-2 py-0.5 bg-[#ff00ff] text-white text-[8px] font-black uppercase tracking-widest rounded-full">Vault</span>}
                    {draft.is_burner && <span className="px-2 py-0.5 bg-[#ffea00] text-black text-[8px] font-black uppercase tracking-widest rounded-full">Hero</span>}
                  </div>
                </div>

                {/* ── DB Fields ── */}
                <div className="space-y-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-2">
                    <span className="w-4 h-px bg-white/20" /> Database Fields <span className="flex-1 h-px bg-white/10" />
                  </p>

                  {/* Caption */}
                  <label className="block space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Caption</span>
                    <textarea
                      value={draft.caption}
                      onChange={e => setDraft(d => d ? { ...d, caption: e.target.value } : d)}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-[#00f0ff]/50 outline-none resize-none leading-relaxed transition-all"
                      placeholder="Post caption..."
                    />
                  </label>

                  {/* Content URL */}
                  <label className="block space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5"><Link2 size={10} />Content URL</span>
                    <input
                      type="text"
                      value={draft.content_url}
                      onChange={e => setDraft(d => d ? { ...d, content_url: e.target.value } : d)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white/70 focus:border-[#00f0ff]/50 outline-none transition-all"
                      placeholder="https://asset.gasp.fun/..."
                    />
                  </label>

                  {/* Vault / Hero toggles */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setDraft(d => d ? { ...d, is_vault: !d.is_vault, is_burner: !d.is_vault ? false : d.is_burner } : d)}
                      className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${draft.is_vault ? 'bg-[#ff00ff]/20 border border-[#ff00ff]/40 text-[#ff00ff]' : 'bg-white/5 border border-white/10 text-white/40 hover:border-[#ff00ff]/30'}`}
                    >
                      <Lock size={14} /> {draft.is_vault ? 'Vault ✓' : 'Set Vault'}
                    </button>
                    <button
                      onClick={() => setDraft(d => d ? { ...d, is_burner: !d.is_burner, is_vault: !d.is_burner ? false : d.is_vault } : d)}
                      className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${draft.is_burner ? 'bg-[#ffea00]/20 border border-[#ffea00]/40 text-[#ffea00]' : 'bg-white/5 border border-white/10 text-white/40 hover:border-[#ffea00]/30'}`}
                    >
                      <Star size={14} /> {draft.is_burner ? 'Hero ✓' : 'Set Hero'}
                    </button>
                  </div>
                </div>

                {/* ── Alias Fields ── */}
                <div className="space-y-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#00f0ff]/60 flex items-center gap-2">
                    <span className="w-4 h-px bg-[#00f0ff]/20" /> Display Aliases <span className="text-white/20 normal-case tracking-normal font-normal">(per-post overrides, applied site-wide)</span> <span className="flex-1 h-px bg-[#00f0ff]/10" />
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Display Name */}
                    <label className="block space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5"><User size={10} />Display Name</span>
                      <input
                        type="text"
                        value={draft.displayName}
                        onChange={e => setDraft(d => d ? { ...d, displayName: e.target.value } : d)}
                        placeholder={editPost.personas?.name || 'Name override'}
                        className="w-full bg-[#00f0ff]/5 border border-[#00f0ff]/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#00f0ff]/50 outline-none transition-all"
                      />
                      <p className="text-[8px] text-white/20">DB: {editPost.personas?.name || '—'}</p>
                    </label>

                    {/* Display Age */}
                    <label className="block space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5"><Hash size={10} />Display Age</span>
                      <input
                        type="text"
                        value={draft.displayAge}
                        onChange={e => setDraft(d => d ? { ...d, displayAge: e.target.value } : d)}
                        placeholder={String(editPost.personas?.age || '22')}
                        className="w-full bg-[#00f0ff]/5 border border-[#00f0ff]/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#00f0ff]/50 outline-none transition-all"
                      />
                      <p className="text-[8px] text-white/20">DB: {editPost.personas?.age || '—'}</p>
                    </label>

                    {/* Display City */}
                    <label className="block space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5"><MapPin size={10} />Display City</span>
                      <input
                        type="text"
                        value={draft.displayCity}
                        onChange={e => setDraft(d => d ? { ...d, displayCity: e.target.value } : d)}
                        placeholder={editPost.personas?.city || 'City override'}
                        className="w-full bg-[#00f0ff]/5 border border-[#00f0ff]/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#00f0ff]/50 outline-none transition-all"
                      />
                      <p className="text-[8px] text-white/20">DB: {editPost.personas?.city || '—'}</p>
                    </label>
                  </div>

                  <p className="text-[9px] text-[#00f0ff]/40 bg-[#00f0ff]/5 border border-[#00f0ff]/10 rounded-xl px-4 py-3 leading-relaxed">
                    ⚡ Aliases override what&apos;s shown <strong>on this post only</strong>. The personas table is not touched. Leave blank to use the DB value.
                  </p>
                </div>

                {/* Save */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={saveAll}
                    disabled={saving}
                    className="flex-1 py-5 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#00f0ff] active:scale-95 transition-all shadow-xl disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save All Changes'}
                  </button>
                  <button
                    onClick={() => { setEditPost(null); setDraft(null); }}
                    className="py-5 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
