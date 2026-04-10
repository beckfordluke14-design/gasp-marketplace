import { db } from './src/lib/db';

async function check() {
  try {
    const { rows } = await db.query("SELECT id, name, seed_image_url FROM personas WHERE name ILIKE '%Veronica%'");
    console.log(JSON.stringify(rows));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
