'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Unlock, 
  User, 
  Image as ImageIcon, 
  Video, 
  Star, 
  Trash2, 
  ChevronRight, 
  ShieldCheck,
  Zap,
  LayoutGrid,
  Search,
  Eye,
  Settings,
  X,
  Menu,
  RotateCcw,
  Pencil,
  Copy,
  Link2,
  Package,
  Plus,
  Sparkles,
  UserCheck,
  FolderHeart
} from 'lucide-react';
import { proxyImg } from '@/lib/profiles';
import Header from '@/components/Header';

export const dynamic = 'force-dynamic';

interface PersonaAsset {
  id: string;
  persona_id: string;
  content_url: string;
  content_type: string;
  caption: string;
  is_vault: boolean;
  is_burner: boolean;
  created_at: string;
}

interface PersonaInfo {
  id: string;
  name: string;
  city: string;
  seed_image_url: string;
  is_active: boolean;
}

export default function PersonaAuditPage() {
  const [personas, setPersonas] = useState<PersonaInfo[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<PersonaInfo | null>(null);
  const [assets, setAssets] = useState<PersonaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'vault' | 'raw'>('feed');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const [orphans, setOrphans] = useState<{ name: string; url: string }[]>([]);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // 🛡️ SOVEREIGN AUDIT SYNC: Use Admin System API (Service Role)
  async function universalAssetAudit(personaId?: string) {
    setIsSyncingAll(true);
    try {
        const res = await fetch(`/api/admin/system?action=scan-orphans${personaId ? `&personaId=${personaId}` : ''}`);
        const result = await res.json();
        
        if (result.success && result.files) {
           const mappedUrls = new Set(assets?.map(a => a?.content_url).filter(Boolean) || []);
           const slug = personaId?.split('-')[0].toLowerCase() || '';
           
           const orphansList = result.files
             .filter((f: any) => !personaId || f.name.toLowerCase().includes(slug) || f.name.toLowerCase().includes(personaId.toLowerCase()))
             .filter((f: any) => f?.url && !mappedUrls.has(f.url));

           // DEDUPLICATE URLS
           const uniqueOrphans = Array.from(new Map(orphansList.map((item: any) => [item.url, item])).values());
           setOrphans(uniqueOrphans as any);
        }
    } catch (e) {
        console.error('[Audit System] Scan Failure:', e);
    }
    setIsSyncingAll(false);
  }

  useEffect(() => {
    fetchPersonas();
    universalAssetAudit(); // Get all orphans for sidebar counts
  }, []);

  async function fetchAssets(personaId: string) {
    setLoading(true);
    try {
        const res = await fetch(`/api/admin/system?action=persona-details&personaId=${personaId}`);
        const result = await res.json();
        if (result.success) {
            setAssets(result.data.assets);
            setSelectedPersona(result.data.persona);
        }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => {
    if (selectedPersona && !loading) {
      universalAssetAudit(selectedPersona.id);
      if (window.innerWidth < 1024) setSidebarOpen(false);
    }
  }, [selectedPersona?.id]);

  async function fetchPersonas() {
    setLoading(true);
    try {
        const res = await fetch('/api/personas?all=true');
        const result = await res.json();
        if (result.success) setPersonas(result.personas);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const getOrphanCount = (pId: string) => {
    const slug = pId.split('-')[0].toLowerCase();
    return orphans.filter(o => o.name.toLowerCase().includes(slug)).length;
  };

  const togglePersonaActive = async (persona: PersonaInfo & { is_active: boolean }) => {
    setSyncing(persona.id);
    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'toggle-status', payload: { id: persona.id, is_active: !persona.is_active } })
        });
        const data = await res.json();
        if (data.success) {
            setPersonas(prev => prev.map(p => p.id === persona.id ? { ...p, is_active: !p.is_active } : p));
            if (selectedPersona?.id === persona.id) setSelectedPersona({ ...selectedPersona, is_active: !persona.is_active } as any);
        }
    } catch(e: any) { alert('Brain Sync Error: ' + e.message); }
    setSyncing(null);
  };

  const deletePersona = async (personaId: string) => {
    if (!confirm(`WARNING: You are about to PERMANENTLY TERMINATE persona '${personaId}'. This will delete ALL their posts, media mappings, and profile data. Proceed?`)) return;
    setLoading(true);
    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'kill', payload: { id: personaId } })
        });
        const data = await res.json();
        if (data.success) {
            setPersonas(prev => prev.filter(p => p.id !== personaId));
            setSelectedPersona(null);
        }
    } catch(e: any) { alert('Neural Error: ' + e.message); }
    setLoading(false);
  };

  const toggleVaultStatus = async (postId: string, current: boolean) => {
    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'toggle-vault', payload: { id: postId, is_vault: !current } })
        });
        const data = await res.json();
        if (data.success) {
            setAssets(prev => prev.map(a => a.id === postId ? { ...a, is_vault: !current } : a));
        }
    } catch(e: any) { console.error('Vault Sync Failed:', e.message); }
  };

  const toggleHeroStatus = async (postId: string, current: boolean) => {
    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'toggle-featured', payload: { id: postId, is_featured: !current } })
        });
        const data = await res.json();
        if (data.success) {
            setAssets(prev => prev.map(a => a.id === postId ? { ...a, is_burner: !current } : a));
        }
    } catch(e: any) { console.error('Hero Sync Failed:', e.message); }
  };

  const hidePost = async (postId: string) => {
    if (!confirm('🚨 Neural Tombstone: Hide this post from feed?')) return;
    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'delete-post', payload: { id: postId } })
        });
        const data = await res.json();
        if (data.success) setAssets(prev => prev.filter(a => a.id !== postId));
    } catch(e: any) { console.error('Hide Failed:', e.message); }
  };

  const deletePostHard = async (postId: string) => {
    if (!confirm('⚠️ CRITICAL DELETE: Permanently erase from DB?')) return;
    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'delete-post-hard', payload: { id: postId } })
        });
        const data = await res.json();
        if (data.success) setAssets(prev => prev.filter(a => a.id !== postId));
    } catch(e: any) { console.error('Hard Delete Failed:', e.message); }
  };

  const updateCaption = async (postId: string, newCaption: string) => {
    try {
        await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'update-post', payload: { id: postId, caption: newCaption } })
        });
    } catch(e: any) { alert('Caption Sync Error: ' + e.message); }
  };

  const globalRenamePersona = async (personaId: string, currentName: string) => {
    if (!selectedPersona) return;
    const newName = prompt('🚨 GLOBAL IDENTITY RE-INK: Enter new name:', currentName);
    if (!newName || newName === currentName) return;
    
    setSyncing(personaId);
    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'global-rename', payload: { id: personaId, oldName: currentName, newName } })
        });
        const data = await res.json();
        if (data.success) {
            setSelectedPersona({ ...selectedPersona, name: newName });
            setPersonas(prev => prev.map(p => p.id === personaId ? { ...p, name: newName } : p));
            fetchAssets(personaId);
        }
    } catch(e: any) { alert('Rename Error: ' + e.message); }
    setSyncing(null);
  };

  const [isBirthModalOpen, setIsBirthModalOpen] = useState(false);
  const [birthAsset, setBirthAsset] = useState<string | null>(null);
  const [birthForm, setBirthForm] = useState({ name: '', city: '', vibe: 'Elite high-status goddess.' });

  const executeBirth = async () => {
    if (!birthAsset || !birthForm.name || !birthForm.city) return;
    setSyncing(birthAsset);
    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'create-persona-full', payload: { 
                id: birthForm.name.toLowerCase().replace(/ /g, '-') + '-' + Math.floor(Math.random() * 1000),
                name: birthForm.name,
                city: birthForm.city,
                vibe: birthForm.vibe,
                seed_image_url: birthAsset
            }})
        });
        const data = await res.json();
        if (data.success) {
            fetchPersonas();
            setOrphans(prev => prev.filter(o => o.url !== birthAsset));
            setIsBirthModalOpen(false);
        }
    } finally { setSyncing(null); }
  };

  const mapToPost = async (url: string, asVault: boolean, targetId?: string) => {
    const finalId = targetId || selectedPersona?.id;
    if (!finalId) return;
    setSyncing(url);
    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'map-asset', payload: { 
                persona_id: finalId, content_url: url, is_vault: asVault, 
                caption: `Archive Capture: ${url.split('/').pop()}`
            }})
        });
        if ((await res.json()).success) {
            if (finalId === selectedPersona?.id) fetchAssets(finalId);
            setOrphans(prev => prev.filter(o => o.url !== url));
        }
    } finally { setSyncing(null); }
  };

  const setAsSeed = async (asset: PersonaAsset | { url: string }) => {
    if (!selectedPersona) return;
    const url = 'id' in asset ? asset.content_url : asset.url;
    setSyncing(url);
    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'set-seed', payload: { id: selectedPersona.id, url } })
        });
        if ((await res.json()).success) {
            setSelectedPersona({ ...selectedPersona, seed_image_url: url });
            setPersonas(prev => prev.map(p => p.id === selectedPersona.id ? { ...p, seed_image_url: url } : p));
        }
    } finally { setSyncing(null); }
  };

  const publicAssets = assets.filter(a => !a.is_vault);
  const vaultAssets = assets.filter(a => a.is_vault);
  const filteredPersonas = personas.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#050505] text-white font-outfit selection:bg-[#ff00ff] selection:text-black">
      <Header />
      
      <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between pt-24">
         <div className="flex items-center gap-6">
            <h1 className="text-5xl font-syncopate font-black italic tracking-tighter uppercase text-white">Auditor</h1>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hidden sm:block">Sovereign System API Active 🛡️</p>
         </div>
         <a href="/admin/posts" className="flex items-center gap-3 px-8 py-3 bg-[#00f0ff]/10 border border-[#00f0ff]/20 rounded-2xl text-[#00f0ff] text-[10px] font-black uppercase tracking-widest hover:bg-[#00f0ff]/20 hover:scale-105 transition-all shadow-[0_0_30px_rgba(0,240,255,0.1)]">
           <LayoutGrid size={16} /> Post Studio
         </a>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-180px)] overflow-hidden">
        {/* SIDEBAR */}
        <div className={`w-80 bg-black border-r border-white/5 flex flex-col transition-all overflow-hidden ${isSidebarOpen ? 'ml-0' : '-ml-80'}`}>
           <div className="p-6">
             <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
               <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search nodes..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 text-[10px] font-black uppercase tracking-widest focus:border-[#00f0ff]/40 outline-none transition-all" />
             </div>
           </div>
           <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-1 pb-40">
             {filteredPersonas.map(p => (
               <div key={p.id} onClick={() => fetchAssets(p.id)} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${selectedPersona?.id === p.id ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/20' : 'hover:bg-white/5 opacity-60 hover:opacity-100'}`}>
                 <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                    <img src={p.seed_image_url ? proxyImg(p.seed_image_url) : '/v1.png'} className="w-full h-full object-cover" />
                 </div>
                 <div className="min-w-0 flex-1">
                    <h4 className="text-[11px] font-black uppercase italic tracking-tighter truncate">{p.name}</h4>
                    <p className="text-[8px] text-white/40 uppercase tracking-widest truncate">{p.city}</p>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* MAIN BODY */}
        <div className="flex-1 flex flex-col bg-black/40 relative overflow-hidden">
          {selectedPersona ? (
            <>
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl shrink-0">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-[#00f0ff]/30 shadow-2xl bg-zinc-900">
                       <img src={proxyImg(selectedPersona.seed_image_url)} className="w-full h-full object-cover" />
                    </div>
                    <div>
                       <h2 className="text-3xl font-syncopate font-black italic tracking-tighter text-white uppercase">{selectedPersona.name}</h2>
                       <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[7px] font-black text-white/40 uppercase m-0">{selectedPersona.id}</span>
                          <span className={`px-2 py-0.5 rounded-full ${selectedPersona.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} border border-current text-[7px] font-black uppercase`}>{selectedPersona.is_active ? 'Active' : 'Hibernation'}</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => togglePersonaActive(selectedPersona as any)} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase text-white hover:bg-white/10">Toggle Status</button>
                    <button onClick={() => deletePersona(selectedPersona.id)} className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Kill Switch</button>
                 </div>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row gap-px bg-white/5 overflow-hidden">
                 {/* FEED */}
                 <div className="flex-1 flex flex-col bg-black overflow-hidden border-r border-white/5">
                    <div className="p-4 border-b border-white/5 flex items-center gap-3">
                       <Unlock size={14} className="text-green-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Public Feed ({publicAssets.length})</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 no-scrollbar pb-40">
                       {publicAssets.map(a => (
                         <AssetCard key={a.id} asset={a} onMove={() => toggleVaultStatus(a.id, false)} onSetSeed={() => setAsSeed(a)} onDelete={() => deletePostHard(a.id)} />
                       ))}
                    </div>
                 </div>
                 {/* VAULT */}
                 <div className="flex-1 flex flex-col bg-black overflow-hidden border-r border-white/5">
                    <div className="p-4 border-b border-white/5 flex items-center gap-3">
                       <Lock size={14} className="text-[#ff00ff]" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#ff00ff]">Vault Archive ({vaultAssets.length})</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 no-scrollbar pb-40">
                       {vaultAssets.map(a => (
                         <AssetCard key={a.id} asset={a} onMove={() => toggleVaultStatus(a.id, true)} onSetSeed={() => setAsSeed(a)} onDelete={() => deletePostHard(a.id)} />
                       ))}
                    </div>
                 </div>
                 {/* RAW */}
                 <div className="flex-1 flex flex-col bg-black overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <LayoutGrid size={14} className="text-[#ffea00]" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#ffea00]">Raw Orphans ({orphans.length})</span>
                       </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 no-scrollbar pb-40">
                       {orphans.map(o => (
                         <div key={o.url} className="relative aspect-[3/4] bg-white/5 rounded-3xl overflow-hidden border border-white/5 group">
                            <img src={proxyImg(o.url)} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" />
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all p-3">
                               <button onClick={() => mapToPost(o.url, false)} className="w-full py-2 bg-green-500 text-black text-[8px] font-black uppercase rounded-lg">+ Feed</button>
                               <button onClick={() => mapToPost(o.url, true)} className="w-full py-2 bg-[#ff00ff] text-white text-[8px] font-black uppercase rounded-lg">+ Vault</button>
                               <button onClick={() => setAsSeed({ url: o.url } as any)} className="w-full py-2 bg-white text-black text-[8px] font-black uppercase rounded-lg">Set Seed</button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 opacity-20">
               <ShieldCheck size={48} />
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Audit Node Standby</p>
               <button onClick={() => universalAssetAudit()} className="px-8 py-3 bg-white text-black rounded-full text-[10px] font-black uppercase">Deep Scan Storage</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssetCard({ asset, onMove, onSetSeed, onDelete }: { asset: PersonaAsset, onMove: () => void, onSetSeed: () => void, onDelete: () => void }) {
  return (
    <div className="relative aspect-[3/4] bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 group shadow-xl">
       <img src={proxyImg(asset.content_url)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
       <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all p-4">
          <button onClick={onMove} className="w-full py-3 bg-white/10 hover:bg-white text-white hover:text-black text-[9px] font-black uppercase rounded-xl transition-all">{asset.is_vault ? 'Move to Feed' : 'Move to Vault'}</button>
          <button onClick={onSetSeed} className="w-full py-3 bg-white/10 hover:bg-[#ffea00] text-white hover:text-black text-[9px] font-black uppercase rounded-xl transition-all">Set Main Photo</button>
          <button onClick={onDelete} className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[9px] font-black uppercase rounded-xl transition-all">Destroy</button>
       </div>
    </div>
  );
}
