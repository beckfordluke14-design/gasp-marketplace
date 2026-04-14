import { db } from './src/lib/db';

async function checkDb() {
  try {
    const { rows: count } = await db.query('SELECT COUNT(*) FROM posts WHERE persona_id = $1 AND is_vault = true', ['veronica-medellin-locked']);
    console.log('--- Vault items for veronica-medellin-locked ---');
    console.table(count);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkDb();
