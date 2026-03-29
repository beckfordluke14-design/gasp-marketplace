
import { db } from './db';

export async function getProfile(userId: string) {
  const { rows } = await db.query('SELECT * FROM profiles WHERE id = $1 LIMIT 1', [userId]);
  return rows[0] || null;
}

export async function getPersona(personaId: string) {
  const { rows } = await db.query('SELECT * FROM personas WHERE id = $1 LIMIT 1', [personaId]);
  return rows[0] || null;
}

export async function getPersonaAssets(personaId: string, limit: number = 3) {
  const [news, vault] = await Promise.all([
    db.query('SELECT id, title, caption, created_at FROM posts WHERE persona_id = $1 AND is_vault = false ORDER BY created_at DESC LIMIT $2', [personaId, limit]),
    db.query('SELECT id, caption as title, created_at, is_vault FROM posts WHERE persona_id = $1 AND is_vault = true ORDER BY created_at DESC LIMIT $2', [personaId, limit])
  ]);
  return { news: news.rows, vault: vault.rows };
}

export async function getUserPersonaStats(userId: string, personaId: string) {
  const { rows } = await db.query(
    'SELECT * FROM user_persona_stats WHERE user_id = $1 AND persona_id = $2 LIMIT 1',
    [userId, personaId]
  );
  return rows[0] || null;
}

export async function updateLastMessage(userId: string, personaId: string) {
  try {
    await db.query(
      `INSERT INTO user_persona_stats (user_id, persona_id, last_user_message_at, ghosting_level)
       VALUES ($1, $2, NOW(), 0)
       ON CONFLICT (user_id, persona_id) DO UPDATE SET 
          last_user_message_at = EXCLUDED.last_user_message_at,
          ghosting_level = 0`,
      [userId, personaId]
    );
  } catch (err: any) {
    if (err.message.includes('column "ghosting_level" does not exist')) {
        // 🧪 NEURAL FAILSAFE: Column not migrated yet, falling back to basic update
        await db.query(
           'INSERT INTO user_persona_stats (user_id, persona_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
           [userId, personaId]
        );
    } else {
        throw err;
    }
  }
}

export async function saveMessage(userId: string, personaId: string, role: string, content: string, extra: any = {}) {
  // 🛡️ SOVEREIGN PERSISTENCE: Full insert attempt first
  try {
    await db.query(
      `INSERT INTO chat_messages (
        user_id, persona_id, role, content, 
        audio_script, audio_translation, translation_locked, 
        price, type, media_url, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userId, personaId, role, content,
        extra.audio_script || null, extra.audio_translation || null, extra.translation_locked || false,
        extra.price || 0, extra.type || 'text', extra.media_url || null, extra.image_url || null
      ]
    );
  } catch (fullErr: any) {
    // 🧪 NEURAL FAILSAFE: Schema mismatch — fall back to minimal core columns only
    console.warn('[Sovereign] Full insert failed, trying minimal fallback:', fullErr.message?.slice(0, 80));
    try {
      await db.query(
        `INSERT INTO chat_messages (user_id, persona_id, role, content) VALUES ($1, $2, $3, $4)`,
        [userId, personaId, role, content]
      );
    } catch (minErr: any) {
      // Non-critical — stream MUST NOT be blocked by persistence failures
      console.warn('[Sovereign] Minimal insert also failed (non-blocking):', minErr.message?.slice(0, 80));
    }
  }
}

export async function updateNickname(userId: string, nickname: string) {
  await db.query('UPDATE profiles SET nickname = $1, is_known = true WHERE id = $2', [nickname, userId]);
}

export async function burnCredits(userId: string, amount: number, type: string = 'chat_message', meta: any = {}) {
  try {
     const { rows } = await db.query(`
        UPDATE profiles 
        SET credit_balance = credit_balance - $1, 
            updated_at = NOW() 
        WHERE id = $2 AND credit_balance >= $1 
        RETURNING credit_balance
     `, [amount, userId]);
     
     if (rows.length > 0) {
        // Log transaction for audit 🛡️
        await db.query(`
           INSERT INTO transactions (user_id, amount, type, provider, meta, created_at)
           VALUES ($1, $2, $3, 'syndicate_core', $4, NOW())
        `, [userId, amount, type, JSON.stringify(meta)]);
        return { success: true, balance: rows[0].credit_balance };
     }
     return { success: false, error: 'Insufficient Balance' };
  } catch (err: any) {
     console.error('[Sovereign] Burn failure:', err.message);
     return { success: false, error: err.message };
  }
}
