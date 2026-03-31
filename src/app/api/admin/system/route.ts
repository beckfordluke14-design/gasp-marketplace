import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { isAdminRequest, unauthorizedResponse } from '@/lib/auth';

export async function GET(req: Request) {
  // 🛡️ SYNDICATE SECURITY: Verify Sovereign Admin Clearance
  const isAuthorized = await isAdminRequest(req);
  if (!isAuthorized) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const personaId = searchParams.get('personaId');

  try {
    switch (action) {
      case 'persona-details': {
        if (!personaId) throw new Error('Persona ID required.');
        
        const [
            { rows: persona },
            { rows: assets },
            { rows: relationships }
        ] = await Promise.all([
            db.query('SELECT * FROM personas WHERE id = $1 LIMIT 1', [personaId]),
            db.query('SELECT * FROM posts WHERE persona_id = $1 ORDER BY created_at DESC', [personaId]),
            db.query('SELECT count(*) FROM user_relationships WHERE persona_id = $1', [personaId])
        ]);

        return NextResponse.json({ 
            success: true, 
            data: { 
                persona: persona[0], 
                assets: assets || [], 
                relationshipsCount: parseInt(relationships[0]?.count || '0', 10) 
            } 
        });
      }

      case 'scan-orphans': {
        // 👻 SCAN DATABASE FOR GHOST POSTS IN THE SOVEREIGN VAULT
        const { rows: dbOrphans } = await db.query('SELECT * FROM posts WHERE persona_id IS NULL');
        
        const orphans = (dbOrphans || []).map(o => ({
            name: `DB_GHOST_${o.id.slice(0,4)}`,
            bucket: 'posts_table',
            url: o.content_url
        }));

        return NextResponse.json({ success: true, files: orphans });
      }

      case 'vitals': {
        const [
            { rows: burnStats },
            { rows: pointStats },
            { rows: userStats }
        ] = await Promise.all([
            db.query('SELECT * FROM global_burn_stats WHERE id = 1'),
            db.query('SELECT SUM(points) as total_points FROM syndicate_points'),
            db.query('SELECT COUNT(*) as user_count FROM profiles')
        ]);

        return NextResponse.json({ 
            success: true, 
            data: { 
                burn: burnStats[0] || { total_burned_credits: 0, total_points_issued: 0 },
                totalPointsInCirculation: parseInt(pointStats[0]?.total_points || '0', 10),
                totalUsers: parseInt(userStats[0]?.user_count || '0', 10)
            } 
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid System Action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Admin System API] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
