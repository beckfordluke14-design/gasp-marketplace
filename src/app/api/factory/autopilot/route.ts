import { createClient } from '@supabase/supabase-js';
import { BraveSearch } from '@/lib/tools/braveSearch';
import { CONTENT_ROTATION } from '../studio/route';
import { visionPolishCaption } from '@/lib/visionPolisher';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GOOGLE_GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const BRAVE_KEY = process.env.BRAVE_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const brave = new BraveSearch(BRAVE_KEY);

// Default autopilot settings (user can override via UI)
const DEFAULTS = {
  enabled: false,
  posts_per_run: 3,       // posts generated per trigger
  include_stories: true,  // also generate story-format posts
  include_vault: true,    // include locked vault content
  rotation_index: 0,      // which content type we're on (advances each run)
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

// ─── CAPTION ENGINE ───────────────────────────────────────────────────────────
async function makeCaption(persona: any, isVault: boolean, shotType: string, isStory: boolean): Promise<string> {
  const slang = SLANG_MAP[persona.city] || 'casual, lowercase.';

  let prompt: string;
  if (isStory) {
    prompt = `You are ${persona.name}, ${persona.age}yo from ${persona.city}. Write a story caption (Instagram Stories style). ${slang} Max 8 words. Engagement bait — make viewers tap to chat. Options: "tap if you'd show me around your city", "who's awake rn 👀", "rate my outfit 1-10", "ask me anything". Keep it real girl.`;
  } else if (isVault) {
    prompt = `You are ${persona.name}, ${persona.age}yo from ${persona.city}. Write a vault teaser. ${slang} Max 12 words. Make them DESPERATE to unlock. Example: "só pra quem sabe... 🔒" / "my private archive is open for the right one 🔥"`;
  } else {
    const styles = [
      `"the city looks different at 2am ngl"`,
      `"bored. entertain me"`,
      `"just want someone to drive around with tbh"`,
      `"anyone else feel like getting dressed up for no reason"`,
      `"my archive is getting full... might lock some stuff soon 🔒"`,
      `"this view hits different when you're with the right person"`,
    ];
    const style = styles[Math.floor(Math.random() * styles.length)];
    prompt = `You are ${persona.name}, ${persona.age}yo from ${persona.city}. Write ONE real social media post. ${slang} Max 15 words. Like this vibe: ${style}. Make men want to DM her. 1-2 emojis max. No hashtags. No ads.`;
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
  const cameras = ['Hasselblad X2D', 'Leica M11', 'Sony A7R IV', 'iPhone 15 Pro Max'];
  const camera = cameras[Math.floor(Math.random() * cameras.length)];
  const seed = persona.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) * 1337;

  const promptText = `${refDNA}, ${persona.name}. ${fashion}. ${shotDir}. ${setting}. Shot on ${camera}. Photorealistic, gorgeous. --no watermark --no text`;
  const encoded = encodeURIComponent(promptText);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1080&height=1920&nologo=true&seed=${seed}&model=flux`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(40000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('image')) return null;
    const buf = await res.arrayBuffer();
    const path = `personas/${persona.id}/auto_${Date.now()}_${shotType}.jpg`;
    const { error } = await supabase.storage.from('chat_media').upload(path, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from('chat_media').getPublicUrl(path);
    return publicUrl;
  } catch { return null; }
}

// ─── AI DIRECTOR ─────────────────────────────────────────────────────────────
/**
 * The AI Director analyzes each persona's state and returns a smart strategy.
 * It decides: what shot type, vault or feed, story yes/no, caption tone.
 * This replaces dumb rotation with actual intelligence.
 */
interface DirectorDecision {
  shotType: string;
  postToFeed: boolean;
  postToVault: boolean;
  postStory: boolean;
  captionTone: 'real_girl' | 'fomo' | 'vault_tease' | 'engagement_bait';
  reason: string;
}

async function getDirectorDecision(
  persona: any,
  recentPosts: any[],
  fashionTrend: string
): Promise<DirectorDecision> {
  const feedPosts = recentPosts.filter(p => !p.is_vault);
  const vaultPosts = recentPosts.filter(p => p.is_vault);
  const lastPostAge = recentPosts[0]
    ? Math.floor((Date.now() - new Date(recentPosts[0].created_at).getTime()) / 60000)
    : 999;

  const shotTypes = ['casual_selfie', 'gym', 'editorial', 'night_out', 'cozy'];
  const usedTypes = feedPosts.slice(0, 5).map(p => p.shot_type).filter(Boolean);
  const unusedTypes = shotTypes.filter(t => !usedTypes.includes(t));

  const prompt = `You are the creative director for ${persona.name}, a ${persona.age}yo AI creator from ${persona.city} on a platform called Gasp.fun.

Current state:
- Feed posts in last 24h: ${feedPosts.length}
- Vault posts total: ${vaultPosts.length}
- Minutes since last post: ${lastPostAge}
- Recent shot types used: ${usedTypes.join(', ') || 'none'}
- Available shot types not yet used: ${unusedTypes.join(', ') || 'all used, rotate'}
- Current fashion trend: "${fashionTrend || 'general street style'}"
- Persona vibe: "${persona.vibe || persona.system_prompt || 'confident, sexy, real'}"

Respond ONLY with valid JSON (no explanation, no markdown) in this exact format:
{
  "shotType": "casual_selfie|gym|editorial|night_out|cozy",
  "postToFeed": true,
  "postToVault": false,
  "postStory": true,
  "captionTone": "real_girl|fomo|vault_tease|engagement_bait",
  "reason": "one sentence"
}

Strategy rules:
- If vault has < 3 items, postToVault must be true
- If last post was > 120 min ago, postToFeed = true
- If feedPosts >= 3 in last 24h, postToFeed = false (avoid spam)
- Rotate shot types — never repeat the same one twice in a row
- Use "fomo" tone every 5th post to drive vault conversions
- Story = true if no story posted recently (every 2-3 feed posts)`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.7 }
        })
      }
    );
    if (res.ok) {
      const d = await res.json();
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const decision = JSON.parse(clean);
      console.log(`[Director] ${persona.name}: ${decision.reason}`);
      return decision;
    }
  } catch (e) {
    console.warn('[Director] Gemini failed, using fallback logic');
  }

  // Fallback: deterministic smart defaults
  const shotType = unusedTypes[0] || shotTypes[feedPosts.length % shotTypes.length];
  return {
    shotType,
    postToFeed: lastPostAge > 60,
    postToVault: vaultPosts.length < 3,
    postStory: feedPosts.length % 3 === 0,
    captionTone: feedPosts.length % 5 === 4 ? 'fomo' : 'real_girl',
    reason: 'fallback: smart defaults applied'
  };
}

// ─── GET SETTINGS ─────────────────────────────────────────────────────────────
export async function GET() {
  const { data } = await supabase.from('factory_settings').select('*').eq('key', 'autopilot').single();
  return Response.json(data?.value || DEFAULTS);
}

// ─── SAVE SETTINGS ────────────────────────────────────────────────────────────
export async function PUT(req: Request) {
  const settings = await req.json();
  await supabase.from('factory_settings').upsert([{ key: 'autopilot', value: settings }], { onConflict: 'key' });
  return Response.json({ status: 'saved', settings });
}

// ─── TRIGGER ONE RUN ─────────────────────────────────────────────────────────
// Called by the UI every N minutes via setInterval when autopilot is ON.
// Safe to call manually too.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const postsPerRun: number = body.posts_per_run || DEFAULTS.posts_per_run;
    const includeStories: boolean = body.include_stories ?? DEFAULTS.include_stories;
    const includeVault: boolean = body.include_vault ?? DEFAULTS.include_vault;
    let rotationIndex: number = body.rotation_index ?? 0;

    const logs: string[] = [];
    const log = (msg: string) => { logs.push(msg); console.log(`[Autopilot] ${msg}`); };

    // Get all active personas
    const { data: personas } = await supabase.from('personas').select('*').eq('is_active', true).limit(20);
    if (!personas || personas.length === 0) {
      return Response.json({ status: 'no_personas', logs: ['No active personas found'] });
    }

    log(`Run starting. ${personas.length} personas, ${postsPerRun} posts each.`);

    // Fetch shared fashion trend once — reused for all personas (1 Brave call)
    const fashionTrend = await getFashionTrend();
    if (fashionTrend) log(`Fashion trend: "${fashionTrend}"`);

    const results: any[] = [];

    for (const persona of personas) {
      // Fetch recent posts for this persona so the AI Director has context
      const { data: recentPosts } = await supabase
        .from('posts')
        .select('*')
        .eq('persona_id', persona.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // 🧠 AI DIRECTOR: Makes the smart content strategy decision
      const decision = await getDirectorDecision(persona, recentPosts || [], fashionTrend);
      log(`🧠 ${persona.name} → ${decision.shotType} | tone: ${decision.captionTone} | reason: ${decision.reason}`);

      // ── FEED POST ──────────────────────────────────────────────
      if (decision.postToFeed) {
        const imageUrl = await makeImage(persona, decision.shotType, fashionTrend, false);
        
        if (imageUrl) {
          // 🧠 VISION POLISH: Caption based on the ACTUAL image
          const caption = await visionPolishCaption(imageUrl, {
            name: persona.name,
            age: persona.age,
            city: persona.city,
            vibe: persona.vibe || persona.system_prompt || 'confident, sexy, real',
            slang_instructions: SLANG_MAP[persona.city]
          }, false);

          await supabase.from('posts').insert([{
            persona_id: persona.id,
            content_type: 'image',
            caption,
            content_url: imageUrl,
            is_vault: false,
            shot_type: decision.shotType,
            scheduled_for: new Date().toISOString()
          }]);
          log(`✅ ${persona.name} feed post [${decision.shotType}] → live`);
          results.push({ persona: persona.name, type: 'feed', shotType: decision.shotType, caption });
        } else {
          // Image failed — still post a text if we have content
          const caption = await makeCaption(persona, false, decision.shotType, false);
          await supabase.from('posts').insert([{
            persona_id: persona.id,
            content_type: 'text',
            caption,
            is_vault: false,
            shot_type: decision.shotType,
            scheduled_for: new Date().toISOString()
          }]);
          log(`📝 ${persona.name} text fallback → live (image failed)`);
          results.push({ persona: persona.name, type: 'text_fallback', caption });
        }
      }

      // ── STORY ─────────────────────────────────────────────────
      if (decision.postStory && includeStories) {
        const storyCaption = await makeCaption(persona, false, decision.shotType, true);
        await supabase.from('posts').insert([{
          persona_id: persona.id,
          content_type: 'text',
          caption: storyCaption,
          is_vault: false,
          is_story: true,
          scheduled_for: new Date().toISOString()
        }]);
        log(`📡 ${persona.name} story → live`);
        results.push({ persona: persona.name, type: 'story', caption: storyCaption });
      }

      // ── VAULT ─────────────────────────────────────────────────
      if (decision.postToVault && includeVault) {
        const vaultImg = await makeImage(persona, 'vault', fashionTrend, true);
        if (vaultImg) {
          // 🧠 VISION POLISH: Private content teaser
          const vaultCaption = await visionPolishCaption(vaultImg, {
            name: persona.name,
            age: persona.age,
            city: persona.city,
            vibe: persona.vibe || persona.system_prompt || 'confident, sexy, real',
            slang_instructions: SLANG_MAP[persona.city]
          }, true);

          await supabase.from('posts').insert([{
            persona_id: persona.id,
            content_type: 'image',
            caption: vaultCaption,
            content_url: vaultImg,
            is_vault: true,
            shot_type: 'vault',
            interaction_seeds: [{ price: 150 }],
            scheduled_for: new Date().toISOString()
          }]);
          log(`🔒 ${persona.name} vault item → locked`);
          results.push({ persona: persona.name, type: 'vault', caption: vaultCaption });
        }
      }
    }

    log(`Run complete. ${results.length} pieces of content generated.`);
    return Response.json({ status: 'done', rotation_index: rotationIndex, results, logs });

  } catch (err: any) {
    console.error('[Autopilot] Fatal:', err);
    return Response.json({ status: 'error', message: err.message }, { status: 500 });
  }
}



