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

    if (action === 'get_latest_news') {
       const { limit = 3 } = payload || {};
       const { rows } = await db.query(`SELECT * FROM news_posts ORDER BY created_at DESC LIMIT $1`, [limit]);
       return NextResponse.json({ success: true, posts: rows });
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
        
        // 🧬 NEURAL BRIDGE: Migrate guest data to user DID if needed
        if (guestId && userId !== guestId && userId.startsWith('did:')) {
           try {
              await db.query('UPDATE chat_messages SET user_id = $1 WHERE user_id = $2', [userId, guestId]);
              await db.query(`
                INSERT INTO user_relationships (user_id, persona_id, affinity_score)
                SELECT $1, persona_id, affinity_score FROM user_relationships WHERE user_id = $2
                AND NOT EXISTS (SELECT 1 FROM user_relationships ur2 WHERE ur2.user_id = $1 AND ur2.persona_id = user_relationships.persona_id)
              `, [userId, guestId]);
              await db.query('DELETE FROM user_relationships WHERE user_id = $2', [guestId]);
           } catch (e) {}
        }

        const safeQuery = async (sql: string, params: any[]) => {
           try { const { rows } = await db.query(sql, params); return rows || []; } catch (e) { return []; }
        };

        // 🧬 IDENTITY SYNC: Sanitize and bridge IDs
        const pid = (personaId || '').toLowerCase();
        const safePid = pid === 'veronica_medellin' ? 'veronica-medellin-locked' : pid;
        // 🧬 ROOT MAPPING: Map locked funnel IDs BACK to their root profile to fetch Admin Vault assets
        const rootPid = pid === 'veronica-medellin-locked' ? 'veronica_medellin' : pid;

        const [messages, unlocks, vault, galleryPosts, relationships, stats, msgCountRows] = await Promise.all([
            safeQuery('SELECT * FROM chat_messages WHERE user_id = $1 AND persona_id = $2 ORDER BY created_at ASC', [userId, safePid]),
            safeQuery('SELECT post_id as item_id FROM user_vault_unlocks WHERE user_id = $1', [userId]),
            safeQuery('SELECT * FROM persona_vault WHERE persona_id = $1 ORDER BY created_at DESC', [rootPid]),
            safeQuery('SELECT * FROM posts WHERE persona_id = $1 AND is_vault = true ORDER BY created_at DESC', [rootPid]),
            safeQuery('SELECT * FROM user_relationships WHERE user_id = $1 AND persona_id = $2 LIMIT 1', [userId, safePid]),
            safeQuery('SELECT bond_score FROM user_persona_stats WHERE user_id = $1 AND persona_id = $2 LIMIT 1', [userId, safePid]),
            safeQuery('SELECT COUNT(*) as count FROM chat_messages WHERE user_id = $1 AND role = \'user\'', [userId])
        ]);

        const userMsgCount = parseInt(msgCountRows[0]?.count || '0');
        const GUEST_LIMIT = 5; // ⚖️ CONVERSION CAP

        // Fetch User Balance (from profiles table)
        const { rows: balanceRows } = await db.query('SELECT credit_balance FROM profiles WHERE id = $1', [userId]);
        const balance = balanceRows[0]?.credit_balance || 0;

        const unlockedIds = unlocks.map((u: any) => u.item_id);
        const legacyVaultItems = vault.map((v: any) => ({
            id: v.id, content_url: v.content_url || v.media_url, caption: v.caption || '',
            price: v.price_credits || v.price || 75, is_vault: true, is_unlocked: unlockedIds.includes(v.id), 
            type: v.type || 'image', created_at: v.created_at
        }));

        const postVaultItems = galleryPosts.map((p: any) => ({
            id: p.id, content_url: p.content_url, caption: p.caption || '',
            price_credits: p.price_credits || p.lock_price || 6000,
            price: p.price_credits || p.lock_price || 6000, is_vault: p.is_vault || false,
            is_unlocked: !p.is_vault || unlockedIds.includes(p.id), type: p.content_type || p.type || 'image',
            created_at: p.created_at
        }));

        const seen = new Set();
        const allVaultItems = [...postVaultItems].filter((item: any) => {
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
            isDepleted: balance <= 0 && userId.startsWith('guest-') && userMsgCount >= GUEST_LIMIT
          }
        });
      }

      case 'toggle-follow': {
        const { isFollowing } = payload;
        if (isFollowing) {
          await db.query('DELETE FROM user_relationships WHERE user_id = $1 AND persona_id = $2', [userId, personaId]);
          return NextResponse.json({ success: true, isFollowing: false });
        } else {
          await db.query(`INSERT INTO user_relationships (user_id, persona_id, affinity_score) SELECT $1, $2, 1 WHERE NOT EXISTS (SELECT 1 FROM user_relationships WHERE user_id = $1 AND persona_id = $2)`, [userId, personaId]);
          return NextResponse.json({ success: true, isFollowing: true });
        }
      }

      case 'sync-follows': {
        const { rows } = await db.query('SELECT persona_id FROM user_relationships WHERE user_id = $1', [userId]);
        return NextResponse.json({ success: true, following: rows.map(r => r.persona_id) });
      }

      case 'log-funnel-lead': {
        // 📊 Upsert a minimal profile record for this funnel visitor
        const { guestId, firstMessage, source, campaign, creative } = payload;
        const gid = guestId || userId;
        try {
          await db.query(`
            INSERT INTO profiles (id, nickname, credit_balance, metadata, created_at, updated_at)
            VALUES ($1, $2, 350, $3, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
              metadata = profiles.metadata || $3,
              updated_at = NOW()
          `, [
            gid,
            `guest_${gid.slice(-6)}`,
            JSON.stringify({ funnel_source: source, campaign, creative, first_message: firstMessage, entry_at: new Date().toISOString() })
          ]);
        } catch (e: any) {
          // Non-fatal — log but don't crash
          console.warn('[Funnel Lead Log] Non-fatal:', e.message);
        }
        return NextResponse.json({ success: true });
      }

      case 'like-post': { return NextResponse.json({ success: true }); }
      default: return new Response('Invalid Neural Action', { status: 400 });

    }
  } catch (error: any) {
    console.error('[Neural RPC Error]:', error);
    return new Response(error.message, { status: 500 });
  }
}



