import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * 🛰️ SYNDICATE REPLY SNIPER v1.0
 * Objective: Infiltrate high-status X conversations to drive massive platform ingress.
 */

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

export async function POST(req: Request) {
    try {
        const { targetTweet, targetHandle, personaId } = await req.json();
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');
        
        if (key !== (process.env.CRON_SECRET || 'gasp_sovereign_intelligence')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 🛡️ 1. Fetch the Persona's Identity and Latest Alpha
        const { rows: personas } = await db.query('SELECT * FROM personas WHERE id = $1', [personaId]);
        const persona = personas[0];

        const { rows: latestNews } = await db.query(`
            SELECT caption, metadata->>'content' as analysis
            FROM posts 
            WHERE persona_id = $1 AND content_type = 'link'
            ORDER BY created_at DESC LIMIT 1
        `, [personaId]);
        const alpha = latestNews[0];

        // 🧠 2. Neural Reply Synthesis
        const prompt = `
            NAME: ${persona.name}. VIBE: ${persona.vibe}.
            REPLYING TO @${targetHandle}: "${targetTweet}"
            LATEST INSIGHT: "${alpha?.title}: ${alpha?.analysis}"
            
            MISSION: Post a smart, high-status, human-sounding reply.
            STRICT RULES:
            - NO MUSH. No "Great point", "I agree", or "Interesting".
            - Jump straight to the take. Be sharp and slightly opinionated.
            - Write like an insider who doesn't have time to be polite.
            - No hashtags. No emojis.
            - Max 200 characters.
        `;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }]}]})
        });
        const geminiData = await geminiRes.json();
        const replyText = geminiData.candidates[0].content.parts[0].text.trim();

        // 🛰️ 3. Return the payload to the VPS Ghost for dispatch
        return NextResponse.json({ 
            success: true, 
            reply: replyText,
            target_account: targetHandle,
            persona: persona.name
        });

    } catch (e: any) {
        console.error('Reply Sniper Brain Failure:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
