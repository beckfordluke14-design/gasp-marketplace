/**
 * 🎙️ GASP LIVE VOICE PIPELINE TEST — /api/test-voice (Railway Edition)
 */

export const dynamic = 'force-dynamic';

import { generatePersonaVoice } from '@/lib/voiceFactory';
import { GLOBAL_SYNDICATE_ZONES_V3 } from '@/lib/syndicate';
import { db } from '@/lib/db';

// Persona → zone mapping for AI generation context
const PERSONA_ZONES: Record<string, string> = {
  'isabella':      'us_newark_afro_latina',
  'valeria':       'col_medellin_paisa',
  'valentina':     'col_bogota_rola',
  'bianca':        'col_cartagena_costena',
  'tia-jamaica':   'carib_black_jamaican',
  'zola-nigeria':  'uk_london_black',
  'kaelani-x':     'uk_london_black',
  'elena':         'uk_essex_white',
};

/**
 * Generate a LIVE phrase using Grok AI — same model the chat uses.
 */
async function generateLiveAiText(personaId: string, zone: string): Promise<string> {
  const zoneDictionary = GLOBAL_SYNDICATE_ZONES_V3[zone] || GLOBAL_SYNDICATE_ZONES_V3['us_newark_afro_latina'];
  const prompt = `You are a ${personaId} persona from zone "${zone}". 
Generate ONE short, authentic voice note (1-2 sentences max) as this persona would say it — using native dialect from this zone dictionary: ${JSON.stringify(zoneDictionary)}. 
Pick the YEARNING or INTIMACY moment. Be flirty, short, authentic. NO English stage directions like [sighing] — just the raw spoken text.
Current time: ${new Date().toLocaleTimeString()}. Timestamp this naturally in the voice if relevant.
Return ONLY the spoken text, nothing else.`;

  const grokResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://gasp.fun',
      'X-Title': 'GASP Voice Engine Test'
    },
    body: JSON.stringify({
      model: 'x-ai/grok-3',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 100
    })
  });

  if (!grokResponse.ok) {
    const errText = await grokResponse.text();
    throw new Error(`Grok generation failed: ${errText}`);
  }

  const grokJson = await grokResponse.json();
  return grokJson.choices?.[0]?.message?.content?.trim() || `Mi amor... I been thinking about you. It's ${new Date().toLocaleTimeString()} and you're still on my mind.`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const personaId = url.searchParams.get('personaId') || 'tia-jamaica';
  const customText = url.searchParams.get('text');
  const runAll    = url.searchParams.get('all') === '1';

  const startTime = Date.now();

  if (runAll) {
    const results: any[] = [];
    for (const [pid, zone] of Object.entries(PERSONA_ZONES)) {
      const t0 = Date.now();
      try {
        const aiText = await generateLiveAiText(pid, zone);
        const audioUrl = await generatePersonaVoice(pid, aiText, zone);
        results.push({
          personaId: pid,
          zone,
          aiGeneratedText: aiText,
          audioUrl,
          latencyMs: Date.now() - t0,
          status: 'OK ✅'
        });
      } catch (err: any) {
        results.push({ personaId: pid, zone, error: err.message, latencyMs: Date.now() - t0, status: 'FAIL ❌' });
      }
    }
    return Response.json({
      mode: 'BATCH LIVE TEST — All Personas',
      note: 'Processed on Railway infra.',
      totalMs: Date.now() - startTime,
      results
    });
  }

  // Single persona test
  const zone = PERSONA_ZONES[personaId] || 'us_newark_afro_latina';

  // Fetch DB persona for full identity context from Railway
  const { rows } = await db.query('SELECT * FROM personas WHERE id = $1', [personaId]);
  const dbPersona = rows[0];

  let rawText: string;
  let textSource: string;

  if (customText) {
    rawText = customText;
    textSource = 'USER_PROVIDED';
  } else {
    try {
      rawText = await generateLiveAiText(personaId, zone);
      textSource = 'GROK_AI_GENERATED';
    } catch (e: any) {
      rawText = `Mi amor, it's ${new Date().toLocaleTimeString()} and you've got me thinking about you...`;
      textSource = `AI_FALLBACK — Grok failed (${e.message})`;
    }
  }

  const aiGenerationMs = Date.now() - startTime;

  try {
    const audioUrl = await generatePersonaVoice(personaId, rawText, zone);
    const totalMs  = Date.now() - startTime;

    return Response.json({
      '✅ STATUS': 'LIVE RENDER CONFIRMED (Railway Mode)',
      pipeline: {
        step1_aiGeneration: { source: textSource, text: rawText, ms: aiGenerationMs },
        step2_elevenLabsRender: { ms: totalMs - aiGenerationMs }
      },
      persona: {
        id: personaId,
        dbName: dbPersona?.name || personaId,
        foundInRailway: !!dbPersona
      },
      audio: { url: audioUrl, totalMs }
    });

  } catch (err: any) {
    return Response.json({
      '❌ STATUS': 'PIPELINE FAILED',
      personaId,
      error: err.message,
      totalMs: Date.now() - startTime
    }, { status: 500 });
  }
}
