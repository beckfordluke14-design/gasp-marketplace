import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { action, payload } = await req.json();
    const { userId, personaId } = payload;

    if (!userId || !action) {
      return new Response('Missing User ID or Action', { status: 400 });
    }

    switch (action) {
      case 'chat-context': {
        // 🛡️ SOVEREIGN NEURAL SYNC: Fetching all chat data in one Postgres handshake
        console.log(`📡 [Neural Sync] Decrypting context for: ${userId} <-> ${personaId}`);

        const [
            { rows: messages },
            { rows: unlocks },
            { rows: vault },
            { rows: galleryPosts },
            { rows: relationships },
            { rows: stats }
        ] = await Promise.all([
            db.query('SELECT * FROM chat_messages WHERE user_id = $1 AND persona_id = $2 ORDER BY created_at ASC', [userId, personaId]),
            db.query('SELECT post_id as item_id FROM user_vault_unlocks WHERE user_id = $1', [userId]),
            db.query('SELECT * FROM persona_vault WHERE persona_id = $1 ORDER BY created_at DESC', [personaId]),
            db.query('SELECT * FROM posts WHERE persona_id = $1 AND (is_gallery = true OR is_vault = true) ORDER BY created_at DESC', [personaId]),
            db.query('SELECT * FROM user_relationships WHERE user_id = $1 AND persona_id = $2 LIMIT 1', [userId, personaId]),
            db.query('SELECT bond_score FROM user_persona_stats WHERE user_id = $1 AND persona_id = $2 LIMIT 1', [userId, personaId])
        ]);

        const unlockedIds = (unlocks || []).map(u => u.item_id);

        return NextResponse.json({
          success: true,
          data: {
            messages: messages || [],
            vaultItems: [
              ...(vault || []).map(v => ({ 
                  ...v, 
                  content_url: v.content_url || v.media_url,
                  price: v.price_credits || v.price || 75,
                  is_vault: true,
                  is_unlocked: unlockedIds.includes(v.id),
                  type: v.type || 'image'
              })),
              ...(galleryPosts || []).map(p => ({
                  id: p.id,
                  content_url: p.content_url,
                  caption: p.caption,
                  price: p.price_credits || p.lock_price || 75,
                  is_vault: p.is_vault || p.is_freebie || true,
                  is_unlocked: unlockedIds.includes(p.id) || !p.is_vault,
                  type: p.type || 'image',
                  created_at: p.created_at
              }))
            ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()),
            isFollowing: relationships.length > 0,
            bondScore: stats[0]?.bond_score || 0
          }
        });
      }

      case 'toggle-follow': {
        const { isFollowing } = payload;
        if (isFollowing) {
          await db.query('DELETE FROM user_relationships WHERE user_id = $1 AND persona_id = $2', [userId, personaId]);
          return NextResponse.json({ success: true, isFollowing: false });
        } else {
          await db.query('INSERT INTO user_relationships (user_id, persona_id, affinity_score) VALUES ($1, $2, 1) ON CONFLICT (user_id, persona_id) DO NOTHING', [userId, personaId]);
          return NextResponse.json({ success: true, isFollowing: true });
        }
      }

      case 'sync-follows': {
        const { rows } = await db.query('SELECT persona_id FROM user_relationships WHERE user_id = $1', [userId]);
        return NextResponse.json({ success: true, following: rows.map(r => r.persona_id) });
      }

      case 'like-post': {
        return NextResponse.json({ success: true });
      }

      default:
        return new Response('Invalid Neural Action', { status: 400 });
    }
  } catch (error: any) {
    console.error('[Neural RPC Error]:', error);
    return new Response(error.message, { status: 500 });
  }
}
