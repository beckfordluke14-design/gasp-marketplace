import { Pool } from 'pg';

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
  max: 15,
  idleTimeoutMillis: 10000, 
  connectionTimeoutMillis: 2000, 
});

if (process.env.NODE_ENV !== 'production') globalForPool.pool = pool;

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  connect: () => pool.connect(),
};

/**
 * 🔥 AUTOMATED SHADOW BURN & GASP POINTS MATCHING
 */
export async function recordShadowBurn(userId: string, credits: number, client?: any) {
    const pointsMatched = credits;
    const q = client || db;

    try {
        // 1. Update User's Syndicate Points
        await q.query(`
            INSERT INTO syndicate_points (user_id, points, total_spent_credits)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id) DO UPDATE SET 
                points = syndicate_points.points + $2,
                total_spent_credits = syndicate_points.total_spent_credits + $3,
                last_updated = NOW()
        `, [userId, pointsMatched, credits]);

        // 2. Update Global Burn Stats
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
        throw e;
    }
}

export default db;
