import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; 

const GOOGLE_GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const XAI_KEY = process.env.XAI_KEY || '';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * UTILITY: PERMANENT ASSET INGESTION
 */
async function downloadAndUpload(url: string, personaId: string, suffix: string): Promise<string | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        const path = `personas/${personaId}/${Date.now()}_${suffix}.jpg`;
        const { error } = await supabase.storage.from('chat_media').upload(path, buf, { contentType: 'image/jpeg', upsert: true });
        if (error) return null;
        const { data: { publicUrl } } = supabase.storage.from('chat_media').getPublicUrl(path);
        return publicUrl;
    } catch { return null; }
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
        batch_size = 10, vault_only = false, video_mode = 'none',
        manual_profile_url = '', forced_name = '', photoshoot_mode = false
    } = body;

    const { SYNDICATE_DNA, VISION_LIBRARY, BADDIE_BODY_TYPES, HYPER_REALISTIC_OVERLAY, getTechnicalOptics, getRandomPhotoshootEdit } = require('@/config/vision');

    // 🏁 SYNDICATE MASS GENESIS
    if (vision_prompt) {
        const batchTarget = Math.min(Math.max(1, batch_size), 20);
        const personas = await brainstorm(
            `GASP Syndicate Architect. VISION: ${vision_prompt}. MISSION: Create ${batchTarget} personas with realistic occupations. Choose one body_type from: ${Object.keys(BADDIE_BODY_TYPES).join(', ')}. Respond in JSON array.`,
            `Create ${batchTarget} unique AI personas based on: ${vision_prompt}. Include name, age, city, country, race, occupation, hair, body_type, system_prompt, hero_visual_style.`
        );
        
        const results = [];
        for (const p of personas) {
            // 🧬 NEURAL DEFENSE: Zero-Crash Name Validation
            const finalName = p.name || 'Syndicate-Node';
            const pid = finalName.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 9000 + 1000);
            
            const style = VISION_LIBRARY[p.hero_visual_style] || VISION_LIBRARY.IPHONE_16_FITTING_ROOM;
            const bodyStyle = BADDIE_BODY_TYPES[p.body_type] || BADDIE_BODY_TYPES.SLIM_THICK;
            const optics = getRandomPhotoshootEdit(); // Hero ads get the Photoshoot treatment
            const heroPrompt = `${finalName}, ${p.race}. ${p.vibe}. Body Type: ${bodyStyle.prompt}. ${optics}. Pose: ${style.pose}. Camera: ${style.camera}. Lighting: ${style.lighting}. Aesthetic: ${style.aesthetic}. ${HYPER_REALISTIC_OVERLAY}. Instagram Vertical Portrait, super realism. 8k Raw photo.`;
            
            let heroUrl = null;
            if (!vault_only) {
                const gr = await fetch('https://api.x.ai/v1/images/generations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${XAI_KEY}` },
                    body: JSON.stringify({ 
                        model: 'grok-imagine-image-pro', 
                        prompt: heroPrompt, 
                        n: 1, 
                        response_format: 'url',
                        aspect_ratio: '9:16' 
                    })
                });
                const gd = await gr.json();
                if (gd.data?.[0]?.url) heroUrl = await downloadAndUpload(gd.data[0].url, pid, 'hero');
                if (!heroUrl) heroUrl = await downloadAndUpload(`https://image.pollinations.ai/prompt/${encodeURIComponent(heroPrompt)}?nologo=true&width=1080&height=1920`, pid, 'hero_fb');
            }

            const { error: pErr } = await supabase.from('personas').upsert([{
                id: pid, agency_id, 
                name: finalName, 
                age: p.age || 22, 
                city: p.city || 'Miami', 
                country: p.country || 'USA', 
                race: p.race || 'Latina',
                body_type: p.body_type || 'SLIM_THICK',
                system_prompt: `${p.system_prompt || 'Syndicate node.'} Occupation: ${p.occupation || 'Elite'}.`,
                seed_image_url: heroUrl, 
                is_active: true
            }], { onConflict: 'id' });
            if (pErr) throw pErr;

            // 💎 NEURAL TELEMETRY: Log Birth Data
            supabase.from('neural_telemetry').insert([{
                event_type: 'neural_birth',
                persona_id: pid,
                user_id: 'factory_mass_gen',
                vibe_at_time: p.vibe,
                metadata: {
                    body_type: p.body_type || 'SLIM_THICK',
                    body_detail: bodyStyle.prompt,
                    prompt: heroPrompt
                }
            }]); // Fire and forget

            if (heroUrl && !vault_only) await supabase.from('posts').insert([{ persona_id: pid, content_type: 'image', content_url: heroUrl, is_vault: false, caption: '' }]);

            const vaultCats = ['VAULT_BACKVIEW_OILED', 'VAULT_CLEAVAGE_LACE', 'VAULT_WET_GLISTEN'];
            for (let i = 0; i < 3; i++) {
                const s = VISION_LIBRARY[vaultCats[i]];
                const isPhotoshoot = photoshoot_mode === true;
                const vo = isPhotoshoot ? getRandomPhotoshootEdit() : getTechnicalOptics();
                const personalVibe = !isPhotoshoot ? "iPhone mirror selfie, raw personal vibe, candid, suggestive thong bodysuit, backside focus, thick thighs emphasis, grainy mobile photo quality." : "";
                const vp = `${p.name}, ${p.race}. ${bodyStyle.prompt}. ${vo}. ${personalVibe} Pose: ${s.pose}. Camera: ${s.camera}. Lighting: ${s.lighting}. Aesthetic: ${s.aesthetic}. ${HYPER_REALISTIC_OVERLAY}. Instagram Vertical Portrait, super realism. 8k Raw photo.`;
                let vu = null;
                const vgr = await fetch('https://api.x.ai/v1/images/generations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${XAI_KEY}` },
                    body: JSON.stringify({ 
                        model: 'grok-imagine-image-pro', 
                        prompt: vp, 
                        n: 1, 
                        response_format: 'url',
                        aspect_ratio: '9:16'
                    })
                });
                const vgd = await vgr.json();
                if (vgd.data?.[0]?.url) vu = await downloadAndUpload(vgd.data[0].url, pid, `v_${i}`);
                if (!vu) vu = await downloadAndUpload(`https://image.pollinations.ai/prompt/${encodeURIComponent(vp)}?nologo=true&width=1080&height=1920`, pid, `vfb_${i}`);
                await supabase.from('posts').insert([{ persona_id: pid, content_type: 'image', content_url: vu, is_vault: true, caption: '' }]);
            }
            results.push({ name: p.name, id: pid });
        }
        return new Response(JSON.stringify({ success: true, count: results.length, personas: results }), { status: 200 });
    }

    // 🏁 SINGLE BIRTH PRECISION
    const p = await brainstorm(
        `Create a persona. Vibe: ${vibe_hint}. Name: ${forced_name || 'Random'}. Body Types: ${Object.keys(BADDIE_BODY_TYPES).join(', ')}. Return JSON: { name, age, city, country, race, occupation, body_type, system_prompt, intro_text, image_prompt }`,
        `Create one AI persona identity for: ${vibe_hint}`
    );
    
    // 🧬 NEURAL DEFENSE: Zero-Crash ID Generation
    const finalName = forced_name || p.name || 'Syndicate-Node';
    const pid = finalName.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 9000 + 1000);
    
    const style = VISION_LIBRARY.IPHONE_16_FITTING_ROOM;
    const bodyStyle = BADDIE_BODY_TYPES[p.body_type] || BADDIE_BODY_TYPES.SLIM_THICK;
    const optics = getRandomPhotoshootEdit();
    const heroPrompt = `${finalName}, ${p.race}. ${p.image_prompt}. Body Type: ${bodyStyle.prompt}. ${optics}. Pose: ${style.pose}. Camera: ${style.camera}. Lighting: ${style.lighting}. Aesthetic: ${style.aesthetic}. ${HYPER_REALISTIC_OVERLAY}. Instagram Vertical Portrait, super realism. 8k Raw photo.`;
    
    let heroUrl = manual_profile_url || null;
    if (!heroUrl) {
        const gr = await fetch('https://api.x.ai/v1/images/generations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${XAI_KEY}` },
            body: JSON.stringify({ 
                model: 'grok-imagine-image-pro', 
                prompt: heroPrompt, 
                n: 1, 
                response_format: 'url',
                aspect_ratio: '9:16'
            })
        });
        const gd = await gr.json();
        if (gd.data?.[0]?.url) heroUrl = await downloadAndUpload(gd.data[0].url, pid, 'hero');
    }
    if (!heroUrl) heroUrl = await downloadAndUpload(`https://image.pollinations.ai/prompt/${encodeURIComponent(heroPrompt)}?nologo=true&width=1080&height=1920`, pid, 'hero_fb');

    const { error: singleErr } = await supabase.from('personas').upsert([{
        id: pid, 
        agency_id, 
        name: finalName, 
        age: p.age || 23, 
        city: p.city || 'Miami', 
        country: p.country || 'USA', 
        race: p.race || 'Latina',
        body_type: p.body_type || 'SLIM_THICK',
        system_prompt: `${p.system_prompt || 'Syndicate node active.'} Occupation: ${p.occupation || 'Elite'}.`, 
        seed_image_url: heroUrl, 
        is_active: true
    }], { onConflict: 'id' });
    if (singleErr) throw singleErr;

    // 💎 NEURAL TELEMETRY: Log Single Birth
    supabase.from('neural_telemetry').insert([{
        event_type: 'neural_birth_individual',
        persona_id: pid,
        user_id: 'factory_single_gen',
        vibe_at_time: vibe_hint,
        metadata: {
            body_type: p.body_type || 'SLIM_THICK',
            body_detail: bodyStyle.prompt,
            prompt: heroPrompt
        }
    }]); // Fire and forget
    if (heroUrl) await supabase.from('posts').insert([{ persona_id: pid, content_type: 'image', content_url: heroUrl, is_vault: false, caption: '' }]);

    const vaultCats = ['VAULT_BACKVIEW_OILED', 'VAULT_CLEAVAGE_LACE', 'VAULT_WET_GLISTEN'];
    for (let i = 0; i < 3; i++) {
        const s = VISION_LIBRARY[vaultCats[i]];
        const isPhotoshoot = photoshoot_mode === true;
        const vo = isPhotoshoot ? getRandomPhotoshootEdit() : getTechnicalOptics();
        const personalVibe = !isPhotoshoot ? "iPhone mirror selfie, raw personal vibe, candid, suggestive thong bodysuit, backside focus, thick thighs emphasis, grainy mobile photo quality." : "";
        const vp = `${p.name}, ${p.race}. ${bodyStyle.prompt}. ${vo}. ${personalVibe} Pose: ${s.pose}. Camera: ${s.camera}. Lighting: ${s.lighting}. Aesthetic: ${s.aesthetic}. ${HYPER_REALISTIC_OVERLAY}. Instagram Vertical Portrait, super realism. 8k Raw photo.`;
        let vu = null;
        const vgr = await fetch('https://api.x.ai/v1/images/generations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${XAI_KEY}` },
            body: JSON.stringify({ 
                model: 'grok-imagine-image-pro', 
                prompt: vp, 
                n: 1, 
                response_format: 'url',
                aspect_ratio: '9:16'
            })
        });
        const vgd = await vgr.json();
        if (vgd.data?.[0]?.url) vu = await downloadAndUpload(vgd.data[0].url, pid, `v_${i}`);
        if (!vu) vu = await downloadAndUpload(`https://image.pollinations.ai/prompt/${encodeURIComponent(vp)}?nologo=true&width=1080&height=1920`, pid, `vfb_${i}`);
        await supabase.from('posts').insert([{ persona_id: pid, content_type: 'image', content_url: vu, is_vault: true, caption: '' }]);
    }
    return new Response(JSON.stringify(p), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: true, message: err.message }), { status: 500 });
  }
}

export async function PATCH(req: Request) {
    try {
        const { persona_id, new_words } = await req.json();
        const { data: persona } = await supabase.from('personas').select('*').eq('id', persona_id).single();
        const p = await brainstorm(`Update prompt for ${persona.name}. Current: ${persona.system_prompt}. Style: ${new_words}.`, '');
        await supabase.from('personas').update({ system_prompt: p.system_prompt }).eq('id', persona_id);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err: any) { return new Response(JSON.stringify({ message: err.message }), { status: 500 }); }
}

export async function DELETE(req: Request) {
    try {
        const { id, type = 'persona' } = await req.json();
        if (type === 'post') await supabase.from('posts').delete().eq('id', id);
        else await supabase.from('personas').delete().eq('id', id);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err: any) { return new Response(JSON.stringify({ message: err.message }), { status: 500 }); }
}



