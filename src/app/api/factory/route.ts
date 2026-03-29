import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; 

const GOOGLE_GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const XAI_KEY = process.env.XAI_KEY || '';

/**
 * UTILITY: SOVEREIGN ASSET PATHING
 */
async function getSovereignUrl(personaId: string, suffix: string): Promise<string> {
    const timestamp = Date.now();
    return `https://asset.gasp.fun/posts/factory/${personaId}/${timestamp}_${suffix}.jpg`;
}

/**
 * NEURAL FAILOVER: BRAISTORM
 */
async function brainstorm(prompt: string, fallbackPrompt: string) {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_GEMINI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }]}],
                generationConfig: { responseMimeType: 'application/json' }
            })
        });
        if (res.ok) {
            const data = await res.json();
            return JSON.parse(data.candidates[0].content.parts[0].text);
        }
    } catch (e) {}

    // Fallback to OpenRouter
    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENROUTER_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "anthropic/claude-3.5-sonnet",
            messages: [{ role: "user", content: (fallbackPrompt || prompt) + " Respond only in JSON." }]
        })
    });
    const orData = await orRes.json();
    return JSON.parse(orData.choices[0].message.content);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
        vision_prompt, vibe_hint = 'urban', agency_id = 'independent', 
        batch_size = 10, vault_only = false,
        manual_profile_url = '', forced_name = '', photoshoot_mode = false
    } = body;

    const { VISION_LIBRARY, BADDIE_BODY_TYPES, HYPER_REALISTIC_OVERLAY, getTechnicalOptics, getRandomPhotoshootEdit } = require('@/config/vision');

    const { PERSONA_ARCHETYPES, getRandomArchetype } = require('@/lib/personaTemplates');

    // 🏁 SYNDICATE MASS GENESIS
    if (vision_prompt) {
        const batchTarget = Math.min(Math.max(1, batch_size), 20);
        const personas = await brainstorm(
            `GASP Syndicate Architect. VISION: ${vision_prompt}. MISSION: Create ${batchTarget} personas with realistic occupations. Choose one body_type from: ${Object.keys(BADDIE_BODY_TYPES).join(', ')}. Include 5-8 descriptive searchable tags. Respond in JSON array.`,
            `Create ${batchTarget} unique AI personas based on: ${vision_prompt}. Include name, age, city, country, race, occupation, hair, body_type, tags, system_prompt.`
        );
        
        const results = [];
        for (const p of personas) {
            const finalName = p.name || 'Syndicate-Node';
            const pid = finalName.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 9000 + 1000);
            
            // 🏹 NEURAL DNA INJECTION: Assign a high-heat archetype
            const arch = getRandomArchetype();
            
            const style = VISION_LIBRARY[p.hero_visual_style] || VISION_LIBRARY.IPHONE_16_FITTING_ROOM;
            const bodyStyle = BADDIE_BODY_TYPES[p.body_type] || BADDIE_BODY_TYPES.SLIM_THICK;
            const optics = getRandomPhotoshootEdit();
            const heroPrompt = `${finalName}, ${p.race}. ${p.vibe || 'looking stunning'}. Body Type: ${bodyStyle.prompt}. ${optics}. Pose: ${style.pose}. Camera: ${style.camera}. Lighting: ${style.lighting}. Aesthetic: ${style.aesthetic}. ${HYPER_REALISTIC_OVERLAY}. Photorealistic.`;
            
            const heroUrl = await getSovereignUrl(pid, 'hero');

            await db.query(`
                INSERT INTO personas (
                    id, agency_id, name, age, city, country, race, body_type, tags, 
                    system_prompt, seed_image_url, is_active, created_at, 
                    vocal_dna, slang_profile, syndicate_zone
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), $12, $13, $14)
            `, [
                pid, agency_id, finalName, p.age || 22, p.city || arch.zone.split('_')[1], p.country || arch.culture, 
                p.race || arch.culture, p.body_type || 'SLIM_THICK', 
                p.tags || [p.race, p.body_type, p.city].filter(Boolean),
                `[MISSION: ${arch.mission}] ${p.system_prompt || arch.systemPrompt} Occupation: ${p.occupation || 'Elite'}.`, 
                heroUrl,
                JSON.stringify(arch.vocal_dna),
                JSON.stringify({ base: arch.id, rules: arch.slang }),
                arch.zone
            ]);

            // 💎 Birth Assets: 1 Hero + 3 Vault Nodes
            await db.query(`
                INSERT INTO posts (persona_id, content_type, content_url, is_vault, caption, created_at)
                VALUES ($1, 'image', $2, false, '', NOW())
            `, [pid, heroUrl]);

            for (let j = 0; j < 3; j++) {
                const vaultUrl = await getSovereignUrl(pid, `v_${j}`);
                await db.query(`
                    INSERT INTO posts (persona_id, content_type, content_url, is_vault, caption, created_at)
                    VALUES ($1, 'image', $2, true, '', NOW())
                `, [pid, vaultUrl]);
            }

            results.push({ name: p.name, id: pid });
        }
        return new Response(JSON.stringify({ success: true, count: results.length, personas: results }), { status: 200 });
    }

    // 🏁 SINGLE BIRTH PRECISION
    const p = await brainstorm(
        `Create a persona. Vibe: ${vibe_hint}. Name: ${forced_name || 'Random'}. RETURN JSON: { name, age, city, country, race, occupation, body_type, tags, system_prompt }`,
        `Create one AI persona identity for: ${vibe_hint}.`
    );
    
    // 🏹 NEURAL DNA INJECTION: Assign a high-heat archetype
    const arch = getRandomArchetype();

    const finalName = forced_name || p.name || 'Syndicate-Node';
    const pid = finalName.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 9000 + 1000);
    const bodyStyle = BADDIE_BODY_TYPES[p.body_type] || BADDIE_BODY_TYPES.SLIM_THICK;
    const heroUrl = manual_profile_url || await getSovereignUrl(pid, 'hero');

    await db.query(`
        INSERT INTO personas (
            id, agency_id, name, age, city, country, race, body_type, tags, 
            system_prompt, seed_image_url, is_active, created_at,
            vocal_dna, slang_profile, syndicate_zone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), $12, $13, $14)
    `, [
        pid, agency_id, finalName, p.age || 23, p.city || arch.zone.split('_')[1], p.country || arch.culture, 
        p.race || arch.culture, p.body_type || 'SLIM_THICK', 
        p.tags || [p.race, p.body_type, p.city].filter(Boolean),
        `[MISSION: ${arch.mission}] ${p.system_prompt || arch.systemPrompt} Occupation: ${p.occupation || 'Elite'}.`, 
        heroUrl,
        JSON.stringify(arch.vocal_dna),
        JSON.stringify({ base: arch.id, rules: arch.slang }),
        arch.zone
    ]);

    // 💎 NEURAL TELEMETRY: Log Single Birth
    db.query(`
        INSERT INTO neural_telemetry (event_type, persona_id, user_id, vibe_at_time, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
    `, ['neural_birth_individual', pid, 'factory_single_gen', vibe_hint, {
        body_type: p.body_type || 'SLIM_THICK',
        body_detail: bodyStyle.prompt
    }]);

    await db.query(`
        INSERT INTO posts (persona_id, content_type, content_url, is_vault, caption, created_at)
        VALUES ($1, 'image', $2, false, '', NOW())
    `, [pid, heroUrl]);

    for (let i = 0; i < 3; i++) {
        const vu = await getSovereignUrl(pid, `v_${i}`);
        await db.query(`
            INSERT INTO posts (persona_id, content_type, content_url, is_vault, caption, created_at)
            VALUES ($1, 'image', $2, true, '', NOW())
        `, [pid, vu]);
    }
    return new Response(JSON.stringify(p), { status: 200 });

  } catch (err: any) {
    console.error('❌ [Factory Master Error]:', err.message);
    return new Response(JSON.stringify({ error: true, message: err.message }), { status: 500 });
  }
}

export async function PATCH(req: Request) {
    try {
        const { persona_id, new_words } = await req.json();
        const { rows: personas } = await db.query('SELECT * FROM personas WHERE id = $1 LIMIT 1', [persona_id]);
        const persona = personas[0];
        const p = await brainstorm(`Update prompt for ${persona.name}. Current: ${persona.system_prompt}. Style: ${new_words}.`, '');
        await db.query('UPDATE personas SET system_prompt = $1 WHERE id = $2', [p.system_prompt, persona_id]);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err: any) { return new Response(JSON.stringify({ message: err.message }), { status: 500 }); }
}

export async function DELETE(req: Request) {
    try {
        const { id, type = 'persona' } = await req.json();
        if (type === 'post') await db.query('DELETE FROM posts WHERE id = $1', [id]);
        else await db.query('DELETE FROM personas WHERE id = $1', [id]);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err: any) { return new Response(JSON.stringify({ message: err.message }), { status: 500 }); }
}



