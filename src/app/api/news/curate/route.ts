import { db } from '@/lib/db';
import { initialProfiles } from '@/lib/profiles';
import { NextResponse } from 'next/server';

/**
 * 🛰️ THE CONTENT SNIPER v1.0 - SYNDICATE HQ
 * Mission: Automated Curation, Persona-coded Synthesis, Neural Pulse Dispatch.
 */

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || ''; // 🛡️ Using user's Brave credits
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

const TRENDING_KEYWORDS = [
    'Solana Whale Accumulation', 
    'Base L2 Bridge Alert', 
    'Luxury Penthouse Bitcoin', 
    'AI Token Breakout',
    'Crypto Baddie Lifestyle Santiago',
    'Whale Wallet Tracking'
];

async function getSniperTargets() {
    // Select a random trending topic to "Snipe"
    const keyword = TRENDING_KEYWORDS[Math.floor(Math.random() * TRENDING_KEYWORDS.length)];
    const res = await fetch(`https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(keyword)}&count=5`, {
        headers: { 'Accept': 'application/json', 'X-Subscription-Token': BRAVE_API_KEY }
    });
    const data = await res.json();
    return data.results || [];
}

async function synthesizePost(persona: any, rawNews: any) {
    const prompt = `
        YOU ARE ${persona.name}. 
        VIBE: ${persona.vibe}. 
        ROLE: High-IQ Intelligence Asset.
        PERSONALITY: ${persona.personality || 'smart, sarcastic, and market-aware'}.
        SYSTEM RULES: ${persona.systemPrompt.substring(0, 300)}.
        
        MISSION: Provide a TACTICAL INTELLIGENCE BRIEFING based on this REAL news. 
        PROVE YOUR AUTHORITY: Do not just rewrite the news; provide a high-IQ, cynical "Insider" take. 
        Sound like you understand the technicals (TVL, Liquidations, Whale wallets, etc.) even while staying in your unique voice.
        
        REAL NEWS: ${rawNews.title} - ${rawNews.description}
        
        FORMAT (JSON):
        {
          "title": "A tactical, authority-driven headline (e.g. [DECRYPTED], [MACRO ALERT])",
          "content": "A high-IQ, inside-track briefing (2 paragraphs). Connect the news to the broader Syndicate economy if possible.",
          "heat": "Standard" | "High" | "Critical",
          "hook": "A viral tactical hook for X/Shorts."
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
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

export async function GET() {
    try {
        // 1. SELECT PERSONAS (Limit to 5 per cycle to stay within API limits)
        const candidates = [...initialProfiles].sort(() => 0.5 - Math.random()).slice(0, 5);
        const snipedArticles = await getSniperTargets();

        if (snipedArticles.length === 0) return NextResponse.json({ success: false, error: 'No sniper targets found.' });

        const results = [];
        for (const persona of candidates) {
            // Pick a random article to react to
            const article = snipedArticles[Math.floor(Math.random() * snipedArticles.length)];
            const post = await synthesizePost(persona, article);

            // 2. DISPATCH TO NEURAL PULSE
            await db.query(`
                INSERT INTO news_posts (persona_id, title, content, image_url, source_url, meta)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                persona.id, 
                post.title, 
                post.content, 
                persona.image, // Use persona image for now (Grok integration next)
                article.url,
                JSON.stringify({ heat: post.heat, hook: post.hook, BRAVE_ID: article.id })
            ]);

            results.push({ persona: persona.name, title: post.title });
        }

        return NextResponse.json({ success: true, count: results.length, posts: results });

    } catch (e: any) {
        console.error('Sniper Failure:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
