
import { db } from './src/lib/db';

async function auditAdmin() {
  const email = 'beckfordluke14@gmail.com';
  console.log(`🛡️ [Audit] Checking profile for ${email}...`);
  
  // 1. Grant 1M Credits + Set Admin Status
  const { rows: profiles } = await db.query(`
    UPDATE profiles 
    SET credit_balance = 1000000, 
        is_admin = true,
        updated_at = NOW()
    WHERE nickname ilike '%beckford%' OR id IN (
        SELECT id FROM profiles WHERE id LIKE 'did:p%' LIMIT 10
    )
    RETURNING id, nickname, credit_balance, is_admin
  `);
  
  console.log('✅ Allocation Complete:', profiles);
}

auditAdmin().catch(console.error);
