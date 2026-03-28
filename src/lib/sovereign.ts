
import { db } from './db';

export async function getProfile(userId: string) {
  const { rows } = await db.query('SELECT * FROM profiles WHERE id = $1 LIMIT 1', [userId]);
  return rows[0] || null;
}

export async function getPersona(personaId: string) {
  const { rows } = await db.query('SELECT * FROM personas WHERE id = $1 LIMIT 1', [personaId]);
  return rows[0] || null;
}

export async function getUserPersonaStats(userId: string, personaId: string) {
  const { rows } = await db.query(
    'SELECT * FROM user_persona_stats WHERE user_id = $1 AND persona_id = $2 LIMIT 1',
    [userId, personaId]
  );
  return rows[0] || null;
}

export async function updateLastMessage(userId: string, personaId: string) {
  await db.query(
    'UPDATE user_persona_stats SET last_user_message_at = NOW(), ghosting_level = 0 WHERE user_id = $1 AND persona_id = $2',
    [userId, personaId]
  );
}

export async function saveMessage(userId: string, personaId: string, role: string, content: string, extra: any = {}) {
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
}

export async function updateNickname(userId: string, nickname: string) {
  await db.query('UPDATE profiles SET nickname = $1, is_known = true WHERE id = $2', [nickname, userId]);
}
