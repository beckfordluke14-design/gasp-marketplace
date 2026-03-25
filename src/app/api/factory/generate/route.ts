import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildGenerationPrompt } from '@/lib/visionEngine';
import { type VisualCategory } from '@/config/vision';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const { personaId, categoryId, customContext, customClothing } = await req.json();

    if (!personaId || !categoryId) {
      return NextResponse.json({ error: 'personaId and categoryId are required.' }, { status: 400 });
    }

    // 1. Fetch Persona DNA from Supabase
    const { data: persona, error } = await supabase
      .from('personas')
      .select('id, name, system_prompt')
      .eq('id', personaId)
      .maybeSingle();

    if (error || !persona) {
      console.error('[Factory Error] Persona not found:', error);
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



