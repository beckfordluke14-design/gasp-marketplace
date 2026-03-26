import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateBaseImage, dispatchGrokVideo } from '@/lib/videoFactory';
import { visionPolishCaption } from '@/lib/visionPolisher';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

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
    const { data: persona } = await supabase.from('personas').select('*').eq('id', persona_id).single();
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

        // 📝 CREATE CLOUD-PUBLISHED VOICE POST
        await supabase.from('posts').insert([{
            persona_id: persona_id,
            content_type: 'voice',
            content_url: voiceUrl,
            caption: polishedCaption,
            is_vault: false,
            is_burner: false,
            scheduled_for: new Date().toISOString()
        }]);
        console.log('📝 [Birth API] Debut Voice Post Dispatched to Feed.');
    } catch (vErr) {
        console.warn(`⚠️ [Birth API] Voice Genesis Skip: ${vErr}`);
    }

    // 2. Dispatch Grok Render
    const grokJobId = await dispatchGrokVideo(stillUrl, category, persona_id);
    
    // 3. Update the job with the TARGET_BIN (Feed vs Vault)
    await supabase
      .from('video_jobs')
      .update({ target_bin: target || 'vault' })
      .eq('job_id', grokJobId);

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



