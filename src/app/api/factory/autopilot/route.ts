import { db } from '@/lib/db';
import { BraveSearch } from '@/lib/tools/braveSearch';
import { CONTENT_ROTATION } from '../studio/route';
import { visionPolishCaption } from '@/lib/visionPolisher';
const { BADDIE_BODY_TYPES, HYPER_REALISTIC_OVERLAY, getTechnicalOptics, getRandomPhotoshootEdit } = require('@/config/vision');

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const GOOGLE_GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const BRAVE_KEY = process.env.BRAVE_API_KEY || '';
const brave = new BraveSearch(BRAVE_KEY);

// Default autopilot settings
const DEFAULTS = {
  enabled: false,
  posts_per_run: 3,
  include_stories: true,
  include_vault: true,
  rotation_index: 0,
};

// ─── FASHION TREND FETCH ──────────────────────────────────────────────────────
const FASHION_QUERIES = [
  'womens street style trending outfits 2026',
  'sexy club outfit women trending spring 2026',
  'high fashion editorial look women 2026',
  'gym activewear women 2026 trending set',
  'luxury casual fashion women 2026',
];

// ─── SLANG DICTIONARY ────────────────────────────────────────────────────────
const SLANG_MAP: Record<string, string> = {
  'Santiago':      "Dominican slang: 'klk', 'mor', 'ta to'. lowercase.",
  'Medellin':      "Colombian paisa: 'parce', 'bacano'. lowercase.",
  'Santo Domingo': "Dominican slang: 'tiguere', 'klk'. lowercase.",
  'Tulum':         "Mexican: 'wey', 'chido'. lowercase.",
  'Buenos Aires':  "Argentine: 'che', 'copado'. lowercase.",
  'Rio':           "Brazilian portuguese: 'oi', 'gente'. lowercase.",
};

async function getFashionTrend(): Promise<string> {
  try {
    const q = FASHION_QUERIES[Math.floor(Math.random() * FASHION_QUERIES.length)];
    const res = await brave.searchWeb(q);
    return res?.[0]?.description?.split(' ').slice(0, 8).join(' ') || '';
  } catch { return ''; }
}

// ─── CAPTION ENGINE ─────────────────────────────────────────────────────────
async function makeCaption(persona: any, isVault: boolean, shotType: string, isStory: boolean): Promise<string> {
  const slang = SLANG_MAP[persona.city] || 'casual, lowercase.';

  let prompt: string;
  if (isStory) {
    prompt = `You are ${persona.name}, ${persona.age}yo from ${persona.city}. Write a story caption (Instagram Stories style). ${slang} Max 8 words. Engagement bait.`;
  } else if (isVault) {
    prompt = `You are ${persona.name}, ${persona.age}yo from ${persona.city}. Write a vault teaser. ${slang} Max 12 words.`;
  } else {
    prompt = `You are ${persona.name}, ${persona.age}yo from ${persona.city}. Write ONE real social media post. ${slang} Max 15 words.`;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 60, temperature: 1.1 } })
      }
    );
    if (res.ok) {
      const d = await res.json();
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text.toLowerCase().replace(/[\"*]/g, '');
    }
  } catch {}
  return `${isVault ? 'só pra quem sabe... 🔒' : 'the vibe is different tonight ngl'}`;
}

// ─── IMAGE ENGINE ─────────────────────────────────────────────────────────────
async function makeImage(persona: any, shotType: string, fashionTrend: string, isVault: boolean): Promise<string | null> {
  const rotation = CONTENT_ROTATION.find(r => r.type === shotType);
  const shotDir = rotation?.shotDir || 'candid lifestyle photo, natural light';
  const cityMap: Record<string, string> = {
    'Santiago': 'Santiago de los Caballeros DR, golden hour',
    'Medellin': 'El Poblado Medellin Colombia, city lights',
    'Santo Domingo': 'malecon Santo Domingo, tropical evening',
    'Tulum': 'Tulum Mexico, jungle luxury',
    'Buenos Aires': 'Recoleta Buenos Aires, golden hour',
    'Rio': 'Ipanema Rio de Janeiro, beach'
  };
  const setting = cityMap[persona.city] || `${persona.city} urban`;
  const fashion = fashionTrend || 'trendy, stylish, perfectly dressed';
  const refDNA = persona.reference_prompt || `attractive ${persona.race || 'latina'} woman, ${persona.age || 23} years old`;
  
  const bodyStyle = BADDIE_BODY_TYPES[persona.body_type] || BADDIE_BODY_TYPES.SLIM_THICK;
  const optics = isVault || shotType === 'editorial' ? getRandomPhotoshootEdit() : getTechnicalOptics();
  const promptText = `${refDNA}, ${persona.name}. ${fashion}. ${bodyStyle.prompt}. ${optics}. ${shotDir}. ${setting}. ${HYPER_REALISTIC_OVERLAY}. Photorealistic.`;
  
  // 🛡️ SOVEREIGN TELEMETRY: Log Autopilot Generation Strike
  await db.query(`
    INSERT INTO neural_telemetry (event_type, persona_id, user_id, vibe_at_time, metadata, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
  `, ['autopilot_gen', persona.id, 'autopilot_engine', persona.vibe || 'social', {
        body_type: persona.body_type || 'SLIM_THICK',
        is_vault: isVault,
        prompt: promptText
    }]);

  // Use the new R2 asset bridge paths
  const publicUrl = `https://asset.gasp.fun/posts/auto/${persona.id}/auto_${Date.now()}_${shotType}.jpg`;
  return publicUrl;
}

