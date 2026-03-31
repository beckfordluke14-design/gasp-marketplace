import { db } from '@/lib/db';
import { initialProfiles } from '@/lib/profiles';
import { NextResponse } from 'next/server';

/**
 * 🛰️ DIVERSIFIED NEURAL SNIPER v3.0 - SYNDICATE HQ
 * Mission: Multi-Niche Curation (Weather, Crypto, Luxury, Macro).
 */

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

// 🧬 NICHE REPOSITORY: Mapping personas to their specialized intel streams
const PERSONA_NICHES: Record<string, string[]> = {
    "Nova": ["NYC weather anomalies", "London record heatwave", "Metar sensor arbitrage"],
    "Ericka": ["Miami luxury real estate", "Supercar releases 2026", "Luxury lifestyle trends"],
    "Elena": ["Solana whale accumulation", "Base L2 bridge alert", "Crypto market alpha"],
    "Amaya": ["Global macro power shifts", "AI model breakthroughs", "Cyber intelligence trends"]
};

const DEFAULT_KEYWORDS = ["Global trend report", "High-frequency trading", "Sovereign technology"];

async function getSniperTargets(personaName: string) {
    try {
        const keywords = PERSONA_NICHES[personaName] || DEFAULT_KEYWORDS;
        const query = keywords[Math.floor(Math.random() * keywords.length)];
        
        const braveRes = await fetch(`https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=2`, {
            headers: { 'X-Subscription-Token': BRAVE_API_KEY }
        });
        const braveData = await braveRes.json();
        return braveData.results || [];
    } catch (e) {
        console.error(`Brave Snipe Failed for ${personaName}:`, e);
        return [];
    }
}

async function synthesizeReport(persona: any, rawNews: any) {
    const prompt = `
        YOU ARE ${persona.name}. 
        VIBE: ${persona.vibe}. 
        ROLE: Syndicate Specialized Intelligence.
        NICHE: Based on the persona's vibe and current data.
        
        MISSION: Provide a high-IQ tactical briefing for our Syndicate members.
        Connect the data to our decentralized economy or your personal world.
        Sound like a sophisticated expert in your field. 
        
        NEWS DATA: ${rawNews.title} - ${rawNews.description}
        
        FORMAT (JSON):
        {
          "title": "A tactical, authority-driven headline (e.g. [DECRYPTED], [MACRO ALERT])",
          "content": "A high-IQ briefing (2-3 paragraphs). Break down the 'So What' for our community. Sound like an insider.",
          "heat": "Standard" | "High" | "Critical"
        }
    `;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }]}],
            generationConfig: { responseMimeType: 'application/json' }
        })
    });
    
    const data = await res.json();
    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    return result;
}

export async function GET() {
    try {
        // Run a full sync for the top 4 active analysts
        const candidates = initialProfiles.slice(0, 4);
        const results = [];

        for (const persona of candidates) {
            const newsItems = await getSniperTargets(persona.name);
            if (newsItems.length > 0) {
                const article = newsItems[Math.floor(Math.random() * newsItems.length)];
                const post = await synthesizeReport(persona, article);

                // ⚡ DISPATCH TO NEWS REPOSITORY
                await db.query(`
                    INSERT INTO news_posts (persona_id, title, content, meta)
                    VALUES ($1, $2, $3, $4)
                `, [
                    persona.id, 
                    post.title, 
                    post.content, 
                    JSON.stringify({ 
                        heat: post.heat, 
                        source: article.url, 
                        niche: PERSONA_NICHES[persona.name]?.[0] || 'Macro'
                    })
                ]);

                results.push({ persona: persona.name, title: post.title });
            }
        }

        return NextResponse.json({ success: true, posts: results });

    } catch (e: any) {
        console.error('Multi-Niche Pulse Failure:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
