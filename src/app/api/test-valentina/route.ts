import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateBaseImage, dispatchGrokVideo } from '@/lib/videoFactory';

export const dynamic = 'force-dynamic';

/**
 * THE VALENTINA TEST (Brazilian Green Eyes) - Railway Edition
 */
export async function GET() {
  console.log('⚡ [Valentina Test] Starting Double-Post Pulse on Railway...');

  const testPersonaId = 'valentina-lima'; 

  try {
     const { rows: personas } = await db.query('SELECT id FROM personas WHERE id = $1', [testPersonaId]);
     const existingPersona = personas[0];
     
     if (!existingPersona) {
        console.log(`🌟 [Birthing Valentina] DNA Node creation on Railway...`);
        await db.query(`
            INSERT INTO personas (id, name, age, city, country, vibe, system_prompt, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            ON CONFLICT (id) DO UPDATE SET is_active = true
        `, [
            testPersonaId,
            'Valentina Lima',
            26,
            'Rio de Janeiro',
            'Brazil',
            'Brazilian curvy woman with thick curly hair and striking emerald green eyes.',
            'Valentina. A Brazilian bombshell with dark, thick, curly hair and striking emerald green eyes. Olive skin tone, athletic curvaceous build. Confident and unbothered smirk.',
            true
        ]);
     }

     const stillCategory = 'EDITORIAL_SQUAT'; 
     const videoCategory = 'MIRROR_MYSTERY';  
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
     console.log('✅ [Valentina Test] Double-Post Pulse Successful on Railway.');
     return NextResponse.json({
        success: true,
        summary: 'Valentina Double-Post Dispatched on Railway',
        persona_id: testPersonaId,
        still_url: stillUrl,
        grok_job_id: grokJobId,
        factory_monitor: '/admin/monitor'
     }, { status: 200 });

  } catch (err: any) {
     console.error('❌ [Valentina Test Fail]:', err.message);
     return NextResponse.json({
        success: false,
        error: err.message || 'Railway Pipeline Disruption',
     }, { status: 500 });
  }
}



