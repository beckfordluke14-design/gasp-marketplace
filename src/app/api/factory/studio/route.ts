
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const GOOGLE_GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

const MIAMI_FASHION_SEEDS = [
  'tropical high-fashion miami clubwear 2026',
  'luxury yacht party aesthetic white silk',
  'miami design district chic editorial',
  'neon sunset nightlife fashion influencer',
  'minimalist luxury beach club vibes',
  'miami street style high-end sneakers and silk',
  'ultra-glamorous evening gala penthouse',
  'miami fashion 2026 hot girl summer outfits',
];

// Hybrid Content Rotation — Balanced for Intimacy (Standard) and Status (Vogue)
export const CONTENT_ROTATION = [
  { 
    type: 'casual_mirror',  
    label: 'Standard: Mirror POV',  
    isVault: false, 
    shotDir: 'Candid lifestyle, POV mirror selfie, phone blocking half face, natural window light, messy room background, looking into the mirror with a playful gaze, real-girl vibe' 
  },
  { 
    type: 'gym_candid',            
    label: 'Standard: Active',   
    isVault: false, 
    shotDir: 'Candid gym shot, mirror selfie, moisture on skin, dynamic gym background, looking at the lens with a confident smirk, athletic wear' 
  },
  { 
    type: 'morning_cozy',          
    label: 'Standard: Morning',      
    isVault: false, 
    shotDir: 'Authentic close-up in bed, messy hair, sunlight flares, soft eye contact, feeling of waking up next to the user, extremely intimate' 
  },
  { 
    type: 'street_candid',           
    label: 'Standard: Street',      
    isVault: false, 
    shotDir: 'Casual street walk, candid frozen movement, holding a coffee, looking at the camera with a smile, urban background' 
  },
  { 
    type: 'elite_office',  
    label: 'Vogue: Alpha Secretary',  
    isVault: false, 
    shotDir: 'High-fashion Vogue editorial, "Hot Secretary" aesthetic, pencil skirt, glasses, sleek hair, modern office, cinematic noir lighting' 
  },
  { 
    type: 'tennis_elite',            
    label: 'Vogue: Club Elite',   
    isVault: false, 
    shotDir: 'Vogue sports editorial, exclusive club, designer activewear, golden hour backlighting, glistening skin, backview focus on hips' 
  },
  { 
    type: 'penthouse_gala',      
    label: 'Vogue: Gala Night',      
    isVault: false, 
    shotDir: 'High-fashion night editorial, penthouse terrace, silk evening dress, city lights bokeh, powerful elite gaze, deep artistic shadows' 
  },
  { 
    type: 'vault_studio',      
    label: 'Vogue: Shadow Elite',      
    isVault: true, 
    shotDir: 'Studio noir editorial, designer lingerie, high-fashion silhouette, intense eye contact, magazine cover quality, glistening skin' 
  },
];

