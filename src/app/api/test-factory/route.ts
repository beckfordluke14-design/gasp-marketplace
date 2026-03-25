import { NextResponse } from 'next/server';
import { generateBaseImage, dispatchGrokVideo } from '@/lib/videoFactory';

/**
 * THE FIRST BLOOD TEST (E2E Pipeline Validation)
 * Objective: Trigger a full image-to-video render.
 */
export async function GET() {
  console.log('⚡ [First Blood] Starting E2E Pipeline Validation...');

  // 1. Hardcode test variables for deterministic verification
  const testPersonaId = 'isabella'; // Using existing persona Isabella
  const testCategory = 'PAPARAZZI_MOTION';
  const customOutfit = 'Bright red vintage Ferrari racing jacket';

  try {
     // 2. STAGE 1: Character Birth (Gemini Image Generation)
     console.log('📸 [First Blood] Running Stage 1: Base Image...');
     const imageUrl = await generateBaseImage(testPersonaId, testCategory, customOutfit);

     if (!imageUrl) {
        throw new Error('No image URL returned from Gemini Genesis.');
     }

     // 3. STAGE 2: Motion Rendering (xAI Video Generation Dispatch)
     console.log('🎬 [First Blood] Running Stage 2: Grok Dispatch...');
     const jobId = await dispatchGrokVideo(imageUrl, testCategory, testPersonaId);

     if (!jobId) {
        throw new Error('No Job ID returned from xAI Handshake.');
     }

     // 4. Return Deployment Payload
     console.log('✅ [First Blood] Success. Pipeline is live and pulsing.');
     return NextResponse.json({
        success: true,
        summary: 'E2E Pipeline Dispatched Successfully',
        persona_id: testPersonaId,
        imageUrl: imageUrl,
        grok_job_id: jobId
     }, { status: 200 });

  } catch (err: any) {
     console.error('❌ [First Blood] Crash during render chain:', err);
     return NextResponse.json({
        success: false,
        error: err.message || 'Pipeline Disruption',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
     }, { status: 500 });
  }
}



