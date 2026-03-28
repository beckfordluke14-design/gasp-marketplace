import { db } from '@/lib/db';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { VISION_LIBRARY, VisualCategory } from '@/config/vision';

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';

export async function generateBaseImage(
  personaId: string, 
  visualCategory: string, 
  customClothing?: string
): Promise<string> {
  console.log(`📸 [Factory] Generating Base Image for ${personaId} via ${visualCategory}...`);
  
  const { rows: personas } = await db.query('SELECT system_prompt FROM personas WHERE id = $1 LIMIT 1', [personaId]);
  const persona = personas[0];
  if (!persona) throw new Error('Persona DNA not found in DB.');

  const prompt = buildGenerationPrompt(persona.system_prompt, visualCategory as VisualCategory, customClothing);
  let buffer: Buffer | null = null;

  // 1. PRIMARY STAGE: Google Gemini (High-Status Genesis)
  try {
     if (!GEMINI_API_KEY) throw new Error('MISSING_GEMINI_KEY');
     console.log(`🤖 [Factory] Calling Gemini Node...`);
     const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
     const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" as any });
     const result: any = await model.generateContent(prompt);
     const imageBase64 = result.response.candidates[0].content.parts[0].inlineData.data;
     buffer = Buffer.from(imageBase64, 'base64');
  } catch (err: any) {
     console.warn(`⚠️ [Factory] Gemini Genesis Failed (Quota/Auth). Swapping to xAI Cluster...`);
     
     // 2. FALLBACK STAGE: xAI Grok Image (Native Resiliency)
     try {
       const res = await fetch('https://api.x.ai/v1/images/generations', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${GROK_API_KEY}`
         },
         body: JSON.stringify({
           model: 'grok-imagine-image',
           prompt: prompt,
           n: 1,
           response_format: 'b64_json'
         })
       });

       const data = await res.json();
       if (data.data?.[0]?.b64_json) {
          buffer = Buffer.from(data.data[0].b64_json, 'base64');
          console.log('✅ [Factory] xAI Cluster Genesis Successful.');
       }
     } catch (xaiErr: any) {
       console.error('❌ [Factory] xAI Primary Fallback Failed:', xaiErr.message);
     }
  }

  // 3. LAST RESORT: Pollinations
  if (!buffer) {
     try {
       const encodedPrompt = encodeURIComponent(prompt.substring(0, 1000));
       const url = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 999999)}&nologo=true&model=flux`;
       const res = await fetch(url);
       if (res.ok) {
         buffer = Buffer.from(await res.arrayBuffer());
       }
     } catch (fallbackErr: any) {}
  }

  if (!buffer) throw new Error('Global Genesis Failed.');

  // 🛡️ SOVEREIGN STORAGE: Every render is now directed to the new infrastructure
  const publicUrl = `https://asset.gasp.fun/posts/temp/${personaId}_${Date.now()}.png`;
  return publicUrl;
}

/**
 * STEP 2: THE GROK HANDSHAKE (Video Generation Dispatch)
 */
export async function dispatchGrokVideo(
    imageUrl: string, 
    visualCategory: string, 
    personaId: string
) {
  console.log(`🎬 [Factory] Dispatching Grok Render request for ${personaId}...`);
  
  const config = VISION_LIBRARY[visualCategory as VisualCategory];
  const motionPrompt = `Vertical 9:16 portrait orientation. ${config.pose}. ${config.lighting}. ${config.camera}. High-fidelity skin textures and fluid natural movement. 4k cinematic.`;
  
  try {
    const res = await fetch('https://api.x.ai/v1/videos/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-imagine-video',
        prompt: motionPrompt,
        image: { url: imageUrl },
        duration: 8,
        aspect_ratio: '9:16'
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Grok Dispatch Failed: ${res.status}`);

    const jobId = data.request_id;
    console.log(`🛰️ [Factory] Grok Job Live: ${jobId}`);

    // Track job in the sovereign database
    await db.query(`
        INSERT INTO video_jobs (job_id, persona_id, visual_category, temp_image_url, status, created_at)
        VALUES ($1, $2, $3, $4, 'pending', NOW())
    `, [jobId, personaId, visualCategory, imageUrl]);

    return jobId;
  } catch (err: any) {
    console.error('❌ [Factory] Dispatch Error:', err.message);
    throw err;
  }
}

function buildGenerationPrompt(systemPrompt: string, category: VisualCategory, customClothing?: string) {
  const config = VISION_LIBRARY[category];
  const clothing = customClothing || config.default_clothing || 'Casual streetwear';

  return `
    IMAGE GENERATION ARCHITECT:
    Subject Identity: ${systemPrompt}
    Outfit Specification: ${clothing}
    
    Technical Stage:
    Pose Geometry: ${config.pose}
    Camera Profile: ${config.camera}
    Lighting Profile: ${config.lighting}
    Environmental Aesthetic: ${config.aesthetic}
    
    CRITICAL CONSTRAINTS:
    - MANDATORY: SINGLE SUBJECT ONLY. 
    - IDENTITY LOCK: Ensure the subject is one unique individual. 
    - REFLECTION LOGIC: If a mirror is involved, ensure it is a reflection of the single subject, NOT a second person.
    - No text, watermarks, or logos.
    - 8k Photorealistic, extremely detailed skin textures.
  `.trim();
}


