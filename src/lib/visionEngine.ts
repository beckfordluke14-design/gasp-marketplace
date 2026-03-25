import { VISION_LIBRARY, type VisualCategory } from '@/config/vision';

/**
 * SYSTEM: MODULAR VISION ENGINE
 * Objective: Generate hyper-realistic prompts with dynamic clothing injection and strict quality constraints.
 */
export function buildGenerationPrompt(
  personaDna: string, 
  visualCategory: VisualCategory, 
  customClothing?: string,
  customContext?: string
): string {
  const style = VISION_LIBRARY[visualCategory];
  
  if (!style) {
    throw new Error(`[VisionEngine] Invalid category: ${visualCategory}`);
  }

  // Use custom clothing if provided, otherwise fall back to the category's default vibe
  const outfit = customClothing ? customClothing : (style as any).default_clothing;

  const prompt = `
    SUBJECT: ${personaDna}. 
    OUTFIT: ${outfit}.
    POSE: ${style.pose}
    CAMERA PHYSICS: ${style.camera}
    LIGHTING: ${style.lighting}
    AESTHETIC: ${style.aesthetic}
    ADDITIONAL CONTEXT: ${customContext || 'None'}
    
    CRITICAL NEGATIVE CONSTRAINTS: Absolutely NO earrings of any kind. No perfect AI plastic skin, retain natural textures.
  `.trim().replace(/\s+/g, ' ');

  return prompt;
}


