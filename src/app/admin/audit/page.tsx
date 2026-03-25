'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
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
  Pencil
} from 'lucide-react';
import { proxyImg } from '@/lib/profiles';
import Header from '@/components/Header';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface PersonaAsset {
  id: string;
  persona_id: string;
  content_url: string;
  content_type: string;
  caption: string;
  is_vault: boolean;
  is_featured: boolean;
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

  async function universalAssetAudit(personaId?: string) {
    const slug = personaId?.split('-')[0] || '';
    const buckets = [
      { name: 'chat_media', paths: personaId ? [`personas/${personaId}`, `personas/${slug}`, 'personas', ''] : ['personas', ''] },
      { name: 'posts', paths: [''] },
      { name: 'media_vault', paths: [''] }
    ];

    let allFiles: any[] = [];
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    // 1. SCAN STORAGE
    for (const buck of buckets) {
      for (const path of buck.paths) {
        try {
          const { data } = await supabase.storage.from(buck.name).list(path, { limit: 100 });
          if (data) {
            allFiles.push(...data.filter(f => f.id).map(f => ({
              name: f.name,
              bucket: buck.name,
              url: `${baseUrl}/storage/v1/object/public/${buck.name}/${path ? path + '/' : ''}${f.name}`
            })));
          }
        } catch(e) {}
      }
    }

    // 2. SCAN DATABASE FOR GHOST POSTS (NULL persona_id)
    const { data: dbOrphans } = await supabase.from('posts').select('*').is('persona_id', null);
    if (dbOrphans) {
        allFiles.push(...dbOrphans.map(o => ({
            name: `DB_GHOST_${o.id.slice(0,4)}`,
            bucket: 'posts_table',
            url: o.content_url
        })));
    }

    const mappedUrls = new Set(assets?.map(a => a?.content_url).filter(Boolean) || []);
    const orphansList = allFiles
      .filter(f => !personaId || f.name.toLowerCase().includes(slug.toLowerCase()) || f.name.toLowerCase().includes(personaId.toLowerCase()))
      .filter(f => f?.url && !mappedUrls.has(f.url));

    // DEDUPLICATE URLS
    const uniqueOrphans = Array.from(new Map(orphansList.map(item => [item.url, item])).values());
    setOrphans(uniqueOrphans);
  }

  useEffect(() => {
    fetchPersonas();
    universalAssetAudit(); // Get all orphans for sidebar counts
  }, []);

  useEffect(() => {
    if (selectedPersona) {
      fetchAssets(selectedPersona.id);
      universalAssetAudit(selectedPersona.id);
      if (window.innerWidth < 1024) setSidebarOpen(false);
    }
  }, [selectedPersona]);

  async function fetchPersonas() {
    setLoading(true);
    const { data } = await supabase
      .from('personas')
      .select('id, name, city, seed_image_url, is_active')
      .order('name'); // Include inactive for admin
    if (data) setPersonas(data);
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
        } else alert('Status Sync Failed: ' + data.error);
    } catch(e: any) { alert('Brain Sync Error: ' + e.message); }
    setSyncing(null);
  };

  const deletePersona = async (personaId: string) => {
    if (!confirm(`WARNING: You are about to PERMANENTLY TERMINATE persona '${personaId}'. This will delete ALL their posts, media mappings, and profile data from the database. This CANNOT be undone. Proceed?`)) return;
    if (!confirm(`FINAL WARNING: This is IRREVERSIBLE. Type 'TERMINATE' to continue.`)) {
        const input = prompt("Type 'TERMINATE' to delete:");
        if (input !== 'TERMINATE') return;
    }
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
            alert('Persona Terminated successfully.');
        } else alert('Kill Pulse Refused: ' + data.error);
    } catch(e: any) { alert('Neural Error: ' + e.message); }
    setLoading(false);
  };

  const renamePersona = async (personaId: string, currentName: string) => {
    if (!selectedPersona) return;
    const newName = prompt('Enter New Identity Label:', currentName);
    if (!newName || newName === currentName) return;
    setSyncing(personaId);
    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'rename', payload: { id: personaId, name: newName } })
        });
        const data = await res.json();
        if (data.success) {
            setSelectedPersona({ ...selectedPersona, name: newName });
            setPersonas(prev => prev.map(p => p.id === personaId ? { ...p, name: newName } : p));
        } else alert('Rename Synapse Failed: ' + data.error);
    } catch(e: any) { alert('Rename Error: ' + e.message); }
    setSyncing(null);
  };

  async function fetchAssets(personaId: string) {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('persona_id', personaId)
      .order('created_at', { ascending: false });
    if (data) setAssets(data);
    setLoading(false);
  }

  const [isBirthModalOpen, setIsBirthModalOpen] = useState(false);
  const [birthAsset, setBirthAsset] = useState<string | null>(null);
  const [birthForm, setBirthForm] = useState({ name: '', city: '', vibe: 'Elite high-status goddess.' });

  const RANDOM_NAMES = ['Aria', 'Luna', 'Nova', 'Sasha', 'Jade', 'Mika', 'Raven', 'Tia', 'Zola', 'Catalina', 'Elena', 'Morena'];
  const RANDOM_CITIES = ['Miami', 'Medellín', 'London', 'Paris', 'Tokyo', 'Milan', 'Kyoto', 'Ibiza', 'Santorini'];

  const randomizeBirth = () => {
    setBirthForm({
      name: RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)],
      city: RANDOM_CITIES[Math.floor(Math.random() * RANDOM_CITIES.length)],
      vibe: 'Glistening and elite. ' + (birthAsset?.endsWith('.mp4') ? 'Cinematic movement.' : 'High-fashion editorial.')
    });
  };

  const executeBirth = async () => {
    if (!birthAsset || !birthForm.name || !birthForm.city) return;
    setSyncing(birthAsset);

    const slug = birthForm.name.toLowerCase().replace(/ /g, '-') + '-' + Math.floor(Math.random() * 1000);

    // 1. Create Persona
    const { data: persona, error: pError } = await supabase.from('personas').insert([{
        id: slug,
        name: birthForm.name,
        city: birthForm.city,
        vibe: birthForm.vibe,
        seed_image_url: birthAsset,
        is_active: true
    }]).select().single();

    if (pError) {
        alert('Birth Failed: ' + pError.message);
        setSyncing(null);
        return;
    }

    // 2. Map Initial Post
    await supabase.from('posts').insert([{
        persona_id: slug,
        content_type: birthAsset.toLowerCase().endsWith('.mp4') ? 'video' : 'image',
        content_url: birthAsset,
        caption: 'Neural birth complete.',
        is_vault: false
    }]);

    // 3. UI Sync
    setPersonas(prev => [persona, ...prev]);
    setSelectedPersona(persona);
    setOrphans(prev => prev.filter(o => o.url !== birthAsset));
    setIsBirthModalOpen(false);
    setBirthAsset(null);
    setSyncing(null);
    alert(`Success! ${birthForm.name} is now LIVE.`);
  };

  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeSlaveId, setMergeSlaveId] = useState('');

  const mergePersonas = async (masterId: string, slaveId: string) => {
    if (!slaveId) return;
    if (!confirm(`NEURAL FUSION: You are about to merge ALL assets from '${slaveId}' into '${masterId}'. '${slaveId}' will be PERMANENTLY DELETED. Proceed?`)) return;

    setLoading(true);
    
    // 1. Reassign all posts
    const { error: updateError } = await supabase.from('posts').update({ persona_id: masterId }).eq('persona_id', slaveId);
    
    if (updateError) {
        alert('Merge Update Failed: ' + updateError.message);
        setLoading(false);
        return;
    }

    // 2. Delete the slave persona
    await supabase.from('personas').delete().eq('id', slaveId);

    // 3. UI Sync
    setPersonas(prev => prev.filter(p => p.id !== slaveId));
    if (selectedPersona?.id === masterId) {
        await fetchAssets(masterId); // Reload assets for master
        // Ensure the orphan scan also runs for the master
        universalAssetAudit(masterId);
    }
    setIsMergeModalOpen(false);
    setMergeSlaveId('');
    setLoading(false);
    alert('FUSION COMPLETE: All assets merged into ' + masterId);
  };
  

  const deleteAsset = async (asset: PersonaAsset | { url: string }) => {
    if (!confirm('Are you sure you want to delete this asset? This is IRREVERSIBLE.')) return;
    
    const assetId = 'id' in asset ? asset.id : undefined;
    const url = 'id' in asset ? asset.content_url : asset.url;
    setSyncing(url);

    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'delete-post', payload: { id: assetId, content_url: url } })
        });
        const data = await res.json();
        if (data.success) {
            setAssets(prev => prev.filter(a => a.content_url !== url));
            setOrphans(prev => prev.filter(o => o.url !== url));
        } else alert('Neural Wipe Failed: ' + data.error);
    } catch(e: any) { alert('Delete Error: ' + e.message); }
    setSyncing(null);
  };

  const reassignAsset = async (asset: PersonaAsset, newPersonaId: string) => {
    setSyncing(asset.id);
    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'reassign-asset', payload: { asset, newPersonaId } })
        });
        const data = await res.json();
        if (data.success) {
           alert(`Mirror Sync: Asset cloned to ${newPersonaId}`);
        } else alert('Mirror Sync Failed: ' + data.error);
    } catch(e:any) { alert('Reassign Error: ' + e.message); }
    setSyncing(null);
  };

  const mapToPost = async (url: string, asVault: boolean, targetId?: string) => {
    const finalId = targetId || selectedPersona?.id;
    if (!finalId) return;
    
    setSyncing(url);
    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'map-asset', payload: { 
                persona_id: finalId,
                content_url: url,
                is_vault: asVault,
                caption: `Archive Capture: ${url.split('/').pop()}`
            }})
        });
        const data = await res.json();
        if (data.success) {
            if (finalId === selectedPersona?.id) fetchAssets(finalId);
            setOrphans(prev => prev.filter(o => o.url !== url));
        } else alert('Map Sync Failed: ' + data.error);
    } catch(e:any) { alert('Mapping Error: ' + e.message); }
    setSyncing(null);
  };

  const toggleVault = async (asset: PersonaAsset) => {
    setSyncing(asset.id);
    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'toggle-vault', payload: { id: asset.id, is_vault: !asset.is_vault } })
        });
        const data = await res.json();
        if (data.success) {
            setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, is_vault: !a.is_vault } : a));
        } else alert('Vault Handshake Failed: ' + data.error);
    } catch(e:any){ alert('Neural Error: ' + e.message); }
    setSyncing(null);
  };

  const setAsSeed = async (asset: PersonaAsset) => {
    if (!selectedPersona) return;
    setSyncing(asset.id);
    try {
        const res = await fetch('/api/admin/audit', {
            method: 'POST',
            body: JSON.stringify({ action: 'set-seed', payload: { id: selectedPersona.id, url: asset.content_url } })
        });
        const data = await res.json();
        if (data.success) {
            setSelectedPersona({ ...selectedPersona, seed_image_url: asset.content_url });
            setPersonas(prev => prev.map(p => p.id === selectedPersona.id ? { ...p, seed_image_url: asset.content_url } : p));
        } else alert('Identity Seed Failed: ' + data.error);
    } catch(e:any){ alert('Seed Error: ' + e.message); }
    setSyncing(null);
  };

  const publicAssets = assets.filter(a => !a.is_vault);
  const vaultAssets = assets.filter(a => a.is_vault);
  const filteredPersonas = personas.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#050505] text-white font-outfit selection:bg-[#ff00ff] selection:text-black">
      <Header />
      
      {/* MOBILE TABS HEADER */}
      {selectedPersona && (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] w-[90%] bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full flex items-center p-2 shadow-2xl">
            <button onClick={() => setSidebarOpen(true)} className="p-3 text-white/40 hover:text-white"><Menu size={20}/></button>
            <div className="flex-1 flex bg-white/5 rounded-full p-1 gap-1">
               <button onClick={() => setActiveTab('feed')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-full transition-all ${activeTab === 'feed' ? 'bg-green-500 text-black' : 'text-white/40'}`}>Feed</button>
               <button onClick={() => setActiveTab('vault')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-full transition-all ${activeTab === 'vault' ? 'bg-[#ff00ff] text-white' : 'text-white/40'}`}>Vault</button>
               <button onClick={() => setActiveTab('raw')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-full transition-all ${activeTab === 'raw' ? 'bg-[#ffea00] text-black' : 'text-white/40'}`}>Raw</button>
            </div>
            <button onClick={() => fetchAssets(selectedPersona.id)} className="p-3 text-[#00f0ff]"><RotateCcw size={20}/></button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row h-screen pt-16 overflow-hidden">
        
        {/* 1. PERSONA SIDEBAR (Drawer on Mobile) */}
        <AnimatePresence>
          {(isSidebarOpen || !selectedPersona) && (
            <motion.div 
              initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
              className="fixed inset-y-0 left-0 z-[1000] lg:static w-full sm:w-80 bg-black lg:bg-transparent border-r border-white/5 flex flex-col pt-20 lg:pt-4"
            >
              <div className="flex items-center justify-between px-6 mb-4 lg:hidden">
                 <h2 className="text-xl font-syncopate font-black italic">NODES</h2>
                 <button onClick={() => setSidebarOpen(false)} className="p-2 text-white/40"><X size={24}/></button>
              </div>

              <div className="px-6 mb-6">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00f0ff] transition-colors" size={16} />
                  <input 
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search nodes..." 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest focus:border-[#00f0ff]/40 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-1 pb-40">
                {filteredPersonas.map(p => (
                  <motion.div
                    key={p.id} onClick={() => setSelectedPersona(p)}
                    whileHover={{ x: 4 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${selectedPersona?.id === p.id ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/20' : 'hover:bg-white/5 border border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                      {p.seed_image_url?.toLowerCase().endsWith('.mp4') ? (
                        <video src={proxyImg(p.seed_image_url)} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={p.seed_image_url ? proxyImg(p.seed_image_url) : ''} className="w-full h-full object-cover bg-black" />
                      )}
                      {!p.is_active && <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><Eye size={10} className="text-white/40" /></div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                         <h4 className={`text-[11px] font-black uppercase italic tracking-tighter truncate ${!p.is_active ? 'text-white/20 line-through' : ''}`}>{p.name}</h4>
                         {getOrphanCount(p.id) > 0 && !selectedPersona && (
                           <span className="px-1.5 py-0.5 rounded-md bg-[#ffea00] text-black text-[7px] font-black uppercase animate-pulse">+{getOrphanCount(p.id)} NEW</span>
                         )}
                      </div>
                      <p className="text-[8px] text-white/40 uppercase tracking-widest truncate">{p.city}</p>
                   </div>
                    {p.is_active ? (
                      selectedPersona?.id === p.id && <Zap size={10} className="ml-auto text-[#00f0ff] animate-pulse" />
                    ) : (
                      <span className="ml-auto text-[6px] font-black uppercase text-white/20 bg-white/5 px-1.5 py-0.5 rounded-full">Retired</span>
                    )}
                 </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

          {/* 2. MAIN HUB */}
        <div className="flex-1 flex flex-col overflow-hidden pt-12 lg:pt-0 relative">
          
          {/* FUSION MODAL (MERGE) */}
          <AnimatePresence>
            {isMergeModalOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[2100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6">
                 <div className="w-full max-w-md space-y-6">
                    <div className="flex items-center justify-between">
                       <h2 className="text-2xl font-syncopate font-black italic text-white uppercase tracking-tighter">Neural Fusion</h2>
                       <button onClick={() => setIsMergeModalOpen(false)}><X size={24}/></button>
                    </div>
                    
                    <div className="p-6 bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-3xl">
                       <p className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff] mb-2">Master Persona (Source of Truth)</p>
                       <h3 className="text-xl font-bold uppercase">{selectedPersona?.name}</h3>
                       <p className="text-[9px] text-white/40 mt-1 uppercase">ALL assets from the target below will be remapped to this ID</p>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Select Target to Consume</label>
                       <select 
                         value={mergeSlaveId} 
                         onChange={e => setMergeSlaveId(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#00f0ff] text-white"
                       >
                         <option value="">Choose Target Persona...</option>
                         {personas.filter(p => p.id !== selectedPersona?.id).map(p => (
                           <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                         ))}
                       </select>
                    </div>

                    <button 
                      onClick={() => mergePersonas(selectedPersona?.id || '', mergeSlaveId)}
                      disabled={!mergeSlaveId}
                      className="w-full py-4 bg-[#00f0ff] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(0,240,255,0.4)] disabled:opacity-20 transition-all hover:scale-105"
                    >
                      Process Fusion (Irreversible)
                    </button>
                    <p className="text-center text-[7px] text-white/20 uppercase tracking-[0.2em] px-8">The target persona will be permanently deleted after all assets are transferred</p>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* BIRTH MODAL OVERLAY */}
          <AnimatePresence>
            {isBirthModalOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[2000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 sm:p-20">
                 <div className="w-full max-w-lg space-y-8">
                    <div className="flex items-center justify-between">
                       <h2 className="text-3xl font-syncopate font-black italic text-white uppercase tracking-tighter">Neural Birth</h2>
                       <button onClick={() => setIsBirthModalOpen(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"><X size={24}/></button>
                    </div>

                    <div className="flex gap-8 items-start">
                       <div className="w-40 aspect-[3/4] rounded-3xl overflow-hidden border border-white/20 shrink-0 bg-zinc-900 shadow-2xl">
                          {birthAsset?.endsWith('.mp4') ? <video src={proxyImg(birthAsset)} autoPlay loop muted playsInline className="w-full h-full object-cover"/> : <img src={proxyImg(birthAsset || '')} className="w-full h-full object-cover"/>}
                       </div>
                       <div className="flex-1 space-y-6">
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Persona Name</label>
                             <input value={birthForm.name} onChange={e => setBirthForm({...birthForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#00f0ff] text-white" />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Origin City</label>
                             <input value={birthForm.city} onChange={e => setBirthForm({...birthForm, city: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#00f0ff] text-white" />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Neural Vibe</label>
                       <textarea value={birthForm.vibe} onChange={e => setBirthForm({...birthForm, vibe: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#00f0ff] h-24 text-white" />
                    </div>

                    <div className="flex gap-4">
                       <button onClick={randomizeBirth} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 text-white">Randomize Persona</button>
                       <button onClick={executeBirth} className="flex-1 py-4 bg-[#ffea00] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,234,0,0.3)]">Initiate Birth</button>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedPersona ? (
            <>
              {/* DESKTOP HEADER */}
              <div className="hidden lg:flex p-8 border-b border-white/5 items-center justify-between bg-black/40 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-6">
                  <div className="relative w-20 h-20 rounded-3xl overflow-hidden border-2 border-[#00f0ff]/30 shadow-[0_0_40px_rgba(0,240,255,0.15)] bg-zinc-900">
                     {selectedPersona.seed_image_url.toLowerCase().endsWith('.mp4') ? (
                       <video src={proxyImg(selectedPersona.seed_image_url)} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                     ) : (
                       <img src={proxyImg(selectedPersona.seed_image_url)} className="w-full h-full object-cover" />
                     )}
                  </div>
                  <div className="group/name relative">
                    <h2 className="text-3xl font-syncopate font-black italic tracking-tighter text-white uppercase group-hover/name:text-[#00f0ff] transition-colors">{selectedPersona.name}</h2>
                    <button 
                      onClick={() => renamePersona(selectedPersona.id, selectedPersona.name)}
                      className="absolute -top-1 -right-8 p-2 bg-white/5 rounded-full text-white/20 hover:text-white hover:bg-white/10 opacity-0 group-hover/name:opacity-100 transition-all"
                      title="Rename Identity"
                    >
                       <Pencil size={12} />
                    </button>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[7px] font-black text-white/40 uppercase tracking-widest">{selectedPersona.id}</span>
                       <span className="px-2 py-0.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[7px] font-black text-[#00f0ff] uppercase tracking-widest">{selectedPersona.city}</span>
                       <span className={`px-2 py-0.5 rounded-full ${selectedPersona.is_active ? 'bg-green-500/10 text-green-500' : 'bg-white/10 text-white/40'} border border-current text-[7px] font-black uppercase tracking-widest`}>
                          {selectedPersona.is_active ? 'Active' : 'Neural Hibernation (Retired)'}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                   <button onClick={() => setIsMergeModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white">
                      <LayoutGrid size={14} className="opacity-40" /> 
                      Neural Fusion (Merge)
                   </button>
                   <button onClick={() => togglePersonaActive(selectedPersona)} className={`flex items-center gap-2 px-6 py-3 border rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedPersona.is_active ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-green-500 text-black border-transparent hover:scale-105'}`}>
                      {selectedPersona.is_active ? <Eye size={14} className="opacity-40" /> : <ShieldCheck size={14} />} 
                      {selectedPersona.is_active ? 'Retire from Site' : 'Bring Online'}
                   </button>
                   <button onClick={() => deletePersona(selectedPersona.id)} className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={14} /> Kill Switch
                   </button>
                </div>
              </div>

              {/* DUAL WORKSPACE */}
              <div className="flex-1 flex lg:flex-row flex-col gap-px bg-white/5 overflow-hidden">
                {/* COLUMN: RAW */}
                <div className={`flex-1 flex flex-col bg-black overflow-hidden border-r border-white/5 ${activeTab === 'raw' ? 'flex h-full pb-32 lg:pb-0' : 'hidden lg:flex'}`}>
                   <div className="hidden lg:flex p-6 border-b border-white/5 items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-[#ffea00]/10 rounded-xl text-[#ffea00]"><LayoutGrid size={18} /></div>
                         <h3 className="text-xs font-black uppercase italic tracking-tighter">Raw Library <span className="opacity-40 ml-2">({orphans.length} Orphans)</span></h3>
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-6 auto-rows-max no-scrollbar pb-60 shadow-inner">
                        {orphans.map(orphan => (
                          <OrphanCard 
                            key={orphan.url} 
                            url={orphan.url} 
                            name={orphan.name} 
                            onMapFeed={() => mapToPost(orphan.url, false)} 
                            onMapVault={() => mapToPost(orphan.url, true)} 
                            onSetSeed={() => setAsSeed({ content_url: orphan.url } as any)} 
                            isSyncing={syncing === orphan.url} 
                            onDelete={() => deleteAsset({ url: orphan.url })} 
                            onBirth={() => { setBirthAsset(orphan.url); randomizeBirth(); setIsBirthModalOpen(true); }} 
                          />
                        ))}
                        {orphans.length === 0 && (
                          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-white/5 rounded-[3rem] opacity-20">
                            <LayoutGrid size={40} />
                            <div className="text-center">
                              <p className="text-[10px] font-black uppercase tracking-widest">No matching raw assets found</p>
                              <button onClick={() => universalAssetAudit()} className="mt-4 px-6 py-2 bg-white text-black rounded-xl text-[8px] font-black uppercase">Deep Scan All Folders</button>
                            </div>
                          </div>
                        )}
                   </div>
                </div>

                {/* COLUMN: FEED */}
                <div className={`flex-1 flex flex-col bg-black overflow-hidden border-r border-white/5 ${activeTab === 'feed' ? 'flex' : 'hidden lg:flex'}`}>
                   <div className="hidden lg:flex p-6 border-b border-white/5 items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-green-500/10 rounded-xl text-green-500"><Unlock size={18} /></div>
                         <h3 className="text-xs font-black uppercase italic tracking-tighter">Public Feed <span className="opacity-40 ml-2">({publicAssets.length})</span></h3>
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 auto-rows-max no-scrollbar pb-60">
                        {publicAssets.map(asset => (
                          <AssetCard key={asset.id} asset={asset} isSyncing={syncing === asset.id} onMove={() => toggleVault(asset)} onSetSeed={() => setAsSeed(asset)} isActiveSeed={asset.content_url === selectedPersona.seed_image_url} onDelete={() => deleteAsset(asset)} onReassign={(newId) => reassignAsset(asset, newId)} />
                        ))}
                        {publicAssets.length === 0 && <EmptyState label="No public feed items." color="green" icon={<Unlock size={20}/>}/>}
                   </div>
                </div>

                {/* COLUMN: VAULT */}
                <div className={`flex-1 flex flex-col bg-black overflow-hidden ${activeTab === 'vault' ? 'flex' : 'hidden lg:flex'}`}>
                   <div className="hidden lg:flex p-6 border-b border-white/5 items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-[#ff00ff]/10 rounded-xl text-[#ff00ff]"><Lock size={18} /></div>
                         <h3 className="text-xs font-black uppercase italic tracking-tighter">Locked Vault <span className="opacity-40 ml-2">({vaultAssets.length})</span></h3>
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 auto-rows-max no-scrollbar pb-60">
                        {vaultAssets.map(asset => (
                          <AssetCard key={asset.id} asset={asset} isSyncing={syncing === asset.id} onMove={() => toggleVault(asset)} onSetSeed={() => setAsSeed(asset)} isActiveSeed={asset.content_url === selectedPersona.seed_image_url} onDelete={() => deleteAsset(asset)} onReassign={(newId) => reassignAsset(asset, newId)} />
                        ))}
                        {vaultAssets.length === 0 && <EmptyState label="Vault is empty." color="pink" icon={<Lock size={20}/>}/>}
                   </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-8 p-12 text-center bg-[#050505]">
               <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-[#00f0ff]/20 to-[#ff00ff]/20 border border-white/10 flex items-center justify-center animate-pulse">
                  <LayoutGrid size={40} className="text-white/20" />
               </div>
               <div>
                  <h3 className="text-xl font-syncopate font-black uppercase italic mb-2 tracking-tighter text-white">Neural Audit Hub</h3>
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em] max-w-xs mx-auto mb-8">Select a node or trigger a universal scan to uncover unmapped assets</p>
                  <button onClick={() => universalAssetAudit()} className="px-12 py-4 bg-[#ffea00] text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    Universal Asset Scan (Deep Search)
                  </button>
               </div>
               
               {/* SHOW UNIVERSAL ORPHANS IF LOADED */}
               {orphans.length > 0 && (
                 <div className="w-full mt-12 bg-black/40 p-8 rounded-[3rem] border border-white/5 flex flex-col h-[600px]">
                   <div className="flex items-center justify-between mb-10 shrink-0">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ffea00]">Universal Search: {orphans.length} Ghost Assets Uncovered</h4>
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Global Action:</span>
                         <button onClick={() => universalAssetAudit()} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-white/10">Re-Scan Multi-Buckets</button>
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 no-scrollbar pb-20">
                     {orphans.map(o => (
                       <OrphanCard 
                         key={o.url} 
                         url={o.url} 
                         name={o.name} 
                         onMapFeed={() => {
                            const pId = prompt('Enter Persona ID for this Feed item:');
                            if (pId) mapToPost(o.url, false, pId);
                         }} 
                         onMapVault={() => {
                            const pId = prompt('Enter Persona ID for this Vault item:');
                            if (pId) mapToPost(o.url, true, pId);
                         }} 
                         onSetSeed={() => alert('Select a persona from the sidebar first.')} 
                         isSyncing={syncing === o.url} 
                         onDelete={() => deleteAsset({ url: o.url })} 
                         onBirth={() => { setBirthAsset(o.url); randomizeBirth(); setIsBirthModalOpen(true); }} 
                       />
                     ))}
                   </div>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrphanCard({ url, name, onMapFeed, onMapVault, onSetSeed, isSyncing, onDelete, onBirth }: { url: string, name: string, onMapFeed: () => void, onMapVault: () => void, onSetSeed: () => void, isSyncing: boolean, onDelete: () => void, onBirth: () => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative group rounded-[2.5rem] overflow-hidden border border-white/10 bg-zinc-950 shadow-2xl">
      <div className="aspect-[4/5] relative overflow-hidden bg-black/40 cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {url?.toLowerCase().endsWith('.mp4') ? (
          <video src={proxyImg(url)} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
        ) : (
          <img src={url ? proxyImg(url) : ''} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity group-hover:scale-110 transition-all duration-1000 bg-black" />
        )}

        <AnimatePresence>
          {(isMenuOpen || true) && (
            <div className={`absolute inset-0 bg-black/80 backdrop-blur-md p-6 flex flex-col justify-center gap-3 transition-all ${isMenuOpen ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'}`}>
               <button onClick={(e) => { e.stopPropagation(); onBirth(); setIsMenuOpen(false); }} className="w-full py-4 bg-white text-black rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-[#ffea00] active:scale-95 transition-all">
                  Birth Persona
               </button>
               <div className="grid grid-cols-2 gap-3 pb-2 border-b border-white/10">
                 <button onClick={(e) => { e.stopPropagation(); onMapFeed(); setIsMenuOpen(false); }} className="py-4 bg-green-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                   + Feed
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); onMapVault(); setIsMenuOpen(false); }} className="py-4 bg-[#ff00ff] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                   + Vault
                 </button>
               </div>
               <div className="grid grid-cols-2 gap-3 mt-1">
                 <button onClick={(e) => { e.stopPropagation(); onSetSeed(); setIsMenuOpen(false); }} className="py-3 bg-[#00f0ff] text-black rounded-xl text-[8px] font-black uppercase tracking-widest">
                   Set Prof.
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); onDelete(); setIsMenuOpen(false); }} className="py-3 bg-red-500/20 text-red-500 rounded-xl text-[8px] font-black uppercase tracking-widest">
                   Burn
                 </button>
               </div>
               <p className="text-[7px] text-white/20 uppercase tracking-[0.2em] text-center mt-2 font-mono truncate">{name}</p>
            </div>
          )}
        </AnimatePresence>

        <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-xl text-white text-[7px] font-black uppercase tracking-widest border border-white/20">
           ORPHAN
        </div>
      </div>

      {isSyncing && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
           <Zap size={24} className="text-[#ffea00] animate-spin" />
        </div>
      )}
    </motion.div>
  );
}

