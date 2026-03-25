import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateBaseImage, dispatchGrokVideo } from '@/lib/videoFactory';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * THE VALENTINA TEST (Brazilian Green Eyes)
 * Objective: Generate two posts: a Still and a Video.
 */
export async function GET() {
  console.log('⚡ [Valentina Test] Starting Double-Post Generation Pulse...');

  const testPersonaId = 'valentina-lima'; 

  try {
     const { data: existingPersona, error: fetchErr } = await supabase.from('personas').select('id').eq('id', testPersonaId).maybeSingle();
     
     if (!existingPersona) {
        console.log(`🌟 [Birthing Valentina] DNA Node creation...`);
        const { error: birthErr } = await supabase.from('personas').upsert([{
           id: testPersonaId,
           name: 'Valentina Lima',
           age: 26,
           city: 'Rio de Janeiro',
           country: 'Brazil',
           vibe: 'Brazilian curvy woman with thick curly hair and striking emerald green eyes.',
           system_prompt: 'Valentina. A Brazilian bombshell with dark, thick, curly hair and striking emerald green eyes. Olive skin tone, athletic curvaceous build. Confident and unbothered smirk.',
           is_active: true
        }]);
        if (birthErr) throw birthErr;
     }

     const stillCategory = 'EDITORIAL_SQUAT'; // A clean still
     const videoCategory = 'MIRROR_MYSTERY';  // "Admiring Herself"
     const customOutfit = 'Neon green lace corset and black silk flare trousers';

     // 1. Post 1: The Still Image (Gemini Genesis)
     console.log('📸 [Valentina Test] Generating Still: EDITORIAL_SQUAT...');
     const stillUrl = await generateBaseImage(testPersonaId, stillCategory, customOutfit);

     if (!stillUrl) {
        throw new Error('Still Genesis Collapse: No URL returned.');
     }

     // 2. Post 2: The Video Motion (xAI Grok Dispatch)
     console.log('🎬 [Valentina Test] Generating Video: MIRROR_MYSTERY...');
     const videoStillUrl = await generateBaseImage(testPersonaId, videoCategory, customOutfit);
     const grokJobId = await dispatchGrokVideo(videoStillUrl, videoCategory, testPersonaId);

     if (!grokJobId) {
        throw new Error('Video Dispatch Collapse: No Job ID returned.');
     }

     // 3. Status Report
     console.log('✅ [Valentina Test] Double-Post Pulse Successful.');
     return NextResponse.json({
        success: true,
        summary: 'Valentina Double-Post Dispatched',
        persona_id: testPersonaId,
        still_url: stillUrl,
        grok_job_id: grokJobId,
        factory_monitor: '/admin/monitor'
     }, { status: 200 });

  } catch (err: any) {
     console.error('❌ [Valentina Test Fail]:', err.message);
     return NextResponse.json({
        success: false,
        error: err.message || 'Pipeline Disruption',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
     }, { status: 500 });
  }
}



