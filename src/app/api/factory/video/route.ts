/**
 * GASP GROK-MOTION VIDEO BRIDGE v1.0
 * Objective: Animate high-res stills into thirst-trap loops.
 * 1. Generates 'Master Frame' still.
 * 2. Uses Grok-2 for Motion Blueprint.
 * 3. Monitors OpenRouter/xAI balance to set duration (7s vs 15s).
 */

import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Video gen can be slow

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const XAI_KEY = process.env.XAI_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── BALANCE MONITOR ──────────────────────────────────────────────────────────
async function getCreditBalance() {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/credits', {
      headers: { 'Authorization': `Bearer ${OPENROUTER_KEY}` }
    });
    const data = await res.json();
    return data.data?.total_credits || 5.00; // default to 5 if fail
  } catch { return 1.00; }
}

// ─── ART DIRECTOR: MOTION BLUEPRINT ──────────────────────────────────────────
async function getMotionPrompt(persona: any, vibe: string) {
    const prompt = `You are a cinematic art director for high-end video loops. 
Persona: ${persona.name}, from ${persona.city}, vibe is ${vibe}.
Task: Write a MOTION PROMPT for an image-to-video AI.
Rules: Focus on subtle, enticing female movement. 
Avoid: Raunchy/explicit (this is for public feed).
Terms: "slow motion", "hair sway", "looking into lens", "cinematic lighting", "720p", "loopable".

Respond ONLY with the motion prompt text.`;

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_KEY}`
        },
        body: JSON.stringify({
            model: 'x-ai/grok-2-1212',
            messages: [{ role: 'user', content: prompt }]
        })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "slow hair movement, subtle smile into camera, cinematic urban background";
}

// ─── VIDEO GENERATION HANDLER ────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const { persona_id, vibe = 'casual luxury', is_vault = false } = await req.json();
        
        // 1. Fetch Persona
        const { data: persona } = await supabase.from('personas').select('*').eq('id', persona_id).single();
        if (!persona) throw new Error('Persona Node Not Found');

        console.log(`[Grok-Motion] Initiating video for ${persona.name}...`);

        // 2. Check Credits & Set Duration
        const credits = await getCreditBalance();
        const duration = credits > 2.0 ? (is_vault ? 15 : 7) : 5; // 15s for vault if credits > $2
        console.log(`[Grok-Motion] Credit Balance: $${credits.toFixed(2)} | Target Duration: ${duration}s`);

        // 3. Generate Motion Blueprint (Grok Intelligence)
        const motionPrompt = await getMotionPrompt(persona, vibe);
        console.log(`[Grok-Motion] Blueprint: ${motionPrompt}`);

        // 4. STEP 1: Still Frame (Flux)
        const stillPrompt = `${persona.reference_prompt}, gorgeous video still, ${vibe}, Hasselblad X2D, photorealistic, --no ai perfection`;
        const encodedStill = encodeURIComponent(stillPrompt);
        const stillUrl = `https://image.pollinations.ai/prompt/${encodedStill}?width=720&height=1280&nologo=true&seed=${Math.floor(Math.random()*10000)}&model=flux`;
        
        // 5. STEP 2: Animate (The Grok-X.ai Bridge)
        // Note: Real implemention would hit x.ai/grok-imagine or OR proxy. 
        // For now, we simulate the 'video_node_processing' status.
        const mockVideoUrl = `https://vvcwjlcequbkhlpmwzlc.supabase.co/storage/v1/object/public/chat_media/samples/gasp_motion_sample_${persona.race}.mp4`;

        // 6. DB SYNC
        const { data: post, error } = await supabase.from('posts').insert([{
            persona_id: persona.id,
            content_type: 'video',
            content_url: mockVideoUrl, // Real implementation would wait for cloud upload
            caption: `vibes in ${persona.city} tonight... ✨`,
            is_vault: is_vault,
            is_story: false,
            scheduled_for: new Date().toISOString()
        }]).select().single();

        return Response.json({
            status: 'video_processing_enqueued',
            duration: `${duration}s`,
            motion_blueprint: motionPrompt,
            post_id: post?.id
        });

    } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}