function AssetCard({ asset, isSyncing, onMove, onSetSeed, isActiveSeed, onDelete, onReassign }: { asset: PersonaAsset, isSyncing: boolean, onMove: () => void, onSetSeed: () => void, isActiveSeed: boolean, onDelete: () => void, onReassign: (id: string) => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showReassign, setShowReassign] = useState(false);

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative group rounded-[2.5rem] overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl">
      <div className="aspect-[4/5] relative overflow-hidden bg-black/40 cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {asset?.content_type === 'video' ? (
          <video src={proxyImg(asset?.content_url || '')} autoPlay loop muted playsInline className="w-full h-full object-cover" />
        ) : (
          <img src={asset?.content_url ? proxyImg(asset.content_url) : ''} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 bg-black" />
        )}
        
        <AnimatePresence>
          {(isMenuOpen || true) && (
            <div className={`absolute inset-0 bg-black/80 backdrop-blur-xl p-6 flex flex-col justify-center gap-3 transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'}`}>
               <div className="grid grid-cols-2 gap-3">
                  <button onClick={(e) => { e.stopPropagation(); onMove(); setIsMenuOpen(false); }} className={`py-4 ${asset.is_vault ? 'bg-white text-black' : 'bg-[#ff00ff] text-white'} rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all`}>
                    {asset.is_vault ? 'Promote' : 'Lock Vault'}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(); setIsMenuOpen(false); }} className="py-4 bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                    Burn
                  </button>
               </div>
               
               {!isActiveSeed && (
                 <button onClick={(e) => { e.stopPropagation(); onSetSeed(); setIsMenuOpen(false); }} className="w-full py-4 bg-[#00f0ff] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                    Set as Seed Image
                 </button>
               )}

               <button onClick={(e) => { e.stopPropagation(); setShowReassign(true); }} className="w-full py-3 bg-white/5 border border-white/10 text-white/40 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] hover:text-white transition-all">
                  Neural Transfer (ID Split)
               </button>
            </div>
          )}
        </AnimatePresence>

        {showReassign && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-[60] p-6 flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff]">Neural Transfer</span>
                <button onClick={() => setShowReassign(false)} className="p-2 bg-white/5 rounded-full"><X size={16}/></button>
             </div>
             <p className="text-[8px] text-white/40 uppercase mb-4 leading-relaxed tracking-widest">Enter Target Persona ID Slug:</p>
             <input 
               autoFocus
               onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                   onReassign((e.target as HTMLInputElement).value);
                   setShowReassign(false);
                   setIsMenuOpen(false);
                 }
               }}
               placeholder="amara-goddess"
               className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#00f0ff] uppercase"
             />
             <p className="mt-auto text-[7px] text-white/20 uppercase tracking-[0.3em] text-center mb-4 italic">Press Enter to Migrate Asset</p>
          </div>
        )}

        {/* STATUS STAMPS */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
           <div className={`px-2.5 py-1 rounded-full ${asset.is_vault ? 'bg-[#ff00ff]' : 'bg-green-500'} text-black text-[7px] font-black uppercase tracking-widest shadow-lg`}>
              {asset.is_vault ? 'VAULT' : 'FEED'}
           </div>
           {isActiveSeed && (
             <div className="px-2.5 py-1 rounded-full bg-[#ffea00] text-black text-[7px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                <Star size={6} fill="currentColor" /> SEED
             </div>
           )}
        </div>
      </div>

      <div className="p-5 bg-zinc-900 border-t border-white/5">
        <div className="flex items-center gap-2 opacity-20 mb-2">
           {asset.content_type === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
           <span className="text-[8px] font-black uppercase tracking-[0.2em]">{new Date(asset.created_at).toLocaleDateString()}</span>
        </div>
        <p className="text-[11px] text-white/60 lowercase italic truncate leading-none">{asset.caption || '...'}</p>
      </div>

      {isSyncing && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
           <Zap size={24} className="text-[#00f0ff] animate-spin" />
        </div>
      )}
    </motion.div>
  );
}

function EmptyState({ label, color, icon }: { label: string, color: string, icon: any }) {
  return (
    <div className="col-span-full py-32 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-white/5 rounded-[4rem] opacity-30">
       <div className={`w-16 h-16 rounded-full border border-dashed border-white/40 flex items-center justify-center`}>{icon}</div>
       <p className="text-[10px] font-black uppercase tracking-[0.4em]">{label}</p>
    </div>
  );
}