async function getVaultDecision(persona: any, shotType: string, vibe: string) {
  const prompt = `You are the GASP REVENUE BRAIN.
Decide if this content for ${persona.name} belongs in the Free FEED or the Paid VAULT.
Concept: ${shotType}
Vibe: ${vibe}

Rules:
- FEED: Casual candid, morning shots, street walks, 'safe' editorial.
- VAULT: Backview-heavy, intimate studio, elite night gala, high-contrast lingerie, high-status 'Glistening' shots.
- If VAULT, recommend a price between 100 and 500 Credits.

Respond ONLY with valid JSON:
{
  "destination": "feed" | "vault",
  "recommended_price": number,
  "reasoning": "one sentence revenue strategy"
}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } })
    });
    if (res.ok) {
      const d = await res.json();
      return JSON.parse(d.candidates?.[0]?.content?.parts?.[0]?.text || '{"destination":"feed", "recommended_price": 0}');
    }
  } catch {
    const isVaultShot = ['studio_noir', 'penthouse_gala', 'vault_studio'].includes(shotType);
    return { destination: isVaultShot ? 'vault' : 'feed', recommended_price: isVaultShot ? 150 : 0 };
  }
}

async function generateCaption(persona: any, type: string): Promise<string> {
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_GEMINI_KEY}`;
    const prompt = `Write a short, authentic caption for ${persona.name} from ${persona.city}. Type: ${type}. NO hashtags. NO generic influencer talk. Keep it raw, lowercase, and matching her city vibe. Max 10 words.`;
    
    try {
        const res = await fetch(googleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const d = await res.json();
        return d.candidates?.[0]?.content?.parts?.[0]?.text || 'city vibes.';
    } catch {
        return 'city vibes.';
    }
}

async function generateAndStoreImage(persona: any, isVault: boolean, personaId: string, customPrompt?: string, shotType?: string) {
    const seed = Math.floor(Math.random() * 1000000);
    const rotationMatch = CONTENT_ROTATION.find(r => r.type === shotType);
    const shotDir = rotationMatch ? rotationMatch.shotDir : 'candid fashion portrait';
    const refDNA = persona.reference_prompt || `${persona.race || ''} woman from ${persona.city || ''}`;
    const fashion = MIAMI_FASHION_SEEDS[Math.floor(Math.random() * MIAMI_FASHION_SEEDS.length)];
    
    let prompt = `${refDNA}. ${shotDir}. ${fashion}. Glistening skin, high fashion, photorealistic. --seed ${seed}`;
    if (customPrompt) prompt = `${refDNA}. ${customPrompt}. ${fashion}. Photorealistic. --seed ${seed}`;

    // 🧬 NEURAL INTERCEPT: Immediate Cloud Manifestation
    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1920&nologo=true&seed=${seed}&model=flux`;
    
    try {
        console.log(`📥 [Studio] Intercepting Visual Genesis for ${personaId}...`);
        const res = await fetch(pollUrl);
        if (!res.ok) throw new Error('Camo-Link Download Failed');
        
        const buffer = Buffer.from(await res.arrayBuffer());
        // 🛡️ SOVEREIGN STORAGE: Writing directly to the Railway local volume
        const storageDir = path.join(process.cwd(), 'public', 'storage', 'chat_media');
        if (!fs.existsSync(storageDir)) {
           fs.mkdirSync(storageDir, { recursive: true });
        }

        const fileName = `studio_${Date.now()}_${seed}.jpg`;
        const localFilePath = path.join(storageDir, fileName);
        
        fs.writeFileSync(localFilePath, buffer);

        const publicUrl = `https://asset.gasp.fun/storage/chat_media/${fileName}`;
        console.log(`✅ [Studio] Permanent Identity Locked: ${publicUrl}`);
        return publicUrl;
    } catch (e) {
        console.warn('[Studio] Critical Genesis Error. Using resilient fallback.', e);
        return `https://asset.gasp.fun/storage/chat_media/personas/v1.png?seed=${seed}`;
    }
}

export async function POST(req: Request) {
    try {
        const { persona_id, content_type = 'image', custom_prompt } = await req.json();
        
        // Use Railway DB for persona fetch
        const { rows } = await db.query('SELECT * FROM personas WHERE id = $1', [persona_id]);
        const persona = rows[0];
        
        if (!persona) return new Response('Persona not found', { status: 404 });

        const cap = await generateCaption(persona, 'post');
        const img = await generateAndStoreImage(persona, false, persona_id, custom_prompt, 'casual_mirror');

        const isSecret = cap.toLowerCase().includes('secret');
        
        // Use Railway DB for post insertion
        await db.query(`
            INSERT INTO posts (persona_id, content_type, content_url, caption, is_vault, scheduled_for, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
            persona_id, 
            content_type, 
            img, 
            cap, 
            isSecret, 
            new Date().toISOString()
        ]);

        return new Response(JSON.stringify({ success: true, url: img }), { status: 200 });
    } catch (err: any) {
        console.error('[Studio POST error]:', err.message);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}



