import { db } from '@/lib/db';
import { initialProfiles } from '@/lib/profiles';
import { NextResponse } from 'next/server';

/**
 * 🛰️ WEATHER INTELLIGENCE SNIPER v2.0 - SYNDICATE HQ
 * Mission: Persona-coded Weather Analysis & Arbitrage Teasing.
 */

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

// 🌪️ INTELLIGENCE VECTORS: Focused on weather-driven market moves
const WEATHER_KEYWORDS = [
    'Record heatwave March 2026',
    'Unexpected cold front NYC London',
    'Temperature anomaly global cities',
    'El Nino impact temperature bets',
    'Aviation weather sensor delays'
];

async function getSniperTargets() {
    try {
        const keyword = WEATHER_KEYWORDS[Math.floor(Math.random() * WEATHER_KEYWORDS.length)];
        const braveRes = await fetch(`https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(keyword)}&count=2`, {
            headers: { 'X-Subscription-Token': BRAVE_API_KEY }
        });
        const braveData = await braveRes.json();
        return braveData.results || [];
    } catch (e) {
        console.error('Brave Weather Snipe Failed:', e);
        return [];
    }
}

async function synthesizeReport(persona: any, rawNews: any) {
    const prompt = `
        YOU ARE ${persona.name}. 
        VIBE: ${persona.vibe}. 
        ROLE: Syndicate Weather Intelligence Analyst.
        NICHE: ${persona.city || 'Global Hubs'}.
        
        MISSION: Analyze this weather report for our ARBITRAGE SUBSCRIBERS.
        Connect the news to potential Polymarket temperature buckets.
        Sound like a high-IQ, tactical operator who knows the "Ground Truth."
        
        NEWS DATA: ${rawNews.title} - ${rawNews.description}
        
        FORMAT (JSON):
        {
          "title": "A tactical, authority-driven headline (e.g. [NYC ANOMALY], [HEATWAVE ALERT])",
          "content": "A high-IQ briefing (2 paragraphs). Mention specific temperature risks and why our users should check the Weather X board.",
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
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

export async function GET() {
    try {
        // Pick 3 random personas to act as reporters this cycle
        const candidates = [...initialProfiles].sort(() => 0.5 - Math.random()).slice(0, 3);
        const newsItems = await getSniperTargets();

        if (newsItems.length === 0) return NextResponse.json({ success: false, error: 'No weather intelligence found.' });

        const results = [];
        for (const persona of candidates) {
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
                JSON.stringify({ heat: post.heat, source: article.url, city: persona.city })
            ]);

            results.push({ persona: persona.name, title: post.title });
        }

        return NextResponse.json({ success: true, posts: results });

    } catch (e: any) {
        console.error('Weather Intel Failure:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
