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

export default db;
