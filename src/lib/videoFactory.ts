import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { VISION_LIBRARY, VisualCategory } from '@/config/vision';

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function generateBaseImage(
  personaId: string, 
  visualCategory: string, 
  customClothing?: string
): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log(`📸 [Factory] Generating Base Image for ${personaId} via ${visualCategory}...`);
  
  const { data: persona } = await supabase.from('personas').select('system_prompt').eq('id', personaId).single();
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
     // Since Gemini hit a quota, we use the user's xAI key to generate the high-def seed.
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
       } else {
          console.error('⚠️ [Factory] xAI Cluster Failed to return image. Trying last resort...');
       }
     } catch (xaiErr: any) {
       console.error('❌ [Factory] xAI Primary Fallback Failed:', xaiErr.message);
     }
  }

  // 3. LAST RESORT: Pollinations (Only if clusters are offline)
  if (!buffer) {
     try {
       const encodedPrompt = encodeURIComponent(prompt.substring(0, 1000));
       const url = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 999999)}&nologo=true&model=flux`;
       const res = await fetch(url);
       if (res.ok) {
         buffer = Buffer.from(await res.arrayBuffer());
         console.log('✅ [Factory] Resilient Last-Resort Genesis Successful.');
       }
     } catch (fallbackErr: any) {
       console.error('❌ [Factory] Global Genesis Collapse:', fallbackErr.message);
       throw fallbackErr;
     }
  }

  if (!buffer || buffer.length < 5000) {
    throw new Error('Image generation failed or returned invalid data.');
  }

  const fileName = `${personaId}_${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage
     .from('pipeline_temp')
     .upload(fileName, buffer, { contentType: 'image/png' });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('pipeline_temp').getPublicUrl(fileName);
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
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
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
    if (!res.ok) throw new Error(`Grok Dispatch Failed: ${res.status} - ${JSON.stringify(data)}`);

    const jobId = data.request_id;
    console.log(`🛰️ [Factory] Grok Job Live: ${jobId}`);

    await supabase.from('video_jobs').insert([{
        job_id: jobId,
        persona_id: personaId,
        visual_category: visualCategory,
        temp_image_url: imageUrl,
        status: 'pending'
    }]);

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


