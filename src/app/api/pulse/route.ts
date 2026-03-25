import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Check GASP_VAULT (Supabase)
    const { data: vaultCheck, error: vaultError } = await supabase.from('personas').select('id').limit(1);
    
    // 2. Check BRAIN_SYNC (Gemini)
    const brainCheck = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    // 3. Check VOX_CHANNEL (ElevenLabs)
    const voxCheck = !!process.env.ELEVENLABS_API_KEY;
    
    // 4. Return
    return Response.json({
       vault: !vaultError && !!vaultCheck,
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



