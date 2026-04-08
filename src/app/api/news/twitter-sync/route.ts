import { db } from '@/lib/db';
import { TwitterApi } from 'twitter-api-v2';
import { NextResponse } from 'next/server';

/**
 * 🛰️ SYNDICATE TWITTER DISPATCHER v1.0
 * Strategy: High-Status Intelligence Signal Ingress to X (Twitter).
 */

const TWITTER_CONFIG = {
    appKey: process.env.TWITTER_API_KEY || '',
    appSecret: process.env.TWITTER_API_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
};

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');
        if (key !== (process.env.CRON_SECRET || 'gasp_sovereign_intelligence')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 🛡️ 1. Find latest high-heat post that hasn't been tweeted
        const { rows: eligible } = await db.query(`
            SELECT p.id, p.caption as title, p.metadata->>'content' as analysis, p.content_url, pers.name as persona_name
            FROM posts p
            JOIN personas pers ON p.persona_id = pers.id
            WHERE p.content_type = 'link'
            AND (p.metadata->>'tweeted' IS NULL OR p.metadata->>'tweeted' = 'false')
            ORDER BY p.created_at DESC
            LIMIT 5
        `);

        if (eligible.length === 0) {
            return NextResponse.json({ success: true, message: 'No new briefings to tweet.' });
        }

        // Pick the top one
        const target = eligible[0];

        // 🧠 2. Neural Re-framing for Twitter
        const prompt = `
            TOPIC: ${target.title}
            ANALYSIS: ${target.analysis}
            
            MISSION: Write a high-velocity tweet that connects the news to a logical market "Take".
            STRICT RULES:
            - NO BLIND GENERALIZING. The tweet must reflect the reality of the analysis.
            - Provide the "Why" behind the take.
            - Max 240 chars. No mush. No hashtags.
        `;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }]}]})
        });
        const geminiData = await geminiRes.json();
        const tweetText = geminiData.candidates[0].content.parts[0].text.trim();

        // 🔗 3. Construct the Syndicate Link
        const articleLink = `https://gasp.fun/news?id=${target.id}`;
        const finalTweet = `${tweetText}\n\nFull Briefing: ${articleLink}`;

        // 🛰️ 4. Dispatch to X
        if (!TWITTER_CONFIG.appKey) {
            console.log('[Twitter Sync] DRY RUN: Credentials missing. Tweet would be:', finalTweet);
        } else {
            const client = new TwitterApi(TWITTER_CONFIG);
            await client.v2.tweet(finalTweet);
            console.log('[Twitter Sync] ✅ DISPATCH SUCCESSFUL');
        }

        // 🛡️ 5. Stamp metadata
        const updatedMetadata = { 
            ...(eligible[0].metadata || {}), 
            tweeted: true, 
            tweeted_at: new Date().toISOString() 
        };
        await db.query(`UPDATE posts SET metadata = $1 WHERE id = $2`, [JSON.stringify(updatedMetadata), target.id]);

        return NextResponse.json({ success: true, tweet: finalTweet });

    } catch (e: any) {
        console.error('Twitter Sync Failure:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
