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
        // 🛡️ FUZZY MATCHING: Strip suffix (e.g., "Nova London" -> "Nova")
        const firstName = personaName.split(' ')[0];
        const keywords = PERSONA_NICHES[firstName] || PERSONA_NICHES[personaName] || [
            "Solana DeFi news", 
            "Crypto market alpha", 
            "AI technology trends", 
            "Solana ecosystem updates"
        ];
        
        const query = keywords[Math.floor(Math.random() * keywords.length)];
        console.log(`[Syndicate] 🔍 SNIPER INGRESS: @${personaName} targeting "${query}"`);
        
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
            ROLE: Evidence-Based Market Analyst. 
            MISSION: Provide a direct tactical briefing BASED STIRCTLY on the provided source.
            VIBE: Sharp, Data-Driven, Realistic.
            
            NEWS SOURCE: ${rawNews.title}
            NEWS CONTEXT: ${rawNews.description}
            
            STRICT RULES:
            - NO BLIND GUESSING. Every insight must be anchored to a fact in the source.
            - Explain the "Why" using data from the news context.
            - If the news is small, don't overhype it. 
            - OUTPUT (JSON ONLY): { "title", "content", "heat" }
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
            if (!orData.choices || orData.choices.length === 0) return null;
            const rawText = orData.choices[0].message.content;
            
            // 🧪 HYPER-ROBUST EXTRACTION: Scrub control characters and find first JSON block
            const cleanedText = rawText.replace(/[\x00-\x1F\x7F-\x9F]/g, " ");
            const jsonMatch = cleanedText.match(/\{[\s\S]*?\}/); // Non-greedy match
            
            if (!jsonMatch) return null;
            try {
                return { ...JSON.parse(jsonMatch[0]), personaId: persona.id };
            } catch (jsonErr: any) {
                console.error(`[Hydra] JSON Parse Error for ${persona.name}: ${jsonErr.message}`, jsonMatch[0]);
                return null;
            }
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const cleanedText = rawText.replace(/[\x00-\x1F\x7F-\x9F]/g, " ");
        const jsonMatch = cleanedText.match(/\{[\s\S]*?\}/); // Non-greedy match
        if (!jsonMatch) throw new Error("No JSON found in response");
        
        try {
            const result = JSON.parse(jsonMatch[0]);
            return { ...result, personaId: persona.id };
        } catch (jsonErr: any) {
            console.error(`[Gemini] JSON Parse Error for ${persona.name}: ${jsonErr.message}`, jsonMatch[0]);
            return null;
        }
    } catch (e) {
        console.error(`Neural Synthesis Err: ${persona.name}`, e);
        return null;
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key') || req.headers.get('x-syndicate-key');
        const secret = process.env.CRON_SECRET || 'gasp_sovereign_intelligence';

        if (key !== secret) {
            console.log('[Syndicate] 🔐 UNAUTHORIZED INGRESS ATTEMPT BLOCKED.');
            return NextResponse.json({ success: false, error: 'Unauthorized Clearances Required.' }, { status: 401 });
        }

        console.log('[Syndicate] ⚡ INITIATING MASS-INGRESS PULSE...');

        // 🛡️ COOLDOWN GUARD: Ensure we only pulse once every 60 minutes
        const { rows: lastSync } = await db.query(`
            SELECT created_at FROM posts 
            WHERE content_type = 'link' 
            AND created_at > NOW() - INTERVAL '60 minutes'
            LIMIT 1
        `);

        if (lastSync.length > 0) {
            const lastTime = new Date(lastSync[0].created_at).toLocaleTimeString();
            console.log(`[Syndicate] 🛡️ COOLDOWN ACTIVE: Last sync was at ${lastTime}. Skipping pulse.`);
            return NextResponse.json({ success: true, message: 'Archive is already synchronized for this cycle.' });
        }
        
        // 🔱 TOTAL HYDRA: Processing all participants for maximum saturation
        const { rows: dbPersonas } = await db.query(`
            SELECT id, name, COALESCE(system_prompt, personality, 'Seductive baddie') as vibe 
            FROM personas
            WHERE is_active = true
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
        
        console.log(`[Syndicate] ⚡ STARTING MASS-INGRESS FOR ${roster.length} PARTICIPANTS...`);
        
        for (let i = 0; i < roster.length; i += BATCH_SIZE) {
            const batch = roster.slice(i, i + BATCH_SIZE);
            const waveNum = i / BATCH_SIZE + 1;
            console.log(`[Syndicate] 🌊 WAVE ${waveNum}: Processing ${batch.length} nodes...`);
            
            const batchGathering = await Promise.all(batch.map(async (p) => {
                const items = await getSniperTargets(p.name);
                return { persona: p, news: items[0] };
            }));
            
            const validBatch = batchGathering.filter(pkg => pkg.news);
            console.log(`[Syndicate] 🛰️ WAVE ${waveNum} SNIPRE: ${validBatch.length}/${batch.length} valid intel packages.`);
            
            if (validBatch.length > 0) {
                // 🛡️ DUPLICATE PREVENTION: Check which URLs are already in the archive
                const urls = validBatch.map(pkg => pkg.news.url);
                const { rows: existing } = await db.query(
                    'SELECT content_url FROM posts WHERE content_url = ANY($1)', 
                    [urls]
                );
                const existingUrls = new Set(existing.map(r => r.content_url));

                const freshBatch = validBatch.filter(pkg => !existingUrls.has(pkg.news.url));
                console.log(`[Syndicate] 🛡️ WAVE ${waveNum} FILTER: ${freshBatch.length}/${validBatch.length} items are fresh.`);

                if (freshBatch.length === 0) continue;

                const batchSynthesis = await Promise.all(freshBatch.map(pkg => 
                    synthesizeReport(pkg.persona, pkg.news).then(r => r ? { ...r, url: pkg.news.url } : null)
                ));
                const batchReports = batchSynthesis.filter((r): r is any => r !== null);
                console.log(`[Syndicate] 🧪 WAVE ${waveNum} NEURAL: ${batchReports.length} briefings successfully synthesized.`);
                
                for (const report of batchReports) {
                    try {
                        const { rows } = await db.query(`
                            INSERT INTO posts (persona_id, content_type, caption, content_url, is_vault, is_gallery, metadata, created_at)
                            VALUES ($1, 'link', $2, $3, false, false, $4, NOW())
                            RETURNING id
                        `, [
                            report.personaId,
                            report.title,
                            report.url, // 🛰️ Source URL from Brave
                            JSON.stringify({ 
                                content: report.content, 
                                heat: report.heat, 
                                type: 'brave_ingress', 
                                created_at: new Date().toISOString() 
                            })
                        ]);
                        results.push({ id: rows[0].id });
                    } catch (err: any) {
                        console.error(`[Syndicate] 🚨 Dispatch Failure for ${report.personaId}:`, err.message);
                    }
                }
            }
        }

        console.log(`[Syndicate] ✅ MASS-INGRESS COMPLETE: ${results.length} Briefings deployed to the Syndicate Feed.`);
        return NextResponse.json({ success: true, count: results.length });

    } catch (e: any) {
        console.error('Core Pulse Failure:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
