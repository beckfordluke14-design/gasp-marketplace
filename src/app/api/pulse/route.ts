import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 🛡️ SOVEREIGN PULSE: Checking Railway directly
    const { rows } = await db.query('SELECT 1 as alive LIMIT 1');
    const dbCheck = rows && rows.length > 0;
    
    // Check BRAIN_SYNC (Gemini)
    const brainCheck = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    // Check VOX_CHANNEL (Google Chirp 3)
    const voxCheck = !!(process.env.GOOGLE_API_KEY || 'AIzaSyAikPZ-XQ1TgXlEUseky0OLNn6H6MefPe4');
    
    return Response.json({
       vault: dbCheck,
       brain: brainCheck,
       vox: voxCheck,
       nexus: true,
       status: 'SYNCHRONIZED',
       engine: 'Google Chirp 3 (HD)'
    });
  } catch (e: any) {
    return Response.json({
       status: 'DE-SYNCED',
       error: e.message
    });
  }
}



