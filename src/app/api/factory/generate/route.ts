import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildGenerationPrompt } from '@/lib/visionEngine';
import { type VisualCategory } from '@/config/vision';

export async function POST(req: Request) {
  try {
    const { personaId, categoryId, customContext, customClothing } = await req.json();

    if (!personaId || !categoryId) {
      return NextResponse.json({ error: 'personaId and categoryId are required.' }, { status: 400 });
    }

    // 1. Fetch Persona DNA from Railway DB
    const { rows } = await db.query(
      'SELECT id, name, system_prompt FROM personas WHERE id = $1',
      [personaId]
    );
    const persona = rows[0];

    if (!persona) {
      console.error('[Factory Error] Persona not found in Railway:', personaId);
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    // 2. Build Generation Prompt (Architect Circuit)
    const finalPrompt = buildGenerationPrompt(
      persona.system_prompt || '', 
      categoryId as VisualCategory, 
      customClothing,
      customContext
    );

    // 3. Log compiled output for AI bridge inspection
    console.log('--- VISION ENGINE OUTPUT ---');
    console.log(`PERSONA: ${persona.name} (${persona.id})`);
    console.log(`CATEGORY: ${categoryId}`);
    console.log(`PROMPT: ${finalPrompt}`);
    console.log('---------------------------');

    return NextResponse.json({ 
      success: true, 
      prompt: finalPrompt,
      metadata: { persona: persona.name, category: categoryId } 
    });

  } catch (err: any) {
    console.error("[Factory Critical]:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



