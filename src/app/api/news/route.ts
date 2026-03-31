import { db } from '@/lib/db';
import { initialProfiles } from '@/lib/profiles';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { rows } = await db.query(`
            SELECT np.*, p.name as persona_name, p.image as persona_image
            FROM news_posts np
            JOIN (
                SELECT id, name, image FROM (
                    SELECT CAST(id AS TEXT) as id, name, image FROM (
                        SELECT * FROM (
                            SELECT '1' as id, 'Nova' as name, '' as image
                        ) as dummy -- We will fallback to initialProfiles if not in DB
                    ) as d2
                ) as d3
            ) p ON np.persona_id = p.id
            ORDER BY np.created_at DESC
            LIMIT 20
        `);

        // Handle profile hydration manually since some personas might only be in initialProfiles
        const hydrated = rows.map((r: any) => {
            const p = initialProfiles.find(ip => String(ip.id) === String(r.persona_id));
            let meta = {};
            try { meta = JSON.parse(r.meta || '{}'); } catch(e) {}
            
            return {
                ...r,
                persona_name: p?.name || r.persona_name,
                persona_image: p?.image || r.persona_image,
                meta
            };
        });

        return NextResponse.json(hydrated);
    } catch (e: any) {
        console.error('Fetch News Failure:', e);
        // Fallback: If DB query fails (table doesn't exist yet etc) return empty list
        return NextResponse.json([]);
    }
}
