import { db } from '@/lib/db';
import path from 'path';

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
    const { rows: cachedAssets } = await db.query(
        'SELECT asset_url FROM daily_asset_cache WHERE persona_id = $1 AND category = $2 AND created_date = $3 LIMIT 1',
        [personaId, category, today]
    );

    if (cachedAssets[0]) {
        console.log(`⚡ [Asset Router] CACHE HIT: Reusing same-day asset for ${category}.`);
        return cachedAssets[0].asset_url;
    }

    // STEP 2: HYBRID ROUTING (VAULT FIRST - 0 Credits)
    if (Math.random() > 0.2) {
        const { rows: vaultItems } = await db.query(
            'SELECT full_url as content_url FROM persona_vault WHERE persona_id = $1 AND category = $2 LIMIT 5',
            [personaId, category]
        );

        if (vaultItems?.length) {
            const vaultUrl = vaultItems[Math.floor(Math.random() * vaultItems.length)].content_url;
            console.log(`💎 [Asset Router] VAULT HIT: Using static premium asset (0 credits).`);
            return vaultUrl;
        }
    }

    // STEP 3: VEORIDE (Video - High Cost)
    if (isWhale && Math.random() > 0.7) {
        console.log(`🎥 [Asset Router] WHALE TARGET: Dispatching Veo Video Engine...`);
        return `https://asset.gasp.fun/posts/whales/veo_video_${Math.floor(Math.random() * 5)}.mp4`;
    }

    // STEP 4: AI GENERATION (Nano Banana - Mid Cost)
    console.log(`🎨 [Asset Router] AI TRIGGER: Generating situational ${category} selfie...`);
    
    // Call Nano Banana 2 / Gemini Image Engine (MOCK)
    const aiUrl = `https://asset.gasp.fun/posts/ai_gen/${personaId}_${category}_${Date.now()}.jpg`;

    // CACHE IT:
    await db.query(`
        INSERT INTO daily_asset_cache (persona_id, category, asset_url, created_date)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (persona_id, category, created_date) DO UPDATE SET asset_url = EXCLUDED.asset_url
    `, [personaId, category, aiUrl, today]);

    return aiUrl;
}


