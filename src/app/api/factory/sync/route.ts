import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { VISION_LIBRARY, VisualCategory } from '@/config/vision';

export const dynamic = 'force-dynamic';

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';

/**
 * THE PULSE SYNC: HEARTBEAT FOR ASYNC RENDERS
 * Objective: Poll xAI for every pending job and finalize the media ingestion.
 */
export async function GET() {
  console.log('💓 [Pulse Sync] Synchronizing Video Factory Heartbeat...');

  try {
     // 1. Fetch All Active (Pending/Processing) Jobs from Railway
     const { rows: activeJobs } = await db.query(`
        SELECT * FROM video_jobs 
        WHERE status IN ('pending', 'processing')
     `);

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
              
              // 🛡️ SOVEREIGN STORAGE: Assigning the permanent R2 bridge URL
              const fileName = `media_${job.persona_id}_${Date.now()}.mp4`;
              const vaultUrl = `https://asset.gasp.fun/posts/vault/${job.persona_id}/${fileName}`;

              // 2. Database Finalization: media_vault & video_jobs status
              const config = VISION_LIBRARY[job.visual_category as VisualCategory];
              
              if (job.target_bin === 'feed') {
                  console.log(`📡 [Pulse Sync] Publishing ${job.job_id} to GLOBAL FEED...`);
                  
                  // CREATE PUBLIC POST in Railway
                  await db.query(`
                    INSERT INTO posts (persona_id, content_url, content_type, caption, is_vault, is_highlighted, created_at)
                    VALUES ($1, $2, 'video', $3, false, true, NOW())
                  `, [job.persona_id, vaultUrl, config.aesthetic || 'New drop in the baddie lounge.']);

              } else {
                  console.log(`🔐 [Pulse Sync] Archiving ${job.job_id} in PRIVATE VAULT...`);
                  
                  // CREATE VAULT ITEM (PAID) in Railway
                  await db.query(`
                    INSERT INTO media_vault (persona_id, media_url, price_points, tier, is_unlocked_by_default, created_at)
                    VALUES ($1, $2, $3, $4, false, NOW())
                  `, [
                    job.persona_id, 
                    vaultUrl, 
                    job.visual_category === 'PAPARAZZI_MOTION' ? 750 : 350, 
                    config.tier
                  ]);
              }

              // Update the original job record
              await db.query('UPDATE video_jobs SET status = $1, media_url = $2 WHERE job_id = $3', ['completed', vaultUrl, job.job_id]);

              results.push({ job_id: job.job_id, status: 'INGESTED', url: vaultUrl });

           } else if (xaiStatus === 'failed') {
              console.error(`❌ [Pulse Sync] Render Failed for ${job.job_id}`);
              await db.query('UPDATE video_jobs SET status = $1 WHERE job_id = $2', ['failed', job.job_id]);
              results.push({ job_id: job.job_id, status: 'FAILED' });
           } else {
              // Update status to processing if xai shows progress
              if (job.status !== 'processing' && xaiStatus === 'in_progress') {
                  await db.query('UPDATE video_jobs SET status = $1 WHERE job_id = $2', ['processing', job.job_id]);
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



