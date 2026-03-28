import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log('💎 [Economy] Processing Media Unlock Pulse...');
  
  try {
    const { userId, mediaId, type } = await req.json();

    if (!userId || !mediaId) {
      return new Response('User ID and Content ID required', { status: 400 });
    }

    // ── CASE A: VOICE NOTE TRANSLATION ──
    if (type === 'translation') {
       console.log(`🎙️ [Economy] Decoding Voice Note ${mediaId} for User ${userId}...`);
       
       const { rows: msg } = await db.query('SELECT translation_locked, audio_translation FROM chat_messages WHERE id = $1 LIMIT 1', [mediaId]);
       if (msg[0] && !msg[0].translation_locked) {
          return NextResponse.json({ success: true, translation: msg[0].audio_translation, already_owned: true });
       }

       const cost = 25; 
       
       // ATOMIC TRANSACTION: Check balance + Deduct + Unlock
       const { rows: profile } = await db.query('SELECT credit_balance FROM profiles WHERE id = $1', [userId]);
       const balance = profile[0]?.credit_balance || 0;

       if (balance < cost) {
          return NextResponse.json({ success: false, error: 'Insufficient Balance' }, { status: 400 });
       }

       await db.query('BEGIN');
       try {
          await db.query('UPDATE profiles SET credit_balance = credit_balance - $1, updated_at = NOW() WHERE id = $2', [cost, userId]);
          await db.query('UPDATE chat_messages SET translation_locked = false WHERE id = $1', [mediaId]);
          await db.query('COMMIT');
          return NextResponse.json({ success: true, translation: msg[0]?.audio_translation });
       } catch (err) {
          await db.query('ROLLBACK');
          throw err;
       }
    }

    // ── CASE B: MEDIA VAULT ──
    const { rows: mediaItems } = await db.query('SELECT id, content_url, is_vault, price_credits FROM posts WHERE id = $1 LIMIT 1', [mediaId]);
    let media = mediaItems[0];

    if (!media) {
       const { rows: vaultItems } = await db.query('SELECT id, content_url, price_credits FROM persona_vault WHERE id = $1 LIMIT 1', [mediaId]);
       media = vaultItems[0];
    }

    if (!media) {
      return new Response('Media node not found in any registry', { status: 404 });
    }

    const cost = media.price_credits || 75;

    const { rows: existingUnlock } = await db.query('SELECT * FROM user_vault_unlocks WHERE user_id = $1 AND post_id = $2 LIMIT 1', [userId, mediaId]);

    if (existingUnlock.length > 0) {
      console.log(`♻️ [Economy] Media ${mediaId} already unlocked for ${userId}.`);
      return NextResponse.json({
        success: true,
        media_url: media.content_url,
        already_owned: true
      });
    }

    // ATOMIC TRANSACTION: Deduction + Unlock Record
    console.log(`💸 [Economy] Deducting ${cost} credits for media ${mediaId} from User ${userId}...`);
    
    const { rows: profile } = await db.query('SELECT credit_balance FROM profiles WHERE id = $1', [userId]);
    const balance = profile[0]?.credit_balance || 0;

    if (balance < cost) {
       return NextResponse.json({ success: false, error: 'Insufficient Balance' }, { status: 400 });
    }

    await db.query('BEGIN');
    try {
       await db.query('UPDATE profiles SET credit_balance = credit_balance - $1, updated_at = NOW() WHERE id = $2', [cost, userId]);
       await db.query('INSERT INTO user_vault_unlocks (user_id, post_id, created_at) VALUES ($1, $2, NOW())', [userId, mediaId]);
       await db.query('COMMIT');
       console.log(`✅ [Economy] Unlock successful for User ${userId}.`);
       return NextResponse.json({ success: true, media_url: media.content_url });
    } catch (err) {
       await db.query('ROLLBACK');
       throw err;
    }

  } catch (err: any) {
    console.error('❌ [Economy] Critical Server Exception:', err.message);
    return new Response(err.message || 'Economy Node Offline', { status: 500 });
  }
}



