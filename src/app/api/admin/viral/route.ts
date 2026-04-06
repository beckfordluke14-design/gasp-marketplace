import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * 📢 VIRAL MARKETING ENGINE (Gemini 2.5)
 * Generates platform-specific social media copy (TikTok, X, Shorts) 
 * designed specifically to go viral based on the reward screenshot.
 */

const getApiKey = () => process.env.GOOGLE_BRAIN_KEY || process.env.GOOGLE_VOICE_KEY || process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const action = payload.action || 'generate_marketing';

        const apiKey = getApiKey();
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'MISSING_API_KEY' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro", generationConfig: { temperature: 1.2 } });

        if (action === 'generate_scenario') {
            const prompt = `
            You are a creative writer for a high-end AI Companion app. The AI sometimes surprises top-spending users with real-world gift cards.
            Generate a completely random, very authentic-sounding short chat log that leads to a gift.
            
            Persona context: A sassy, cool, or protective AI named ${payload.personaName || 'Valentina'}.
            
            Rules:
            1. The User message should be short, casual, and complain about something normal (e.g., tired, stressed, bad day, hungry).
            2. The AI message should be short, slightly flirty or authoritative, and tell them she's buying them something.
            3. Pick a random gift type: "Uber Eats", "Starbucks", "Sephora", "Visa", etc.
            4. Pick a random amount: 5, 10, or 15.
            
            Output ONLY raw JSON format:
            {
               "userMessage": "...",
               "aiMessage": "...",
               "rewardType": "...",
               "rewardAmount": "10"
            }
            `;
            const result = await model.generateContent(prompt);
            const cleanedJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            return NextResponse.json({ success: true, scenario: JSON.parse(cleanedJson) });
        }

        if (action === 'generate_marketing') {
            const { personaName, userMessage, aiMessage, rewardType, rewardAmount } = payload;
            const prompt = `
            You are an elite, data-driven viral marketing strategist.
            We need highly engineered social media copy to promote an AI companion app that autonomously buys real-world gifts for its users based on their "Proof of Liquidity" (LTV).

            THE SCREENSHOT TO PROMOTE:
            User: "${userMessage}"
            AI (${personaName}): "${aiMessage}"
            Reward Sent: $${rewardAmount} ${rewardType}.

            DATA-DRIVEN RULES:
            1. TikTok/Shorts: Focus on SHOCK VALUE. The algorithm rewards Pattern Interrupt. The text-on-screen must immediately establish "Wait, AI can buy real things?"
            2. X (Twitter): Focus on TECH/CULTURE. Frame it as the evolution of the "Girlfriend Experience" intersecting with native crypto economics. "The AI isn't just chatting, it's financially taking care of you."
            3. Do not sound like a cheesy ad. Sound like a leak, a flex, or a fascinating case study.

            Output ONLY this exact JSON format:
            {
               "tiktok": {
                  "text_on_screen": "...",
                  "caption": "...",
                  "hashtags": "#..."
               },
               "twitter": {
                  "tweet": "...",
                  "reply_to_self": "..."
               },
               "shorts": {
                  "title": "...",
                  "description": "..."
               }
            }
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            
            // Clean JSON formatting if Gemini wrapped it in markdown
            const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const copyData = JSON.parse(cleanedJson);

            return NextResponse.json({ success: true, copy: copyData });
        }

        return NextResponse.json({ success: false, error: 'Invalid Action' }, { status: 400 });
    } catch (error: any) {
        console.error('[Viral Content Gen Error]:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