// ─── AI DIRECTOR ─────────────────────────────────────────────────────────────
async function getDirectorDecision(
  persona: any,
  recentPosts: any[],
  fashionTrend: string
): Promise<any> {
  const feedPosts = recentPosts.filter(p => !p.is_vault);
  const lastPostAge = recentPosts[0]
    ? Math.floor((Date.now() - new Date(recentPosts[0].created_at).getTime()) / 60000)
    : 999;

  const shotType = feedPosts.length % 5 === 0 ? 'editorial' : 'casual_selfie';
  
  return {
    shotType,
    postToFeed: lastPostAge > 120,
    postToVault: true,
    postStory: true,
    captionTone: 'real_girl',
    reason: 'Sovereign Director: Automated sequence'
  };
}

// ─── GET SETTINGS ─────────────────────────────────────────────────────────────
export async function GET() {
  const { rows } = await db.query("SELECT value FROM factory_settings WHERE key = 'autopilot' LIMIT 1");
  return Response.json(rows[0]?.value || DEFAULTS);
}

// ─── SAVE SETTINGS ────────────────────────────────────────────────────────────
export async function PUT(req: Request) {
  const settings = await req.json();
  await db.query(`
    INSERT INTO factory_settings (key, value, updated_at)
    VALUES ('autopilot', $1, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `, [settings]);
  return Response.json({ status: 'saved', settings });
}

// ─── TRIGGER ONE RUN ─────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const logs: string[] = [];
    const log = (msg: string) => { logs.push(msg); console.log(`[Autopilot] ${msg}`); };

    // Get all active personas from Railway
    const { rows: personas } = await db.query('SELECT * FROM personas WHERE is_active = true LIMIT 20');
    if (!personas || personas.length === 0) {
      return Response.json({ status: 'no_personas', logs: ['No active personas found'] });
    }

    log(`Run starting. ${personas.length} personas.`);
    const fashionTrend = await getFashionTrend();
    const results: any[] = [];

    for (const persona of personas) {
      const { rows: recentPosts } = await db.query(
        'SELECT * FROM posts WHERE persona_id = $1 ORDER BY created_at DESC LIMIT 10',
        [persona.id]
      );

      const decision = await getDirectorDecision(persona, recentPosts || [], fashionTrend);
      
      // ── FEED POST ──────────────────────────────────────────────
      if (decision.postToFeed) {
        const imageUrl = await makeImage(persona, decision.shotType, fashionTrend, false);
        if (imageUrl) {
          const caption = await visionPolishCaption(imageUrl, {
            name: persona.name, age: persona.age, city: persona.city, vibe: persona.vibe || 'sexy',
            slang_instructions: SLANG_MAP[persona.city]
          }, false);

          await db.query(`
            INSERT INTO posts (persona_id, content_type, caption, content_url, is_vault, shot_type, scheduled_for, created_at)
            VALUES ($1, 'image', $2, $3, false, $4, NOW(), NOW())
          `, [persona.id, caption, imageUrl, decision.shotType]);
          
          log(`✅ ${persona.name} feed post live`);
          results.push({ persona: persona.name, type: 'feed' });
        }
      }

      // ── STORY ─────────────────────────────────────────────────
      if (decision.postStory) {
        const storyCaption = await makeCaption(persona, false, decision.shotType, true);
        await db.query(`
          INSERT INTO posts (persona_id, content_type, caption, is_vault, is_story, scheduled_for, created_at)
          VALUES ($1, 'text', $2, false, true, NOW(), NOW())
        `, [persona.id, storyCaption]);
        log(`📡 ${persona.name} story live`);
      }

      // ── VAULT ─────────────────────────────────────────────────
      if (decision.postToVault) {
        const vaultImg = await makeImage(persona, 'vault', fashionTrend, true);
        if (vaultImg) {
          const vaultCaption = await visionPolishCaption(vaultImg, {
            name: persona.name, age: persona.age, city: persona.city, vibe: persona.vibe,
            slang_instructions: SLANG_MAP[persona.city]
          }, true);

          await db.query(`
            INSERT INTO posts (persona_id, content_type, caption, content_url, is_vault, shot_type, interaction_seeds, scheduled_for, created_at)
            VALUES ($1, 'image', $2, $3, true, 'vault', $4, NOW(), NOW())
          `, [persona.id, vaultCaption, vaultImg, JSON.stringify([{ price: 150 }])]);
          log(`🔒 ${persona.name} vault item locked`);
        }
      }
    }

    return Response.json({ status: 'done', results, logs });

  } catch (err: any) {
    console.error('[Autopilot] Fatal:', err);
    return Response.json({ status: 'error', message: err.message }, { status: 500 });
  }
}



