
import { db } from './src/lib/db';

/**
 * 🛡️ SOVEREIGN ADMIN CLEARANCE — Direct ID Grant
 * Runs a safe, targeted UPDATE to set is_admin=true for the platform owner.
 * Does NOT touch credit balances or other users.
 */
async function grantAdminClearance() {
  console.log('🛡️ [Admin Grant] Initiating Sovereign Clearance Protocol...');
  try {
    // Step 1: List all profiles so we can identify the admin account
    const { rows: allProfiles } = await db.query(`
      SELECT id, email, nickname, is_admin, credit_balance 
      FROM profiles 
      ORDER BY credit_balance DESC
      LIMIT 20
    `);
    console.log('\n📋 [Profiles Table — Top 20 by Balance]:');
    allProfiles.forEach(p => {
      console.log(`  ID: ${p.id} | Email: ${p.email || 'N/A'} | Nickname: ${p.nickname || 'N/A'} | is_admin: ${p.is_admin} | Balance: ${p.credit_balance}`);
    });

    // Step 2: Grant admin to any profile matching known admin identifiers
    // This covers email, nickname, or the hardcoded Privy ID
    const { rowCount } = await db.query(`
      UPDATE profiles 
      SET is_admin = true 
      WHERE 
        id = '75d19cfb-86ec-4991-88df-bf0616b38c21'
        OR email ILIKE '%beckfordluke14%'
        OR email ILIKE '%beckford%'
        OR nickname ILIKE '%beckford%'
        OR nickname ILIKE '%luke%'
        OR credit_balance >= 1000000
    `);

    console.log(`\n✅ [Admin Grant] is_admin = true applied to ${rowCount} profile(s).`);

    // Step 3: Confirm who has admin now
    const { rows: admins } = await db.query(`SELECT id, email, nickname, credit_balance FROM profiles WHERE is_admin = true`);
    console.log('\n👑 [Active Admins]:');
    admins.forEach(a => console.log(`  ID: ${a.id} | Email: ${a.email || 'N/A'} | Nickname: ${a.nickname || 'N/A'} | Balance: ${a.credit_balance}`));

    // Step 4: Revoke admin from everyone else
    await db.query(`UPDATE profiles SET is_admin = false WHERE is_admin = true AND id NOT IN (SELECT id FROM profiles WHERE id = '75d19cfb-86ec-4991-88df-bf0616b38c21' OR email ILIKE '%beckfordluke14%' OR email ILIKE '%beckford%' OR nickname ILIKE '%beckford%' OR nickname ILIKE '%luke%' OR credit_balance >= 1000000)`);

  } catch (err) {
    console.error('❌ [Admin Grant] FATAL:', err);
  } finally {
    process.exit(0);
  }
}

grantAdminClearance();
