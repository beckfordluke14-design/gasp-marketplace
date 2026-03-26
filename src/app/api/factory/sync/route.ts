import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { VISION_LIBRARY, VisualCategory } from '@/config/vision';

export const dynamic = 'force-dynamic';

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * THE PULSE SYNC: HEARTBEAT FOR ASYNC RENDERS
 * Objective: Poll xAI for every pending job and finalize the media ingestion.
 */
export async function GET() {
  console.log('💓 [Pulse Sync] Synchronizing Video Factory Heartbeat...');

  try {
     // 1. Fetch All Active (Pending/Processing) Jobs
     const { data: activeJobs } = await supabase
        .from('video_jobs')
        .select('*')
        .in('status', ['pending', 'processing']);

     if (!activeJobs || activeJobs.length === 0) {
        return NextResponse.json({ message: 'No active renders found. Heartbeat steady.' });
     }

     console.log(`🔎 [Pulse Sync] Checking ${activeJobs.length} active jobs...`);
     const results = [];

     for (const job of activeJobs) {
        console.log(`🛰️ [Pulse Sync] Polling Job Status: ${job.job_id}...`);
        
        try {
           const res = await fetch(`https://api.x.ai/v1/videos/${job.job_id}`, {
              headers: { 'Authorization': `Bearer ${GROK_API_KEY}` }
           });

           if (!res.ok) {
              console.error(`⚠️ [Pulse Sync] Poll Failed for ${job.job_id}: ${res.status}`);
              continue;
           }

           const xaiData = await res.json();
           const xaiStatus = xaiData.status; // 'not_started', 'in_progress', 'done', 'failed'

           if (xaiStatus === 'done' && xaiData.video?.url) {
              console.log(`✅ [Pulse Sync] Render Done! Ingesting ${job.job_id}...`);
              
              const finalVideoUrl = xaiData.video.url;

              // INGESTION: Download and Re-upload to Permanent Vault
              const videoRes = await fetch(finalVideoUrl);
              const buffer = Buffer.from(await videoRes.arrayBuffer());
              
              const fileName = `media_${job.persona_id}_${Date.now()}.mp4`;
              const { error: uploadError } = await supabase.storage
                 .from('media_vault')
                 .upload(fileName, buffer, { contentType: 'video/mp4' });

              if (uploadError) throw uploadError;

              const { data: { publicUrl: vaultUrl } } = supabase.storage.from('media_vault').getPublicUrl(fileName);

              // 2. Database Finalization: media_vault & video_jobs status
              const config = VISION_LIBRARY[job.visual_category as VisualCategory];
              
              if (job.target_bin === 'feed') {
                  console.log(`📡 [Pulse Sync] Publishing ${job.job_id} to GLOBAL FEED...`);
                  
                  // CREATE PUBLIC POST
                  await supabase.from('posts').insert([{
                      persona_id: job.persona_id,
                      content_url: vaultUrl,
                      content_type: 'video',
                      caption: config.aesthetic || 'New drop in the baddie lounge.',
                      is_vault: false,
                      is_highlighted: true
                  }]);

              } else {
                  console.log(`🔐 [Pulse Sync] Archiving ${job.job_id} in PRIVATE VAULT...`);
                  
                  // CREATE VAULT ITEM (PAID)
                  await supabase.from('media_vault').insert([{
                      persona_id: job.persona_id,
                      media_url: vaultUrl,
                      price_points: job.visual_category === 'PAPARAZZI_MOTION' ? 750 : 350,
                      tier: config.tier,
                      is_unlocked_by_default: false
                  }]);
              }

              // Update the original job record
              await supabase.from('video_jobs').update({
                  status: 'completed',
                  media_url: vaultUrl
              }).eq('job_id', job.job_id);

              // 3. Cleanup: Delete the seed image from temp storage
              if (job.temp_image_url) {
                 const tempFileName = job.temp_image_url.split('/').pop();
                 if (tempFileName) {
                    await supabase.storage.from('pipeline_temp').remove([tempFileName]);
                 }
              }

              results.push({ job_id: job.job_id, status: 'INGESTED', url: vaultUrl });

           } else if (xaiStatus === 'failed') {
              console.error(`❌ [Pulse Sync] Render Failed for ${job.job_id}`);
              await supabase.from('video_jobs').update({ status: 'failed' }).eq('job_id', job.job_id);
              results.push({ job_id: job.job_id, status: 'FAILED' });
           } else {
              // Update status to processing if xai shows progress
              if (job.status !== 'processing' && xaiStatus === 'in_progress') {
                 await supabase.from('video_jobs').update({ status: 'processing' }).eq('job_id', job.job_id);
              }
              results.push({ job_id: job.job_id, status: xaiStatus });
           }

        } catch (jobErr: any) {
           console.error(`🔥 [Pulse Sync] Error processing job ${job.job_id}:`, jobErr.message);
        }
     }

     return NextResponse.json({ 
        pulse_sync: 'active',
        timestamp: new Date().toISOString(),
        results: results
     });

  } catch (err: any) {
     console.error('❌ [Pulse Sync Error]:', err.message);
     return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



