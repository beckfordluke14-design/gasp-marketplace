import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateBaseImage, dispatchGrokVideo } from '@/lib/videoFactory';
import { VISION_LIBRARY, type VisualCategory } from '@/config/vision';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('Authorization');
    const secret = process.env.CRON_SECRET || 'secret-gasp-key';

    if (authHeader !== `Bearer ${secret}` && searchParams.get('key') !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch Active Personas from Railway
    const { rows: personas } = await db.query('SELECT id, name FROM personas WHERE is_active = true');

    if (!personas || personas.length === 0) {
      return NextResponse.json({ success: true, message: 'No active personas found in Railway.' });
    }

    // 2. Fire and Forget Orchestration
    process.nextTick(async () => {
        console.log(`[Cron] Starting daily generation for ${personas.length} personas on Railway.`);
        
        for (const persona of personas) {
           try {
             const categories: VisualCategory[] = ['WHALE_TRAP_BACKSIDE', 'STREET_FLASH_CANDID', 'EDITORIAL_SQUAT', 'MIRROR_MYSTERY'];
             const category = categories[Math.floor(Math.random() * categories.length)];

             console.log(`[Factory] Processing ${persona.name} with ${category}...`);
             
             const imageUrl = await generateBaseImage(persona.id, category);
             await dispatchGrokVideo(imageUrl, category, persona.id);

           } catch (err: any) {
             console.error(`[Cron Loop Error] Persona ${persona.name}:`, err.message);
           }
        }
    });

    return NextResponse.json({ 
        success: true, 
        message: `Generation pipeline launched for ${personas.length} personas on Railway.` 
    });

  } catch (err: any) {
    console.error("[Cron Critical Fail]:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



