import { Pool } from 'pg';

const globalForPool = global as unknown as { pool: Pool };

const getPool = () => {
  if (globalForPool.pool) return globalForPool.pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ [DATABASE] FATAL: DATABASE_URL not set in environment.');
    throw new Error('DATABASE_URL not set.');
  }
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 15,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000, // 🛡️ 5s window for Railway proxy
  });
  if (process.env.NODE_ENV !== 'production') globalForPool.pool = pool;
  return pool;
};

export const db = {
  query: (text: string, params?: any[]) => getPool().query(text, params),
  connect: () => getPool().connect(),
};

export async function recordShadowBurn(userId: string, credits: number, client?: any) {
    const pointsMatched = credits;
    const q = client || db;
    try {
        await q.query(`
            INSERT INTO syndicate_points (user_id, points, total_spent_credits)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id) DO UPDATE SET 
                points = syndicate_points.points + $2,
                total_spent_credits = syndicate_points.total_spent_credits + $3,
                last_updated = NOW()
        `, [userId, pointsMatched, credits]);
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