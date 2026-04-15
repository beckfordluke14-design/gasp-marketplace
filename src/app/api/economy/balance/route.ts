import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

  const SOVEREIGN_ADMIN_IDS = new Set(['did:privy:cmn8nxsbd016o0cl4ryjg0thn']);
  const isSovereignAdmin = SOVEREIGN_ADMIN_IDS.has(userId || '');

  try {
    const { rows: profiles } = await db.query(
        'SELECT credit_balance, is_admin, nickname FROM profiles WHERE id = $1 LIMIT 1', 
        [userId]
    );
    if (profiles && profiles.length > 0) {
       return NextResponse.json({ 
         success: true, 
         balance: profiles[0].credit_balance || 0,
         is_admin: profiles[0].is_admin || isSovereignAdmin,
         nickname: profiles[0].nickname || null,
         is_initialized: true
       });
    }
    
    // 🧬 GUEST FALLBACK: 0 until they trigger the Genesis Handshake
    return NextResponse.json({ 
      success: true, 
      balance: 0,
      is_guest: true,
      is_initialized: false
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
    const { userId, action, amount } = await req.json();
    if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

    try {
        if (action === 'spend') {
            const { rows: updated } = await db.query(`UPDATE profiles SET credit_balance = credit_balance - $1 WHERE id = $2 AND credit_balance >= $1 RETURNING credit_balance`, [amount, userId]);
            if (updated.length === 0) return NextResponse.json({ success: false, error: 'Insufficient Balance' }, { status: 402 });
            return NextResponse.json({ success: true, balance: updated[0].credit_balance });
        }

        // 🧬 GUEST GENESIS (250 CR)
        if (action === 'guest_genesis') {
            await db.query(`
                INSERT INTO profiles (id, credit_balance) 
                VALUES ($1, 250) 
                ON CONFLICT (id) DO UPDATE SET credit_balance = GREATEST(profiles.credit_balance, 250)
            `, [userId]);
            return NextResponse.json({ success: true, balance: 250 });
        }

        // 🏦 STARTER CLAIM (1,000 CR - For actual Registered Users)
        if (action === 'starter_claim') {
            await db.query(`
                INSERT INTO profiles (id, credit_balance) VALUES ($1, 1000) 
                ON CONFLICT (id) DO UPDATE SET credit_balance = GREATEST(profiles.credit_balance, 1000)
            `, [userId]);
            return NextResponse.json({ success: true, balance: 1000 });
        }

        // 🧬 IDENTITY HANDOFF: Migrate Guest Credits to Member ID
        if (action === 'link_guest') {
            const { guestId } = await req.json();
            if (!guestId) return NextResponse.json({ success: false, error: 'Guest ID required' });

            // Fetch total credits from guest
            const { rows: guestData } = await db.query('SELECT credit_balance FROM profiles WHERE id = $1', [guestId]);
            const gBalance = guestData[0]?.credit_balance || 0;

            if (gBalance > 0) {
                // Merge into the member ID (Privy)
                await db.query(`
                    INSERT INTO profiles (id, credit_balance) VALUES ($1, ${gBalance})
                    ON CONFLICT (id) DO UPDATE SET credit_balance = profiles.credit_balance + EXCLUDED.credit_balance
                `, [userId]);

                // 📸 MIGRATE UNLOCKS: Ensure they keep what they paid for
                await db.query('UPDATE user_media_unlocks SET user_id = $1 WHERE user_id = $2', [userId, guestId]);

                // 💬 MIGRATE CHAT: Ensure the AI remembers them
                await db.query('UPDATE chat_messages SET user_id = $1 WHERE user_id = $2', [userId, guestId]);
                await db.query('UPDATE user_persona_stats SET user_id = $1 WHERE user_id = $2', [userId, guestId]);

                // Wipe guest to prevent double-claiming
                await db.query('UPDATE profiles SET credit_balance = 0 WHERE id = $1', [guestId]);
            }
            return NextResponse.json({ success: true, migrated: gBalance });
        }
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
