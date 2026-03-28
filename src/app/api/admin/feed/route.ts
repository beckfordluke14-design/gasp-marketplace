import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const personaIdFilter = searchParams.get('persona_id');
  const allMode = searchParams.get('all') === 'true';
  
  try {
    const offset = page * limit;
    
    // 🛡️ SOVEREIGN QUERY: High-Impact Join
    let queryText = `
      SELECT 
        p.*,
        json_build_object(
          'id', pers.id,
          'name', pers.name,
          'city', pers.city,
          'age', pers.age,
          'seed_image_url', pers.seed_image_url,
          'is_active', pers.is_active
        ) as personas
      FROM posts p
      INNER JOIN personas pers ON p.persona_id = pers.id
    `;

    const conditions = [];
    const params = [];

    if (personaIdFilter) {
      conditions.push(`p.persona_id = $${params.length + 1}`);
      params.push(personaIdFilter);
    } else if (!allMode) {
      conditions.push("pers.is_active = true");
      conditions.push("p.is_vault = false");
      conditions.push("p.is_freebie = false");
      conditions.push("p.is_gallery = false");
      conditions.push("p.content_url IS NOT NULL");
      conditions.push("p.caption NOT LIKE 'DELETED%'");
    }

    if (conditions.length > 0) {
      queryText += " WHERE " + conditions.join(" AND ");
    }

    queryText += ` ORDER BY p.is_burner DESC, p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows: dbPosts } = await db.query(queryText, params);

    return NextResponse.json({ 
        success: true, 
        posts: dbPosts || [],
        tombstones: []
    });
  } catch (e: any) {
    console.error('[Neural Feed Failure]:', e.message);
    return NextResponse.json({ success: false, posts: [], tombstones: [], error: e.message }, { status: 500 });
  }
}



