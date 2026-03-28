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
        console.log(`📡 [Neural Sync] Decrypting context for: ${userId} <-> ${personaId}`);

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

        const [messages, unlocks, vault, galleryPosts, relationships, stats] = await Promise.all([
            safeQuery('SELECT * FROM chat_messages WHERE user_id = $1 AND persona_id = $2 ORDER BY created_at ASC', [userId, personaId]),
            safeQuery('SELECT post_id as item_id FROM user_vault_unlocks WHERE user_id = $1', [userId]),
            safeQuery('SELECT * FROM persona_vault WHERE persona_id = $1 ORDER BY created_at DESC', [personaId]),
            safeQuery('SELECT * FROM posts WHERE persona_id = $1 AND (is_gallery = true OR is_vault = true) ORDER BY created_at DESC', [personaId]),
            safeQuery('SELECT * FROM user_relationships WHERE user_id = $1 AND persona_id = $2 LIMIT 1', [userId, personaId]),
            safeQuery('SELECT bond_score FROM user_persona_stats WHERE user_id = $1 AND persona_id = $2 LIMIT 1', [userId, personaId])
        ]);

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
            bondScore: (stats[0] as any)?.bond_score || 0
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
