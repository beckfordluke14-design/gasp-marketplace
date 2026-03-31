import { Pool } from 'pg';

/**
 * 🛡️ SOVEREIGN NEURAL BRIDGE: The Safe Postgres Interface
 * This singleton Pool handles all the direct database connections to Railway.
 * We use the global object to persist the pool across Next.js hot-reloads.
 */

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:glrVNXPAMlJbeRzeNEziqUiOfPIXDjOf@gondola.proxy.rlwy.net:54825/railway";

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
};

/**
 * 🔥 AUTOMATED SHADOW BURN & GASP POINTS MATCHING
 * Mission: Execute the 1:1 match and update global deflationary stats.
 */
export async function recordShadowBurn(userId: string, credits: number) {
    const pointsMatched = credits; // 1:1 Matching Logic
    try {
        await db.query(`
            INSERT INTO syndicate_points (user_id, points, total_spent_credits)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id) DO UPDATE SET 
                points = syndicate_points.points + $2,
                total_spent_credits = syndicate_points.total_spent_credits + $3,
                last_updated = NOW()
        `, [userId, pointsMatched, credits]);

        await db.query(`
            UPDATE global_burn_stats 
            SET total_burned_credits = total_burned_credits + $1,
                total_points_issued = total_points_issued + $2
            WHERE id = 1
        `, [credits, pointsMatched]);
    } catch (e) {
        console.error('Shadow Burn Logic Failure:', e);
    }
}


export default db;
