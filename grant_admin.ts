
import { db } from './src/lib/db';

async function grantAdminWealth() {
  const adminId = '75d19cfb-86ec-4991-88df-bf0616b38c21'; // Typical UUID for the first user
  console.log('🚨 Restoring from Ledger...');
  // Check users table, if it has the original balance
  try {
     const { rows: users } = await db.query('SELECT id, credit_balance FROM users WHERE credit_balance > 0');
     console.log('Users backup balances:', users);
     
     // Recalculate from transactions as fallback
     const { rows: txs } = await db.query(`
         SELECT user_id, 
            SUM(CASE WHEN type IN ('grant', 'admin_grant', 'starter_claim', 'purchase', 'top_up', 'automatic_solana_pay_sync') THEN amount ELSE -amount END) as calc_bal
         FROM transactions
         GROUP BY user_id
     `);
     console.log('Transaction calculated balances:', txs);

     // Let's reset is_admin for everyone except beckford
     await db.query(`UPDATE profiles SET is_admin = false WHERE email NOT ILIKE '%beckford%' AND email NOT ILIKE '%luke%'`);
     
     // Apply the recalculated balances
     for (const tx of txs) {
         await db.query('UPDATE profiles SET credit_balance = $1 WHERE id = $2', [Math.max(0, parseInt(tx.calc_bal)), tx.user_id]);
     }
     console.log('✅ Balances Restored from Ledger.');
  } catch (err) {
      console.error(err);
  }
}

grantAdminWealth().catch(console.error);
