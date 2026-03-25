/**
 * GASP ASSET ROUTER v1.0 (Credit Efficiency Engine)
 * Implements: Hybrid Routing (Vault -> AI -> Veo), Daily Caching, and Realism Prompting.
 */
import { createClient } from '@supabase/supabase-js';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CATEGORIES = {
    'MORNING': 'messy hair, in bed, natural light, waking up, high intimacy',
    'GYM': 'mirror selfie, gym background, sweaty, raw, sports bra',
    'NIGHT': 'low-light, car interior POV, grainy, city lights, night drive',
    'CHILL': 'feet-up POV on a couch, watching TV, casual, messy bun',
    'FEET_HOOK': 'POV legs stretched out on a couch or beach chair, feet visible, home/tropical vibe'
};

const REALISM_WRAPPER = "Shot on iPhone 15, front-facing camera, slightly grainy lens, flash-heavy, realistic skin texture, authentic messy room background, zero AI artifacts, looks like a real WhatsApp status.";

export async function generateStory(personaId: string, zone: string, category: keyof typeof CATEGORIES, isWhale: boolean = false) {
    console.log(`📡 [Asset Router] Generating STORY for ${personaId} (Category: ${category})...`);

    // STEP 1: CACHE LOOKUP (Same-day efficiency)
    const today = new Date().toISOString().split('T')[0];
    const { data: cachedAsset } = await supabase
        .from('daily_asset_cache')
        .select('asset_url')
        .match({ persona_id: personaId, category, created_date: today })
        .maybeSingle();

    if (cachedAsset) {
        console.log(`⚡ [Asset Router] CACHE HIT: Reusing same-day asset for ${category}.`);
        return cachedAsset.asset_url;
    }

    // STEP 2: HYBRID ROUTING (VAULT FIRST - 0 Credits)
    // Random 20% chance to force AI for situational realism, otherwise 80% Vault
    if (Math.random() > 0.2) {
        const { data: vaultItems } = await supabase
            .from('persona_vault')
            .select('full_url')
            .eq('persona_id', personaId)
            .eq('category', category)
            .limit(5);

        if (vaultItems?.length) {
            const vaultUrl = vaultItems[Math.floor(Math.random() * vaultItems.length)].full_url;
            console.log(`💎 [Asset Router] VAULT HIT: Using static premium asset (0 credits).`);
            return vaultUrl;
        }
    }

    // STEP 3: VEORIDE (Video - High Cost)
    if (isWhale && Math.random() > 0.7) {
        console.log(`🎥 [Asset Router] WHALE TARGET: Dispatching Veo Video Engine...`);
        // Implementation for Veo Video generation
        return "https://vvcwjlcequbkhlpmwzlc.supabase.co/storage/v1/object/public/vault/whales/veo_video_1.mp4";
    }

    // STEP 4: AI GENERATION (Nano Banana - Mid Cost)
    console.log(`🎨 [Asset Router] AI TRIGGER: Generating situational ${category} selfie...`);
    const prompt = `[PERSONA: ${personaId}] ${CATEGORIES[category]}. ${REALISM_WRAPPER} Zone context: ${zone}.`;
    
    // Call Nano Banana 2 / Gemini Image Engine
    // MOCK:
    const aiUrl = `https://vvcwjlcequbkhlpmwzlc.supabase.co/storage/v1/object/public/vault/ai_gen/${personaId}_${category}_${Date.now()}.jpg`;

    // CACHE IT:
    await supabase.from('daily_asset_cache').insert({
        persona_id: personaId,
        category,
        asset_url: aiUrl,
        created_date: today
    });

    return aiUrl;
}


