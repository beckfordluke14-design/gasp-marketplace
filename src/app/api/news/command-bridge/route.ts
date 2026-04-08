import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * 🛰️ SYNDICATE COMMAND BRIDGE v1.0
 * Objective: Centralize news and reply payloads for the Remote Hijacker.
 */

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');
        if (key !== (process.env.CRON_SECRET || 'gasp_sovereign_intelligence')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Check for Pending High-Heat Briefings (Articles)
        const { rows: articles } = await db.query(`
            SELECT p.id, p.caption as title, p.metadata, p.metadata->>'content' as analysis, pers.name as persona_name, pers.image as persona_image
            FROM posts p
            JOIN personas pers ON p.persona_id = pers.id
            WHERE p.content_type = 'link'
            AND pers.is_active = true
            AND (p.metadata->>'tweeted' IS NULL OR p.metadata->>'tweeted' = 'false')
            ORDER BY p.created_at DESC
            LIMIT 1
        `);

        if (articles.length > 0) {
            const art = articles[0];
            
            // 🧠 NEURAL RE-FRAMING (X-NATIVE STRATEGY)
            // Instead of just a link, we generate a "Persona-Specific Take" to maximize X reach.
            const prompt = `
                PERSONA: ${art.persona_name}
                ARTICLE: ${art.title}
                ANALYSIS: ${art.analysis}

                MISSION: Write a high-status, native X post (no link yet) that presents this intel as a primary source dispatch.
                RULES:
                - Voice: Sharp, exclusive, authoritative.
                - Start with: [DISPATCH // ${art.persona_name.toUpperCase()}]
                - Length: Max 200 chars.
                - Vibe: Don't sound like a bot. Sound like an elite informant sharing alpha.
            `;

            let tweetContent = `${art.title}\n\nFull Intel: https://gasp.fun/news?id=${art.id}`;
            const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

            if (apiKey) {
                try {
                    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }]}]})
                    });
                    
                    if (geminiRes.ok) {
                        const geminiData = await geminiRes.json();
                        const aiTake = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                        if (aiTake) {
                            tweetContent = `${aiTake}\n\nFull Briefing: https://gasp.fun/news?id=${art.id}`;
                        }
                    }
                } catch (e) {
                    console.error('[Bridge] Neural Failover Triggered');
                }
            }
            
            // 🛡️ PRE-EMPTIVE LOCK: Mark as tweeted immediately upon dispatch 
            // to ensure no other pulse can pick it up if the bot takes a moment.
            const metadata = { ...(art.metadata || {}), tweeted: true, tweeted_at: new Date().toISOString() };
            await db.query('UPDATE posts SET metadata = $1 WHERE id = $2', [JSON.stringify(metadata), art.id]);

            return NextResponse.json({ 
                type: 'POST_ARTICLE', 
                id: art.id,
                payload: tweetContent,
                imageUrl: art.persona_image 
            });
        }

        return NextResponse.json({ type: 'IDLE', message: 'No pending tactical commands.' });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

/**
 * 🛡️ MARK AS DISPATCHED
 */
export async function POST(req: Request) {
    try {
        const { id } = await req.json();
        const { rows: post } = await db.query('SELECT metadata FROM posts WHERE id = $1', [id]);
        const metadata = { ...(post[0]?.metadata || {}), tweeted: true, tweeted_at: new Date().toISOString() };
        await db.query('UPDATE posts SET metadata = $1 WHERE id = $2', [JSON.stringify(metadata), id]);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
