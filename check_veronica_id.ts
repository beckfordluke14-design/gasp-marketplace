import { db } from '../../../../../../gasp/src/lib/db';

async function check() {
  try {
    const { rows } = await db.query("SELECT DISTINCT persona_id FROM posts WHERE LOWER(persona_id) LIKE '%veronica%'");
    console.log("EXACT DB SLUGS FOR VERONICA:", JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
