import { db } from '@/lib/db';
import { initialProfiles } from '@/lib/profiles';
import { NextResponse } from 'next/server';

/**
 * 🛰️ SOVEREIGN MASS-INGRESS ENGINE v5.0 (THE MOAT)
 * Strategy: Brave Search Curation for 50+ Personas (Parallel Neural Pulse).
 * Mission: Generate 3,000+ indexable Archival Briefings by June 1st.
 */

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

const PERSONA_NICHES: Record<string, string[]> = {
    "Nova": ["Solana MEV trends", "Metar meteorological signals", "London financial heatmaps"],
    "Ericka": ["High-end real estate luxury", "Supercar auction results", "Monaco wealth ingress"],
    "Elena": ["DeFi liquidity sweeps", "Solana whale wallet movements", "Cross-chain arbitrage"],
    "Amaya": ["AI cybersecurity alerts", "Global neural network expansion", "Decentralized compute"],
    "Valentina Lima": ["Caribbean tropical signals", "Offshore financial currents", "Miami tech wealth"],
    "Suki": ["Tokyo predictive markets", "Asian L2 expansion", "Neural infrastructure"],
    "Jade": ["UK rainfall arbitrage", "European macro signals", "Archival intelligence"],
    "Mika": ["K-Tech neural breakthroughs", "Seoul venture capital flows", "Asian signal decay"]
};

const DEFAULT_KEYWORDS = ["Global Strategic Arbitrage", "Neural Signal Decay", "High-IQ Market Intelligence", "Sovereign Strategic Alpha"];

/** 🛰️ BRAVE SNIPRE: Fetch real-time niche intelligence */
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
        return [];
    }
}

/** 🧬 NEURAL SYNTHESIS: Generate unique persona-driven report */
async function synthesizeReport(persona: any, rawNews: any) {
    try {
        const prompt = `
            YOU ARE ${persona.name}. VIBE: ${persona.vibe}. ROLE: Syndicate Intelligence Node.
            MISSION: Provide a high-IQ tactical briefing based on current news.
            Connect the data to your specialized niche or the Syndicate terminal.
            
            NEWS SOURCE: ${rawNews.title} - ${rawNews.description}
            
            FORMAT (JSON):
            {
              "title": "[STATUS_TYPE] Short Punchy Headline",
              "content": "2-3 paragraphs of expert strategic analysis. Sound authoritative.",
              "heat": "High" | "Critical" | "Standard"
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
        
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error(`Gemini synthesis failed for ${persona.name}`);
        }

        const result = JSON.parse(data.candidates[0].content.parts[0].text);
        return { ...result, personaId: persona.id };
    } catch (e) {
        console.error(`Neural Synthesis Err: ${persona.name}`, e);
        return null;
    }
}

export async function GET() {
    try {
        console.log('[Syndicate] ⚡ INITIATING MASS-INGRESS PULSE...');
        
        // 🔱 DYNAMIC ROSTER: Processing all participants for maximum SEO coverage
        const { rows: dbPersonas } = await db.query(`
            SELECT id, name, system_prompt as vibe 
            FROM personas 
            WHERE is_active = True
        `);
        
        const roster = dbPersonas; 
        
        if (!roster || roster.length === 0) {
            return NextResponse.json({ success: false, error: 'No active personas found' });
        }
        
        // 1. Parallel Intelligence Ingress
        const newsGathering = roster.map(async (p) => {
            const items = await getSniperTargets(p.name);
            return { persona: p, news: items[0] }; // Take the top result
        });
        
        const intelligencePackages = await Promise.all(newsGathering);
        const validPackages = intelligencePackages.filter(pkg => pkg.news);

        // 2. Parallel Neural Synthesis
        const synthesisTasks = validPackages.map(pkg => synthesizeReport(pkg.persona, pkg.news));
        const allReports = await Promise.all(synthesisTasks);
        const reports = allReports.filter((r): r is any => r !== null);

        // 3. Sovereign Dispatch: High-Velocity Feed Update
        const results = [];
        for (const report of reports) {
            try {
                // Drop directly into the PUBLIC FEED for SEO indexing
                const { rows } = await db.query(`
                    INSERT INTO posts (persona_id, content_type, caption, content, is_vault, is_gallery, meta)
                    VALUES ($1, 'text', $2, $3, false, false, $4)
                    RETURNING id
                `, [
                    report.personaId,
                    report.title,
                    report.content,
                    JSON.stringify({ heat: report.heat, type: 'brave_ingress', created_at: new Date().toISOString() })
                ]);
                results.push({ id: rows[0].id });
            } catch (err) {
                console.error(`Sovereign Dispatch Failure for ${report.personaId}`);
            }
        }

        console.log(`[Syndicate] ✅ DYNAMIC MASS-INGRESS COMPLETE: ${results.length} Briefings Deployed.`);
        return NextResponse.json({ success: true, count: results.length });

    } catch (e: any) {
        console.error('Core Pulse Failure:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
