
import { db } from '@/lib/db';

/**
 * 🛰️ STRATEGIC INTEL AGGREGATOR
 * Pulls Real-Time "High-Heat" Alpha for the Neural Pulse Hub.
 * Zero-Cost, Technical-Focus.
 */

const ANALYST_IDS = ['valentina-lima', 'kaelie-rose', 'reina-m', 'astra-vega'];

export async function GET() {
    try {
        // 1. 🔍 PULL HIGH-HEAT ALPHA (Using CryptoPanic Free Feed)
        // Note: For a zero-key approach, we use their public filter or a technical proxy.
        const res = await fetch('https://cryptopanic.com/api/v1/posts/?auth_token=PUBLIC&public=true&filter=hot', {
            next: { revalidate: 3600 } // Cache for 1 hour to prevent rate limits
        });
        
        let intelPostings = [];
        
        if (res.ok) {
            const data = await res.json();
            intelPostings = data.results.slice(0, 10).map((post: any) => ({
                title: post.title.toUpperCase(),
                heat: post.votes?.liked > 10 ? 'Critical' : 'High'
            }));
        } else {
            // Fallback to Sovereign Hardened Mocks if external node is down
            intelPostings = [
                { title: 'SOLANA TVL SPIKE: SECTOR 07 // DETECTED', heat: 'Critical' },
                { title: 'ALPHA NODE RECOVERY: SYNC 100%', heat: 'High' }
            ];
        }

        // 2. 🦾 SYNC TO DATABASE
        if (intelPostings.length > 0) {
            // Clear old cache
            await db.query('DELETE FROM news_posts');
            
            for (const post of intelPostings) {
                const randomAnalyst = ANALYST_IDS[Math.floor(Math.random() * ANALYST_IDS.length)];
            await db.query(
                'INSERT INTO news_posts (persona_id, title, heat) VALUES ($1, $2, $3)',
                [randomAnalyst, post.title, post.heat]
            );
            }
        }

        return NextResponse.json({ 
            success: true, 
            synced: intelPostings.length, 
            status: 'Strategic Intel Hub Online' 
        });

    } catch (err: any) {
        console.error('❌ INTEL SYNC FAILURE:', err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
