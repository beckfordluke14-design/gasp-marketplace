import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 🛡️ SOVEREIGN PULSE: Checking Railway directly
    const { rows } = await db.query('SELECT 1 as alive LIMIT 1');
    const dbCheck = rows && rows.length > 0;
    
    // Check BRAIN_SYNC (Gemini)
    const brainCheck = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    // Check VOX_CHANNEL (ElevenLabs)
    const voxCheck = !!process.env.ELEVENLABS_API_KEY;
    
    return Response.json({
       vault: dbCheck,
       brain: brainCheck,
       vox: voxCheck,
       nexus: true,
       status: 'SYNCHRONIZED'
    });
  } catch (e: any) {
    return Response.json({
       status: 'DE-SYNCED',
       error: e.message
    });
  }
}



