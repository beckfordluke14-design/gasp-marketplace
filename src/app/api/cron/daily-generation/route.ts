import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateBaseImage, dispatchGrokVideo } from '@/lib/videoFactory';
import { VISION_LIBRARY, type VisualCategory } from '@/config/vision';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('Authorization');
    const secret = process.env.CRON_SECRET || 'secret-gasp-key';

    if (authHeader !== `Bearer ${secret}` && searchParams.get('key') !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch Active Personas
    const { data: personas, error } = await supabase
      .from('personas')
      .select('id, name')
      .eq('is_active', true);

    if (error || !personas) {
      throw new Error('Failed to fetch personas.');
    }

    // 2. Fire and Forget Orchestration
    // Objective: Return 200 OK immediately while backgrounding the generation.
    process.nextTick(async () => {
        console.log(`[Cron] Starting daily content generation for ${personas.length} personas.`);
        
        for (const persona of personas) {
           try {
             // Randomly pick a category (e.g. favoring story_unlock or deep_vault for revenue)
             const categories: VisualCategory[] = ['WHALE_TRAP_BACKSIDE', 'STREET_FLASH_CANDID', 'EDITORIAL_SQUAT', 'MIRROR_MYSTERY'];
             const category = categories[Math.floor(Math.random() * categories.length)];

             console.log(`[Factory] Processing ${persona.name} with ${category}...`);
             
             // CHAIN: Gemini -> Storage -> Grok -> Webhook
             const imageUrl = await generateBaseImage(persona.id, category);
             await dispatchGrokVideo(imageUrl, category, persona.id);

           } catch (err: any) {
             console.error(`[Cron Loop Error] Persona ${persona.name}:`, err.message);
           }
        }
    });

    return NextResponse.json({ 
        success: true, 
        message: `Generation pipeline launched for ${personas.length} personas. Check video_jobs table for status.` 
    });

  } catch (err: any) {
    console.error("[Cron Critical Fail]:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



