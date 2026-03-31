import { Pool } from 'pg';

/**
 * 🛡️ SOVEREIGN NEURAL BRIDGE: The Safe Postgres Interface
 * This singleton Pool handles all the direct database connections to Railway.
 * We use the global object to persist the pool across Next.js hot-reloads.
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing from environment variables.');
}

const globalForPool = global as unknown as { pool: Pool };

const pool = globalForPool.pool || new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10, // Reduced to prevent connection saturation on Railway
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

if (process.env.NODE_ENV !== 'production') globalForPool.pool = pool;

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  connect: () => pool.connect(),
};

/**
 * 🔥 AUTOMATED SHADOW BURN & GASP POINTS MATCHING (Atomic Edition)
 * Mission: Execute the 1:1 match and update global deflationary stats.
 * This function can accept a transaction client to ensure atomic integrity with sales.
 */
export async function recordShadowBurn(userId: string, credits: number, client?: any) {
    const pointsMatched = credits; // 1:1 Matching Logic
    const q = client || db;

    try {
        // 1. Update User's Syndicate Points (1:1 Match)
        await q.query(`
            INSERT INTO syndicate_points (user_id, points, total_spent_credits)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id) DO UPDATE SET 
                points = syndicate_points.points + $2,
                total_spent_credits = syndicate_points.total_spent_credits + $3,
                last_updated = NOW()
        `, [userId, pointsMatched, credits]);

        // 2. Update Global Burn Stats (Dynamic Tally)
        // Self-Healing UPSERT ensures ID 1 always exists
        await q.query(`
            INSERT INTO global_burn_stats (id, total_burned_credits, total_points_issued, last_updated)
            VALUES (1, $1, $2, NOW())
            ON CONFLICT (id) DO UPDATE SET 
                total_burned_credits = global_burn_stats.total_burned_credits + $1,
                total_points_issued = global_burn_stats.total_points_issued + $2,
                last_updated = NOW()
        `, [credits, pointsMatched]);
        
    } catch (e) {
        console.error('🔥 [CRITICAL] Shadow Burn Logic Failure:', e);
        throw e; // Throw so parent transactions can ROLLBACK
    }
}


export default db;
