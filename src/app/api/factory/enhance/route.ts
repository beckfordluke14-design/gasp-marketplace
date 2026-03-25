import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

const GOOGLE_GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GOOGLE_GEMINI_KEY);

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();
        
        if (!prompt) return new Response(JSON.stringify({ error: 'Prompt required' }), { status: 400 });

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        const systemInstruction = `You are the GASP Syndicate Architect. 
        Your task is to take a raw creative vision and ENHANCE it into a high-fidelity, descriptive prompt for our mass-genesis engine.
        
        Guidelines:
        - Maintain the core cultural vibe (e.g., Blasian, Urban, Island Heat).
        - Add specific visual anchors: lighting (Xenon flash, golden hour), camera specs (35mm f/1.4), texture (dewy skin, pore-detail).
        - Keep it punchy and atmospheric.
        - The output should be a single paragraph of descriptive vision.
        
        Vision to Enhance: "${prompt}"`;

        const result = await model.generateContent(systemInstruction);
        const enhanced = result.response.text();

        return new Response(JSON.stringify({ enhanced }), { status: 200 });
    } catch (error: any) {
        console.error('[Enhance API Error]', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}



