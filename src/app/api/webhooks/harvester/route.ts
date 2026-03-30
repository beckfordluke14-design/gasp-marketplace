import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

/**
 * THE HARVESTER CRON NODE (Railway Sovereign v2.0)
 * Targets new users who signed up 15-30 mins ago and went cold.
 * Fires a personalized "left on read" email from their last active persona.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    console.log('[Harvester] Spinning up the Re-Engagement Scythe...');

    const now = Date.now();
    const fifteenMinsAgo = new Date(now - 15 * 60 * 1000).toISOString();
    const thirtyMinsAgo = new Date(now - 30 * 60 * 1000).toISOString();

    // 1. Find new profiles in the 15–30 min strike zone
    const { rows: targets } = await db.query(`
      SELECT id, email FROM profiles
      WHERE created_at >= $1 AND created_at <= $2 AND email IS NOT NULL
    `, [thirtyMinsAgo, fifteenMinsAgo]);

    if (targets.length === 0) {
      return NextResponse.json({ success: true, message: 'Harvester Complete: No targets in strike zone.' });
    }

    let harvestedCount = 0;

    for (const user of targets) {
      const userId = user.id;

      // Skip if they were active in the last 15 mins
      const { rows: recentMsgs } = await db.query(
        'SELECT id FROM chat_messages WHERE user_id = $1 AND created_at >= $2 LIMIT 1',
        [userId, fifteenMinsAgo]
      );
      const { rows: recentTx } = await db.query(
        'SELECT id FROM transactions WHERE user_id = $1 AND created_at >= $2 LIMIT 1',
        [userId, fifteenMinsAgo]
      );

      if (recentMsgs.length > 0 || recentTx.length > 0) continue;

      // Find the last persona they spoke to
      const { rows: lastInteraction } = await db.query(
        'SELECT persona_id FROM chat_messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );

      if (lastInteraction.length > 0 && lastInteraction[0].persona_id) {
        const { rows: personas } = await db.query(
          'SELECT name FROM personas WHERE id = $1 LIMIT 1',
          [lastInteraction[0].persona_id]
        );

        if (personas.length > 0 && user.email) {
          const personaName = personas[0].name.toLowerCase();

          try {
            const resendRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: `${personaName} <${personaName}@gasp.fun>`,
                to: [user.email],
                subject: '???',
                text: `u left me on read... come back and talk to me 💀 - ${personaName}`
              })
            });

            if (resendRes.ok) {
              harvestedCount++;
              console.log(`[Harvester] Hook deployed to ${user.email} via ${personaName}`);
            }
          } catch (resendErr) {
            console.error('[Harvester] Resend API Failed:', resendErr);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Harvester Cycle Complete. Hooks deployed: ${harvestedCount} / ${targets.length} targets.`
    });

  } catch (error: any) {
    console.error('[Harvester] System Failure:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
