import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { VISION_LIBRARY, type VisualCategory } from '@/config/vision';

// SYSTEM CONFIG: NEURAL VAULT ARCHITECTURE
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// TIER PRICING MATRIX (Gasp Collective Standard)
const PRICING: Record<string, number> = {
  'deep_vault': 3000,
  'story_unlock': 750,
  'retail_story': 400,
  'feed_flex': 150,
  'free_feed': 40,
  'parasocial_feed': 100
};

/**
 * THE GROK WEBHOOK RECEIVER (Production Pulse)
 * Objective: Permanent ingestion of xAI renders into the Gasp media vault.
 */
export async function POST(req: Request) {
  console.log('🎬 [Webhook] Processing xAI Content Pulse...');

  try {
     const payload = await req.json();
     const { job_id, video_url, result_url, status } = payload;
     const finalVideoUrl = video_url || result_url;

     if (status === 'completed' && finalVideoUrl) {
        console.log(`📡 [Webhook] Job ${job_id} COMPLETED. Initiating permanent ingest...`);

        // 1. Recover Job Metadata from Persistence Layer
        const { data: job, error: jobErr } = await supabase
           .from('video_jobs')
           .select('*')
           .eq('job_id', job_id)
           .single();

        if (jobErr || !job) {
           console.error('❌ [Webhook] Job metadata lost in the void:', jobErr);
           return NextResponse.json({ error: 'Job context missing' }, { status: 200 }); // Still 200 to acknowledge Grok
        }

        const personaId = job.persona_id;
        const visualCategory = job.visual_category as VisualCategory;
        const config = VISION_LIBRARY[visualCategory];

        // 2. Download MP4 & Re-upload to Permanent Vault (Private) 💾
        console.log(`📥 [Webhook] Downloading binary buffer from cloud render node...`);
        const videoRes = await fetch(finalVideoUrl);
        if (!videoRes.ok) throw new Error('Binary download failed.');
        
        const buffer = Buffer.from(await videoRes.arrayBuffer());
        const fileName = `vault/${personaId}/${job_id}_${Date.now()}.mp4`;

        const { error: uploadError } = await supabase.storage
           .from('media_vault')
           .upload(fileName, buffer, { contentType: 'video/mp4', cacheControl: '3600' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl: permanentUrl } } = supabase.storage
           .from('media_vault')
           .getPublicUrl(fileName);

        // 3. Insert Persistent Record into Media Vault Logic 🧬
        console.log(`⚙️ [Webhook] Mapping ${visualCategory} to vault tier: ${config.tier}...`);
        const price = PRICING[config.tier] || 750;

        const { error: dbError } = await supabase.from('media_vault' as any).insert([{
            persona_id: personaId,
            media_url: permanentUrl,
            price_points: price,
            tier: config.tier === 'deep_vault' ? 'whale' : 'retail',
            created_at: new Date().toISOString()
        }]);

        if (dbError) throw dbError;

        // 4. State Update: Mark the Job as COMPLETED in our Tracker
        await supabase.from('video_jobs').update({ status: 'completed' }).eq('job_id', job_id);

        // 5. Memory Cleanup: Delete the seed image to save VPS resources
        if (job.temp_image_url) {
           const tempPath = job.temp_image_url.split('/').pop();
           if (tempPath) {
              await supabase.storage.from('pipeline_temp').remove([tempPath]);
              console.log('🧹 [Webhook] Pipeline temp cleanup finished.');
           }
        }

        console.log(`✅ [Webhook] Lifecycle complete for Job ${job_id}. Content is live in vault.`);

     } else if (status === 'failed') {
        console.error(`❌ [Webhook] Render Collapse for Job ${job_id}. Updating tracker status.`);
        await supabase.from('video_jobs').update({ status: 'failed' }).eq('job_id', job_id);
     }

     return NextResponse.json({ success: true, pulse: 'captured' }, { status: 200 });

  } catch (err: any) {
     console.error('⚠️ [Webhook] Processing Interruption:', err.message);
     // We return 200 even on internal failure to stop Grok from retrying relentlessly
     return NextResponse.json({ acknowledged: true, error: err.message }, { status: 200 });
  }
}



