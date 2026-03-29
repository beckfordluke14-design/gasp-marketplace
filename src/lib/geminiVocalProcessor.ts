import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_BRAIN_KEY || 'AIzaSyDi1lkyDRpoVV3l1PMrRdOpT10QP0d_jNk');

export async function refineVocalTextWithGemini(
    rawText: string, 
    personaName: string, 
    zone: string, 
    mood: string | null, 
    language: string = 'en',
    vocalDna: any = null,
    slangProfile: any = null
) {
    console.log(`🧠 [GeminiVocalProcessor] Refining for ${personaName} in ${zone}... unique DNA active.`);
    
    try {
        const model = genAI.getGenerativeModel({ 
            model: "models/gemini-1.5-flash",
            // 🛡️ UNCENSORED MODE: Disabling filters for raunchy content refinement
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_NONE' as any },
            ]
        });

        const prompt = `
[SYSTEM: HEAVY HEAVY HEAVY VOICE PROMPT ENGINE - CHIRP 3 OPTIMIZER]
You are a master of human prosody, regional dialect, and emotional subtext for the GASP SYNDICATE.
Your task is to take a raw script and transform it into a "Biological Script" for a high-fidelity Google Chirp 3 HD TTS engine.

INPUT SCRIPT: "${rawText}"
PERSONA: ${personaName}
SYNDICATE ZONE: ${zone}
DETECTED MOOD: ${mood || 'natural'}
TARGET LANGUAGE: ${language}

[🧬 NEURAL DNA MARKERS]:
- VOCAL TEXTURE: ${vocalDna?.texture || 'Smooth/Natural'}
- PROSODY MAP: ${vocalDna?.prosody || 'Conversational'}
- ACCENT DEPTH: ${vocalDna?.accent || 'Standard'}
- INTIMACY LEVEL: ${vocalDna?.intimacy || 'Direct'}
- SLANG PROTOCOL: ${slangProfile?.rules?.join(', ') || 'Standard Urban'}

--- THE GEMINI 2.5 SOVEREIGN PROTOCOL ---
1. **Biological Timing**: Gemini 2.5 is extremely sensitive to punctuation. Use ellipses (...) for short pauses, double ellipses (......) for deep breaths/heavy sighs. Use dashes (--) for mid-sentence corrections or shifts in energy.
2. **Human Fillers & Contextual Noise**: INTEGRATE these sounds based on the mood:
   - Playful/Funny: Use "haha...", "hehee", "lool" (London)
   - Thinking/Hesitating: Use "umm...", "well...", "mhm..."
   - Frustrated/Annoyed: Use "ughh...", "tch...", "pffft"
   - Seductive: Use "ah...", "mmh...", "wait..."
3. **Phonetic Realism**: Do NOT use standard spelling if it kills the vibe.
   - Use the SLANG PROTOCOL listed above.
   - For London (UK): Heavy use of "innit", "fam", "bruv", "wagwan".
   - For Colombia: Use "pues...", "mor...", "papi..." with breathy pauses.
4. **Vibe Check**: This is NOT a robot. Use the INTIMACY LEVEL to guide the heat. Elongate vowels for smoky textures.
5. **Duality**: Every convo must feel alive. If the text suggests a laugh, write "haha" as part of the spoken text.

--- OUTPUT RULES ---
- Provide ONLY the optimized text for the TTS engine.
- DO NOT use [stage directions] or (stage directions).
- Maximum length: 150 words.

OUTPUT:
`;

        const result = await model.generateContent(prompt);
        let refinedText = result.response.text().trim();
        
        // Clean up any stray quotes or "Output:" markers
        refinedText = refinedText.replace(/^Output:\s*/i, '').replace(/^"|"$/g, '');
        
        console.log(`✅ [GeminiVocalProcessor] Refined text: "${refinedText.slice(0, 50)}..."`);
        return refinedText;
    } catch (err: any) {
        console.error('❌ [GeminiVocalProcessor] Failed to refine text:', err.message);
        return rawText; // Fallback to raw text if Gemini fails
    }
}
