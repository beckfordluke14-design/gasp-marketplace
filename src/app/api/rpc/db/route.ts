import { db } from '@/lib/db';
import { NextResponse } from 'next/server';


async function getNews(searchParams: URLSearchParams) {
  const action = searchParams.get('action');
  if (action === 'get_latest_news') {
     const limit = parseInt(searchParams.get('limit') || '3');
     const { rows } = await db.query(`SELECT * FROM news_posts ORDER BY created_at DESC LIMIT $1`, [limit]);
     return NextResponse.json({ success: true, posts: rows });
  }
  if (action === 'get_news') {
     const personaId = searchParams.get('persona_id') || searchParams.get('personaId');
     if (!personaId) return new Response('Missing Persona ID', { status: 400 });
     const { rows } = await db.query(`SELECT * FROM news_posts WHERE persona_id = $1 ORDER BY created_at DESC`, [personaId]);
     return NextResponse.json({ success: true, posts: rows });
  }
  return new Response('Invalid GET Action', { status: 400 });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    return await getNews(searchParams);
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, payload } = body;

    // Support for POST-based news fetch (Legacy/Hub Support)
    if (action === 'get_latest_news') {
       const { limit = 3 } = payload || {};
       const { rows } = await db.query(`SELECT * FROM news_posts ORDER BY created_at DESC LIMIT $1`, [limit]);
       return NextResponse.json({ success: true, posts: rows });
    }

    if (action === 'get_profiles') {
      return new Response('Missing Action or Payload', { status: 400 });
    }

    if (!action || !payload) {
      return new Response('Missing Action or Payload', { status: 400 });
    }

    const { userId, personaId } = payload;

    if (!userId) {
      return new Response('Missing User ID', { status: 400 });
    }

    switch (action) {
      case 'chat-context': {
        const { guestId } = payload;
        console.log(`📡 [Neural Sync] Decrypting context for: ${userId} <-> ${personaId} (GuestBridge: ${guestId})`);

        // 🧬 NEURAL BRIDGE (IDENTITY MERGE): If a guest logs in, migrate their messages to the steady user.id
        if (guestId && userId !== guestId && userId.startsWith('did:')) {
           try {
              console.log(`🧠 [Neural Bridge] Migrating Guest ${guestId} to Member ${userId}`);
              await db.query('UPDATE chat_messages SET user_id = $1 WHERE user_id = $2', [userId, guestId]);
              await db.query('UPDATE user_relationships SET user_id = $1 WHERE user_id = $2 ON CONFLICT DO NOTHING', [userId, guestId]);
              // Also update balance/unlocks if needed (already handled by userId usually, but good practice)
              await db.query('UPDATE user_vault_unlocks SET user_id = $1 WHERE user_id = $2 ON CONFLICT DO NOTHING', [userId, guestId]);
           } catch (mergeErr) { console.warn('[Neural Bridge Fail]:', mergeErr); }
        }

        // 🛡️ SOVEREIGN BRIDGE: Each query is individually fault-tolerant.
        // If legacy tables (persona_vault) don't exist on Railway, we return [] and keep going.
        const safeQuery = async (sql: string, params: any[]): Promise<any[]> => {
          try {
            const { rows } = await db.query(sql, params);
            return rows || [];
          } catch (e: any) {
            console.warn(`[Neural Sync] Query skipped (${e.message.slice(0, 60)})`);
            return [];
          }
        };

        const [messages, unlocks, vault, galleryPosts, relationships, stats, msgCountRows] = await Promise.all([
            safeQuery('SELECT * FROM chat_messages WHERE user_id = $1 AND persona_id = $2 ORDER BY created_at ASC', [userId, personaId]),
            safeQuery('SELECT post_id as item_id FROM user_vault_unlocks WHERE user_id = $1', [userId]),
            safeQuery('SELECT * FROM persona_vault WHERE persona_id = $1 ORDER BY created_at DESC', [personaId]),
            safeQuery('SELECT * FROM posts WHERE persona_id = $1 AND (is_gallery = true OR is_vault = true) ORDER BY created_at DESC', [personaId]),
            safeQuery('SELECT * FROM user_relationships WHERE user_id = $1 AND persona_id = $2 LIMIT 1', [userId, personaId]),
            safeQuery('SELECT bond_score FROM user_persona_stats WHERE user_id = $1 AND persona_id = $2 LIMIT 1', [userId, personaId]),
            safeQuery('SELECT COUNT(*) as count FROM chat_messages WHERE user_id = $1 AND role = \'user\'', [userId])
        ]);
        
        const userMsgCount = parseInt(msgCountRows[0]?.count || '0');
        const GUEST_LIMIT = 5;

        const unlockedIds = unlocks.map((u: any) => u.item_id);

        // Merge vault + gallery posts, vault items mapped for UI
        const legacyVaultItems = vault.map((v: any) => ({
            id: v.id,
            content_url: v.content_url || v.media_url,
            caption: v.caption || '',
            price: v.price_credits || v.price || 75,
            is_vault: true,
            is_unlocked: unlockedIds.includes(v.id),
            type: v.type || 'image',
            created_at: v.created_at
        }));

        const postVaultItems = galleryPosts.map((p: any) => ({
            id: p.id,
            content_url: p.content_url,
            caption: p.caption || '',
            price: p.price_credits || p.lock_price || 75,
            is_vault: p.is_vault || false,
            is_unlocked: !p.is_vault || unlockedIds.includes(p.id),
            type: p.content_type || p.type || 'image',
            created_at: p.created_at
        }));

        // Deduplicate by id, prefer postVaultItems
        const seen = new Set();
        const allVaultItems = [...postVaultItems, ...legacyVaultItems].filter((item: any) => {
            if (!item.content_url || seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        }).sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

        return NextResponse.json({
          success: true,
          data: {
            messages,
            vaultItems: allVaultItems,
            isFollowing: relationships.length > 0,
            bondScore: (stats[0] as any)?.bond_score || 0,
            userMsgCount,
            isDepleted: userId.startsWith('guest-') && userMsgCount >= GUEST_LIMIT
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
