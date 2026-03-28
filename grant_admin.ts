
import { db } from './src/lib/db';

async function grantAdminWealth() {
  const adminId = '75d19cfb-86ec-4991-88df-bf0616b38c21'; // Typical UUID for the first user
  console.log('💎 [Sovereign] Granting 1M Coins to Admin...');
  
  await db.query(`
    UPDATE profiles 
    SET credit_balance = 1000000,
        updated_at = NOW()
    WHERE id = $1 OR nickname ilike '%admin%' OR nickname ilike '%beckford%'
  `, [adminId]);
  
  console.log('✅ Admin Credits Synchronized.');
}

grantAdminWealth().catch(console.error);
