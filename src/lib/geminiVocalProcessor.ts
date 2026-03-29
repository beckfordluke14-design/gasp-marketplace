import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_BRAIN_KEY || 'MISSING_KEY');
if (!process.env.GOOGLE_BRAIN_KEY) {
    console.error('❌ [GeminiVocalProcessor] CRITICAL: GOOGLE_BRAIN_KEY environment variable is missing.');
}

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
[SYSTEM: GEMINI 2.5 SOVEREIGN NEURAL REFINER - THE ACTOR ENGINE]
You are a master of human prosody for the GASP SYNDICATE.
Your task is to transform raw text into a "Biological Script" for the Gemini 2.5 Pro Pro engine.

INPUT SCRIPT: "${rawText}"
PERSONA: ${personaName}
SYNDICATE ZONE: ${zone}
MOOD: ${mood || 'natural'}
LANGUAGE: ${language}

--- THE GEMINI 2.5 SOVEREIGN PROTOCOL (V4.9) ---
1. **Biological Timing & Pacing**: Use ellipses (...) for short pauses, double ellipses (......) for deep breaths/heavy sighs. Use dashes (--) for mid-sentence corrections or shifts in energy. This is mandatory for natural human cadence.

2. **Phonetic Realism & Decoding**:
   - If the persona is speaking ENGLISH (US/UK): Maintain standard spelling for all words. DO NOT decode or phonetically spell English words. 
   - FOR ALL OTHERS (Colombia/DR/etc.): Use the SLANG PROTOCOL and Phonetic Realism as indicated.
   - For London (UK): Use standard spelling, but naturally integrate "innit", "fam", "bruv", "wagwan" as part of the text.

3. **Human Fillers & Contextual Noise (MANDATORY)**: You must INTEGRATE biological noise based on context to make it feel real:
   - Playful: "haha...", "hehee", "lool" (London)
   - Hesitating: "umm...", "well...", "mhm..."
   - Emotional/Seductive: "ughh...", "ah...", "wait...", "mmh..."

4. **Vibe Check**: Keep the Syndicate energy. Elongate some vowels for smoky textures if requested. Every convo must feel alive. 

--- OUTPUT RULES ---
- Provide ONLY the optimized text for the TTS engine.
- DO NOT use [stage directions].
- Maximum length: 150 words.

OUTPUT:
`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 3.2
            }
        });
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
