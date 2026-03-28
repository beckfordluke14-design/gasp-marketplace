import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateBaseImage, dispatchGrokVideo } from '@/lib/videoFactory';
import { visionPolishCaption } from '@/lib/visionPolisher';

export const dynamic = 'force-dynamic';

/**
 * NEURAL BIRTH DISPATCHER
 * Objective: Generate an identity seed and dispatch the debut post to the FEED.
 */
export async function POST(req: Request) {
  try {
    const { persona_id, category, clothing, target } = await req.json();

    console.log(`🍼 [Birth API] Initiating Genesis for ${persona_id}...`);

    // 1. Generate the Identity Anchor (Still Image)
    const stillUrl = await generateBaseImage(persona_id, category, clothing);
    console.log(`📸 [Birth API] Anchor Image Locked: ${stillUrl}`);

    // 🎙️ VOICE GENESIS (Intro Note)
    const { generatePersonaVoice } = require('@/lib/voiceFactory');
    
    // 🧠 VISION POLISH: Analyze the newly generated anchor image
    const { rows: personas } = await db.query('SELECT * FROM personas WHERE id = $1 LIMIT 1', [persona_id]);
    const persona = personas[0];
    
    const polishedCaption = await visionPolishCaption(stillUrl, {
        name: persona?.name || persona_id,
        age: persona?.age || 23,
        city: persona?.city || 'Medellin',
        vibe: persona?.vibe || 'sexy, street, real',
        slang_instructions: 'spanglish, paisa slang, klk, real-talk'
    }, false);

    let voiceUrl = null;
    try {
        voiceUrl = await generatePersonaVoice(persona_id, polishedCaption);
        console.log(`🎙️ [Birth API] Vocal Cords Activated: ${voiceUrl}`);

        // 🛡️ SOVEREIGN DEBUT: Creating the debut voice post in Railway
        await db.query(`
            INSERT INTO posts (
                persona_id, 
                content_type, 
                content_url, 
                caption, 
                is_vault, 
                is_burner, 
                scheduled_for, 
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [persona_id, 'voice', voiceUrl, polishedCaption, false, false]);
        
        console.log('📝 [Birth API] Debut Voice Post Dispatched to Sovereign Feed.');
    } catch (vErr) {
        console.warn(`⚠️ [Birth API] Voice Genesis Skip: ${vErr}`);
    }

    // 2. Dispatch Grok Render
    const grokJobId = await dispatchGrokVideo(stillUrl, category, persona_id);
    
    // 3. Update the job with the TARGET_BIN in the sovereign ledger
    await db.query(`
        UPDATE video_jobs 
        SET target_bin = $1 
        WHERE job_id = $2
    `, [target || 'vault', grokJobId]);

    return NextResponse.json({
      success: true,
      persona: persona_id,
      grok_job_id: grokJobId,
      final_bin: target || 'vault',
      monitor_url: '/admin/monitor'
    });

  } catch (err: any) {
    console.error('❌ [Birth API Error]:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



