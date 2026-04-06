import { db } from './src/lib/db';

async function run() {
    try {
        console.log("Seeding...");
        await db.query("INSERT INTO personas (id, name, city, country, system_prompt, is_active, created_at, updated_at) VALUES ('tia-jamaica', 'Tia', 'Kingston', 'JM', 'You are Tia.', true, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;");
        await db.query("INSERT INTO personas (id, name, city, country, system_prompt, is_active, created_at, updated_at) VALUES ('zola-nigeria', 'Zola', 'Lagos', 'NG', 'You are Zola.', true, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;");
        console.log("Seeded");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
