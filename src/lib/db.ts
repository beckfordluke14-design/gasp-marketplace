
import { Pool } from 'pg';

// 🛡️ SOVEREIGN NEURAL BRIDGE: The Safe Postgres Interface
// This singleton Pool handles all the direct database connections to Railway.
const connectionString = "postgresql://postgres:glrVNXPAMlJbeRzeNEziqUiOfPIXDjOf@gondola.proxy.rlwy.net:54825/railway";

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // High-status throughput
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};

export default db;
