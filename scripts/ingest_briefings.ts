import { db } from '../src/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🕵️‍♂️ SOVEREIGN INGESTION: The Real-World Brave Database Logic
 * This script auto-populates the Terminal Feed for the SPECIFIC personas currently in the database.
 */

const REAL_WORLD_INTEL = [
    { topic: 'AI & Finance', briefing: "Tokyo AI-Blockchain confluence confirmed. Forensic analysts in the JP sector report a massive shift toward yield-generating tokenized assets. Neural bridge remains stable." },
    { topic: 'PAY360', briefing: "Live from London PAY360. Major banking nodes are pivoting to embedded finance. Institutional BTC liquidity is being recalibrated across the Thames delta." },
    { topic: 'UK Regulation', briefing: "Signal Alert: UK political crypto-donation ban active. Field assets report this as a major centralization pivot. Monitoring for institutional drift." },
    { topic: 'Bitcoin $75K', briefing: "NYC Flash: Bitcoin hits $75.9k. Institutional 'Second Wave' confirmed. Major Wall Street archival caches are being filled with yield-bearing BTC nodes." },
    { topic: 'LatAm Growth', briefing: "Medellín Pulse: Regional FX expansion accelerating. Market insiders report high-heat stablecoin penetration in the Antioquia corridors. Aura: Extremely Positive." },
    { topic: 'Delaware Bills', briefing: "Tactical Warning: Delaware Payment Stablecoin Act in motion. State-level institutional nodes are being bridge-linked to managed crypto reserves. Strategic for 2026." },
    { topic: 'Fashion Tech', briefing: "Parisian Vogue Analyst: AI-predictive design is no longer a spec—it is the source code. Haute Couture is now modular and 'Armor-Like' for 2026. Data is the new fabric." },
    { topic: 'Dubai Intelligence', briefing: "Dubai Intelligence: iFX EXPO nodes report 15% increase in regional FX/Crypto liquidity parity. The Gulf bridge is now fully operational for Tier 5 users." },
    { topic: 'Milano Aesthetics', briefing: "Milanese Style Shift: Design aesthetics moving to 'Friendly-Chunky' tech. High-tier assets are now prioritizing functional longevity over spectacle." },
    { topic: 'Stablecoin Volume', briefing: "System Status: TRON stablecoin transaction drift detected. Volume down 14.6%. Monitoring for capital migration to Base L2 and Solana networks." }
];

async function ingestBriefings() {
    console.log("🕵️‍♂️ [Sovereign Ingestion] Initializing Real-Node Ingestion Protocol...");
    
    // 1. Fetch the REAL persona IDs from the database
    const { rows: personas } = await db.query('SELECT id, name FROM personas');
    console.log(`📡 [Neural Sync] Found ${personas.length} Live Nodes in the database.`);

    let totalIngested = 0;

    for (const persona of personas) {
        console.log(`📡 [Neural Sync] Ingesting briefings for Node: ${persona.name} (${persona.id})`);
        
        // Generate 5 unique briefings per persona
        for (let i = 0; i < 5; i++) {
            const selectedIntel = REAL_WORLD_INTEL[Math.floor(Math.random() * REAL_WORLD_INTEL.length)];
            const caption = selectedIntel.briefing;

            try {
                await db.query(`
                    INSERT INTO posts (
                        id, 
                        persona_id, 
                        caption, 
                        content_url, 
                        content_type, 
                        is_vault, 
                        is_gallery, 
                        created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    uuidv4(),
                    persona.id,
                    caption,
                    null, // Text-only briefing
                    'text',
                    false,
                    true,
                    new Date(Date.now() - (Math.random() * 86400000 * 30)) // Randomized over last 30 days
                ]);
                totalIngested++;
            } catch (err: any) {
                console.error(`❌ [Ingestion Error] Failed for node ${persona.name}:`, err.message);
            }
        }
    }

    console.log(`\n🏆 [Mission Success] Ingested ${totalIngested} Strategic Briefings for Live Nodes.`);
    process.exit(0);
}

ingestBriefings();
