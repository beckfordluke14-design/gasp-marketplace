'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Play, CheckCircle2, XCircle, RefreshCcw, Zap, Activity, Clock, Database, ChevronRight, Sparkles } from 'lucide-react';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

/**
 * THE FACTORY MONITOR (V2: HEARTBEAT SYNC)
 * Objective: Real-time observability for the xAI Video Generation Pipeline.
 */
export default function FactoryMonitor() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [publishedJobs, setPublishedJobs] = useState<Record<string, 'publishing' | 'done'>>({});

  async function fetchJobs() {
    console.log('🛰️ [Monitor] Fetching Video Factories Heartbeat...');
    const { data: dbJobs, error } = await supabase
       .from('video_jobs')
       .select('*')
       .order('created_at', { ascending: false })
       .limit(10);

    if (dbJobs) setJobs(dbJobs);
    setLoading(false);
  }

  // 1. PULSE SYNC: Manually or Automatically trigger the xAI Polling Handshake
  async function triggerPulseSync() {
     if (isSyncing) return;
     setIsSyncing(true);
     console.log('💓 [Monitor] Triggering Pulse Sync Handshake...');
     
     try {
        const res = await fetch('/api/factory/sync');
        const data = await res.json();
        console.log('✅ [Monitor] Sync Results:', data);
        setLastSync(new Date().toLocaleTimeString());
        await fetchJobs();
     } catch (err) {
        console.error('❌ [Monitor] Sync Fault:', err);
     } finally {
        setIsSyncing(false);
     }
  }

  // ONE-CLICK PUBLISH: Create a post from a completed video job
  async function publishAsPost(job: any) {
    if (publishedJobs[job.id]) return;
    setPublishedJobs(prev => ({ ...prev, [job.id]: 'publishing' }));
    try {
      const res = await fetch('/api/admin/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-post',
          payload: {
            persona_id:   job.persona_id,
            content_url:  job.media_url,
            content_type: 'video',
            is_vault:     job.target_bin === 'vault',
            is_featured:  false,
            caption:      '',
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPublishedJobs(prev => ({ ...prev, [job.id]: 'done' }));
      } else {
        alert('Publish failed: ' + data.error);
        setPublishedJobs(prev => { const n = { ...prev }; delete n[job.id]; return n; });
      }
    } catch (err: any) {
      alert(err.message);
      setPublishedJobs(prev => { const n = { ...prev }; delete n[job.id]; return n; });
    }
  }

  // 2. Lifecycle: Auto-Poll for Status and Sync every 15s
  useEffect(() => {
    fetchJobs();
    const syncInterval = setInterval(triggerPulseSync, 15000); // Heartbeat sync (15s)
    const uiInterval = setInterval(fetchJobs, 10000); // UI Refresh (10s)
    
    return () => {
       clearInterval(syncInterval);
       clearInterval(uiInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 md:p-14 font-outfit pb-32">
       {/* High-Status Header */}
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-8">
         <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-syncopate font-bold uppercase italic tracking-tighter leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
               Factory <span className="text-[#00f0ff]">Monitor</span>
            </h1>
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-3">
               <Activity size={14} className="text-[#00f0ff] animate-pulse" /> Real-Time xAI Pipeline Heartbeat • Polling Enabled
            </p>
         </div>

         <div className="flex items-center gap-4 bg-white/[0.03] p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl">
            <div className="text-right space-y-1 pr-4 border-r border-white/10">
               <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Last Pulse Sync</p>
               <p className="text-xs font-bold font-mono text-[#00f0ff]">{lastSync || 'Initializing...'}</p>
            </div>
            <button 
              onClick={triggerPulseSync}
              disabled={isSyncing}
              className={`p-4 rounded-2xl transition-all ${isSyncing ? 'bg-[#00f0ff]/20 text-[#00f0ff]' : 'bg-[#00f0ff] text-black hover:scale-105 shadow-[0_0_30px_rgba(0,240,255,0.3)]'}`}
            >
               <RefreshCcw size={20} className={isSyncing ? 'animate-spin' : ''} />
            </button>
         </div>
      </div>

      {loading ? (
         <div className="h-64 flex items-center justify-center">
            <Zap size={40} className="text-[#00f0ff] animate-pulse" />
         </div>
      ) : (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
               {jobs.map((job) => (
                  <motion.div 
                    layout 
                    key={job.id} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className="p-8 rounded-[3rem] bg-black/40 border border-white/5 backdrop-blur-3xl shadow-2xl flex flex-col gap-6 hover:border-white/10 transition-all group"
                  >
                     {/* Job Header Info */}
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                              <Box size={24} />
                           </div>
                           <div>
                              <h3 className="text-xs font-black uppercase tracking-widest leading-none mb-1">{job.job_id.substring(0, 8)}...</h3>
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{job.visual_category}</p>
                                <span className="text-[8px] bg-neon-blue/20 text-neon-blue px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">9:16 Accurate</span>
                              </div>
                           </div>
                        </div>
                        <StatusBadge status={job.status} />
                     </div>

                      {/* The Media Terminal (FORCE 9:16 VERTICAL) */}
                      <div className="relative aspect-[9/16] max-h-[500px] mx-auto rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 group-hover:border-[#00f0ff]/20 transition-all shadow-inner">
                         {job.status === 'completed' && job.media_url ? (
                            <>
                              <video 
                                src={job.media_url} 
                                autoPlay 
                                muted 
                                loop 
                                playsInline 
                                className="w-full h-full object-cover" 
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent flex items-end p-6">
                                 <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                       <Database size={14} className="text-[#00f0ff]" />
                                       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Ingested into {job.target_bin === 'feed' ? 'Global Feed' : 'Media Vault'}</p>
                                    </div>
                                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest pl-5">{job.target_bin === 'feed' ? 'Public Social Stream' : 'Private Paid Tier'}</p>
                                 </div>
                              </div>
                            </>
                        ) : job.status === 'failed' ? (
                           <div className="h-full flex flex-col items-center justify-center gap-4 text-red-500/40">
                              <XCircle size={40} />
                              <p className="text-[10px] font-black uppercase tracking-widest leading-none">Render Cluster Failure</p>
                           </div>
                        ) : (
                           <div className="h-full flex flex-col items-center justify-center gap-4 overflow-hidden">
                              <Image 
                                src={job.temp_image_url || '/v1.png'} 
                                alt="Seed" 
                                width={800} height={400} 
                                className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl"
                              />
                              <div className="relative z-10 flex flex-col items-center gap-4">
                                <Activity size={32} className="text-[#00f0ff] animate-pulse" />
                                <div className="text-center">
                                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00f0ff]">Asynchronously Rendering...</p>
                                   <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-2">{job.status.toUpperCase()}</p>
                                </div>
                              </div>
                           </div>
                        )}
                     </div>

                      {/* Bottom row: timestamp + publish CTA */}
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-white/20">
                            <Clock size={12} />
                            <p className="text-[9px] font-bold uppercase tracking-[0.1em]">{new Date(job.created_at).toLocaleString()}</p>
                         </div>

                         {/* ONE-CLICK PUBLISH — only for completed jobs with media */}
                         {job.status === 'completed' && job.media_url ? (
                           publishedJobs[job.id] === 'done' ? (
                             <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                               <CheckCircle2 size={14} />
                               <span className="text-[9px] font-black uppercase tracking-widest">Published</span>
                             </div>
                           ) : (
                             <motion.button
                               whileHover={{ scale: 1.05 }}
                               whileTap={{ scale: 0.95 }}
                               onClick={() => publishAsPost(job)}
                               disabled={publishedJobs[job.id] === 'publishing'}
                               className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00f0ff] text-black font-black uppercase tracking-widest text-[9px] shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all disabled:opacity-50"
                             >
                               {publishedJobs[job.id] === 'publishing' ? (
                                 <><RefreshCcw size={12} className="animate-spin" /> Pushing...</>
                               ) : (
                                 <><Play size={12} fill="currentColor" /> Publish to Feed</>
                               )}
                             </motion.button>
                           )
                         ) : (
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Persona: {job.persona_id}</p>
                         )}
                      </div>
                  </motion.div>
               ))}
            </AnimatePresence>
         </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, any> = {
    pending: { color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', label: 'Queued' },
    processing: { color: 'text-blue-500 bg-blue-500/10 border-blue-500/20 animate-pulse', label: 'Rendering' },
    completed: { color: 'text-green-500 bg-green-500/10 border-green-500/20', label: 'Done' },
    failed: { color: 'text-red-500 bg-red-500/10 border-red-500/20', label: 'Error' }
  };

  const config = configs[status] || configs.pending;

  return (
    <div className={`px-4 py-2 rounded-full border ${config.color} flex items-center gap-2`}>
       <div className={`w-1.5 h-1.5 rounded-full bg-current ${status === 'processing' ? 'animate-ping' : ''}`} />
       <span className="text-[9px] font-black uppercase tracking-widest">{config.label}</span>
    </div>
  );
}



