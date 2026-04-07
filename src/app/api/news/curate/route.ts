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
            ROLE: Syndicate Intelligence Analyst representing ${persona.name}. 
            MISSION: Provide a high-status tactical briefing based on the following news.
            VIBE: Strategic, Authoritative, Professional.
            
            NEWS SOURCE: ${rawNews.title}
            NEWS CONTEXT: ${rawNews.description}
            
            OUTPUT (JSON ONLY):
            {
              "title": "[Briefing] Short Tactical Headline",
              "content": "2-3 paragraphs of expert strategic analysis. Sound professional and institutional.",
              "heat": "High" | "Critical" | "Standard"
            }
        `;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }]}]
            })
        });
        
        let data = await res.json();
        
        // 🔄 HYDRA FAILOVER: If Gemini fails (Safety/400), pivot to OpenRouter Llama-3
        if (!data.candidates || data.candidates.length === 0 || res.status !== 200) {
            console.log(`[Hydra] Pivot to Llama-3 for ${persona.name}...`);
            const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "meta-llama/llama-3-70b-instruct",
                    "messages": [{"role": "system", "content": prompt}]
                })
            });
            const orData = await orRes.json();
            const rawText = orData.choices[0].message.content;
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;
            return { ...JSON.parse(jsonMatch[0]), personaId: persona.id };
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");
        
        const result = JSON.parse(jsonMatch[0]);
        return { ...result, personaId: persona.id };
    } catch (e) {
        console.error(`Neural Synthesis Err: ${persona.name}`, e);
        return null;
    }
}

export async function GET() {
    try {
        console.log('[Syndicate] ⚡ INITIATING MASS-INGRESS PULSE...');
        
        // 🔱 TOTAL HYDRA: Processing all participants for maximum saturation
        const { rows: dbPersonas } = await db.query(`
            SELECT id, name, COALESCE(system_prompt, personality, 'Seductive baddie') as vibe 
            FROM personas
        `);
        
        const roster = dbPersonas; 
        console.log(`[Syndicate] 🔱 DYNAMIC ROSTER PULSE: Found ${roster?.length || 0} participants.`);
        
        if (!roster || roster.length === 0) {
            console.log('[Syndicate] 🚨 ROSTER IS EMPTY IN DB.');
            return NextResponse.json({ success: false, error: 'No active personas found' });
        }
        
        // 🌊 SERIAL WAVE PROTOCOL: Processing 125+ personas in batches of 10 for total stability
        const results = [];
        const BATCH_SIZE = 10;
        
        for (let i = 0; i < roster.length; i += BATCH_SIZE) {
            const batch = roster.slice(i, i + BATCH_SIZE);
            console.log(`[Syndicate] 🌊 Processing Wave ${i / BATCH_SIZE + 1}...`);
            
            const batchGathering = await Promise.all(batch.map(async (p) => {
                const items = await getSniperTargets(p.name);
                return { persona: p, news: items[0] };
            }));
            
            const validBatch = batchGathering.filter(pkg => pkg.news);
            const batchSynthesis = await Promise.all(validBatch.map(pkg => synthesizeReport(pkg.persona, pkg.news)));
            const batchReports = batchSynthesis.filter((r): r is any => r !== null);
            
            for (const report of batchReports) {
                try {
                    // 🛡️ SOVEREIGN SANITIZATION: Prevent name crashes (Malia R., etc)
                    const sanitizedId = String(report.personaId).replace(/[^a-zA-Z0-9-]/g, '-');
                    
                    const { rows } = await db.query(`
                        INSERT INTO posts (persona_id, content_type, caption, content, is_vault, is_gallery, meta)
                        VALUES ($1, 'text', $2, $3, false, false, $4)
                        RETURNING id
                    `, [
                        sanitizedId,
                        report.title,
                        report.content,
                        JSON.stringify({ heat: report.heat, type: 'brave_ingress', created_at: new Date().toISOString() })
                    ]);
                    results.push({ id: rows[0].id });
                    console.log(`[Success] Briefing Deployed for ${sanitizedId}`);
                } catch (err: any) {
                    console.error(`Sovereign Dispatch Failure: ${err.message}`);
                }
            }
        }

        console.log(`[Syndicate] ✅ DYNAMIC MASS-INGRESS COMPLETE: ${results.length} Briefings Deployed.`);
        return NextResponse.json({ success: true, count: results.length });

    } catch (e: any) {
        console.error('Core Pulse Failure:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
