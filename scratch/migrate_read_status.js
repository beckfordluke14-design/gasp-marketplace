const { Pool } = require('pg');
const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
});

async function run() {
    try {
        console.log('📡 [Migration] Adding is_read column...');
        await pool.query('ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE');
        
        const { rows } = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'chat_messages'");
        console.log('✅ [Schema Check] Columns:', rows.map(r => r.column_name).join(', '));
    } catch(e) {
        console.error('❌ [Migration] FAILED:', e.message);
    } finally {
        await pool.end();
    }
}
run();
