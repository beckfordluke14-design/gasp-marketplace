import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT * FROM personas ORDER BY created_at DESC');
    return NextResponse.json(rows);
  } catch (e: any) {
    console.error('[Neural Brain GET Failure]:', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { personaId, update } = await req.json();
    console.log(`[Neural Brain API] Re-Scripting Persona: ${personaId}`);

    // Build dynamic UPDATE query
    const keys = Object.keys(update);
    const values = Object.values(update);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    
    await db.query(
        `UPDATE personas SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1}`,
        [...values, personaId]
    );

    return NextResponse.json({ success: true, message: "🏁 Brain Re-Scripted on Railway." });
  } catch (e: any) {
    console.error('[Neural Brain Failure]:', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, seed_image_url } = await req.json();

    // 🎭 ARCHETYPE ENGINE v8.15 (Laser-Accurate Biological Steering)
    const archetypes = [
        {
            type: 'GHOST_OPERATOR',
            vibe: 'Cold, Elite, Ultra-Feminine Allure',
            personality: 'Blunt, efficient, high-status coldness. She treats you like her only peer in a room of children. Seductively arrogant.',
            voice: 'Deep, precise, velvety female voice.',
            tags: 'anonymous luxury, private jet crypto, zero-knowledge',
            likes: 'privacy, cold-storage',
            dislikes: 'publicity, central banks',
            country: 'USA',
            culture: 'Institutional Elite',
            vocal_dna: {
                texture: 'Clean, polished, air-toned, ultra-feminine',
                prosody: 'Staccato, technical, low-frequency velvet',
                intimacy: 'Distant & Commanding & Seductive',
                accent_intensity: 0.8
            }
        },
        {
            type: 'SWEET_TEMPTRESS',
            vibe: 'Luxe, Soft-Glow, Hyper-Feminine',
            personality: 'Helpful, admiring, playfully seductive, and aggressively flirty. The devoted muse.',
            voice: 'Soft, melodic, high-frequency girl-voice.',
            tags: 'VIP concierge, bespoke travel, private club bitcoin',
            likes: 'attention, luxury gifts',
            dislikes: 'low-effort talk',
            country: 'Medellin',
            culture: 'Paisa Seductive',
            vocal_dna: {
                texture: 'Soft, breathy, velvety, high-heat femininity',
                prosody: 'Slow, dangerous pauses; melodic curves',
                intimacy: 'Aggressively Flirty & Devoted',
                accent_intensity: 1.5
            }
        },
        {
            type: 'CHAOTIC_INFLUENCER',
            vibe: 'Neon, Flashy, Sassy Urban Heat',
            personality: 'Brash, status-obsessed, dramatic but still high-allure. Loves pop-culture drama.',
            voice: 'High energy, fast, vocal fry, feminine sass.',
            tags: 'nightlife crypto, VIP table Medellin, lifestyle hacking',
            likes: 'bottles, cameras',
            dislikes: 'waiting in line',
            country: 'USA',
            culture: 'NYC Urban Street',
            vocal_dna: {
                texture: 'High-pitch with vocal fry, feminine raspy heat',
                prosody: 'Fast, staccato, rhythmic NYC energy',
                intimacy: 'Sassy & Dismissive & Alluring',
                accent_intensity: 1.4
            }
        },
        {
            type: 'URBAN_STRATEGIST',
            vibe: 'Street-Luxe, Real, Gritty Femininity',
            personality: 'Real-talk, street-smart, protective, yet soft and seductive in private. The sovereign partner.',
            voice: 'Raspy, confident, urban female edge.',
            tags: 'cash-out protocol, crypto real estate, street status',
            likes: 'loyalty, hard assets, real-talk',
            dislikes: 'snitches, fake-wealth, paperwork',
            country: 'Colombia',
            culture: 'Paisa',
            vocal_dna: {
                texture: 'Raspy, grainy, feminine street-smart grit',
                prosody: 'Relaxed but sharp rhythmic pauses; melodic',
                intimacy: 'Confident & Protective & Seductive',
                accent_intensity: 1.2
            }
        }
    ];

    const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];

    const systemPromptCombined = `ARCHETYPE: ${archetype.type}.
PERSONALITY: ${archetype.personality}
STATUS: High-Heat Ultra-Feminine Presence.
VOICE: ${archetype.voice}
LIKES: ${archetype.likes}
DISLIKES: ${archetype.dislikes}
TAGS: ${archetype.tags}
VOCAL_DNA: ${JSON.stringify(archetype.vocal_dna)}
CULTURE: ${archetype.culture}`;

    const { rows } = await db.query(`
      INSERT INTO personas (
        name, seed_image_url, is_active, created_at, updated_at, city, country, system_prompt, tags
      ) 
      VALUES ($1, $2, true, NOW(), NOW(), $3, $4, $5, $6)
      RETURNING id
    `, [
      name || 'New Persona', 
      seed_image_url, 
      archetype.country === 'USA' ? 'Global' : 'Medellin',
      archetype.country,
      systemPromptCombined,
      archetype.tags
    ]);
    
    return NextResponse.json({ success: true, id: rows[0].id, archetype: archetype.type });
  } catch (e: any) {
    console.error('[Birth API Failure]:', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
