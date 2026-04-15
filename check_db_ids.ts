import { db } from '../../../../../../gasp/src/lib/db';

async function check() {
  try {
    const { rows } = await db.query("SELECT persona_id, count(*) FROM posts WHERE is_vault = TRUE GROUP BY persona_id");
    console.log("DATABASE PERSONA IDS FOUND:", JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
