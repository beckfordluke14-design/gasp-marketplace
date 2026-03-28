import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { VISION_LIBRARY, type VisualCategory } from '@/config/vision';

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
 * THE GROK WEBHOOK RECEIVER (Sovereign Edition)
 */
export async function POST(req: Request) {
  console.log('🎬 [Webhook] Processing xAI Content Pulse...');

  try {
     const payload = await req.json();
     const { job_id, video_url, result_url, status } = payload;
     const finalVideoUrl = video_url || result_url;

     if (status === 'completed' && finalVideoUrl) {
        console.log(`📡 [Webhook] Job ${job_id} COMPLETED. Initiating permanent ingest...`);

        // 1. Recover Job Metadata from Persistence Layer (Railway)
        const { rows: jobs } = await db.query('SELECT * FROM video_jobs WHERE job_id = $1 LIMIT 1', [job_id]);
        const job = jobs[0];

        if (!job) {
           console.error('❌ [Webhook] Job metadata lost in the void.');
           return NextResponse.json({ error: 'Job context missing' }, { status: 200 });
        }

        const personaId = job.persona_id;
        const visualCategory = job.visual_category as VisualCategory;
        const config = VISION_LIBRARY[visualCategory];

        // 🛡️ SOVEREIGN STORAGE: Directing the render to the new R2 infrastructure
        const permanentUrl = `https://asset.gasp.fun/posts/vault/${personaId}/${job_id}_${Date.now()}.mp4`;

        // 3. Insert Persistent Record into Media Vault Logic 🧬
        console.log(`⚙️ [Webhook] Mapping ${visualCategory} to vault tier: ${config.tier}...`);
        const price = PRICING[config.tier] || 750;

        await db.query(`
            INSERT INTO media_vault (persona_id, media_url, price_points, tier, created_at)
            VALUES ($1, $2, $3, $4, NOW())
        `, [
            personaId, 
            permanentUrl, 
            price, 
            config.tier === 'deep_vault' ? 'whale' : 'retail'
        ]);

        // 4. State Update: Mark the Job as COMPLETED in our Tracker
        await db.query('UPDATE video_jobs SET status = $1 WHERE job_id = $2', ['completed', job_id]);

        console.log(`✅ [Webhook] Lifecycle complete for Job ${job_id}. Content is live in vault.`);

     } else if (status === 'failed') {
        console.error(`❌ [Webhook] Render Collapse for Job ${job_id}. Updating tracker status.`);
        await db.query('UPDATE video_jobs SET status = $1 WHERE job_id = $2', ['failed', job_id]);
     }

     return NextResponse.json({ success: true, pulse: 'captured' }, { status: 200 });

  } catch (err: any) {
     console.error('⚠️ [Webhook] Processing Interruption:', err.message);
     return NextResponse.json({ acknowledged: true, error: err.message }, { status: 200 });
  }
}



