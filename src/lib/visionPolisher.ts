import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

/**
 * VISION POLISHER v1.0
 * Objective: Kill "cheesy" AI captions by using Gemini Vision to actually see the image.
 */
export async function visionPolishCaption(
  imageUrl: string,
  persona: { name: string; age: number; city: string; vibe: string; slang_instructions?: string },
  isVault: boolean = false
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 1. Fetch image buffer
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');

    const slang = persona.slang_instructions || 'natural, lowercase, casual slang';
    
    // 2. Build the "Vision-Aware" prompt
    const prompt = `
      Look at this image of ${persona.name}. 
      CONTEXT: She is a ${persona.age}yo from ${persona.city}. Her vibe is: ${persona.vibe}.
      SLANG INSTRUCTIONS: ${slang}
      TYPE: ${isVault ? 'Locked Vault Content (Make it suggestive/mysterious)' : 'Main Feed Post (Candid/Lifestyle)'}

      TASK:
      1. Analyze the scene, outfit, and pose.
      2. Write a VERY WITTY, slightly sarcastic, or socially resonant 1-sentence caption.
      3. CRITICAL: The wit must be ROOTED in her background as a girl from ${persona.city}.
      4. ENGAGEMENT HOOK: End with a context-aware "Call to Action" designed to trigger a DM. (e.g., if in bed: "who's up?", if near food: "who's hungry?", if dressed up: "where are we going?").
      5. NATIVE LANGUAGE: Use native slang or mix her native language (Spanish/Portuguese/etc) with English naturally (e.g., Spanglish) if it feels real.
      6. Use specific details from the image to anchor the joke or observation.
      7. Keep it raw, lowercase, and real. Max 15 words. 1 emoji max.

      RETURN ONLY THE CAPTION TEXT.
    `.trim();

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      }
    ]);

    const text = result.response.text().trim().toLowerCase().replace(/["'*]/g, '');
    return text || 'the vibe is different tonight ngl';

  } catch (error) {
    console.error('⚠️ [VisionPolisher] Failure:', error);
    return 'candid moment... 👀';
  }
}


