import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    const { email, password, guestId } = await req.json();

    if (!email || !password || !guestId) {
      return NextResponse.json({ success: false, error: 'Missing auth data' }, { status: 400 });
    }

    console.log(`[Identity Link] Forging permanent node for ${email} on Railway...`);

    // 1. CREATE USER VIA ADMIN (Supabase Auth remains the source of truth for identity)
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (createErr) {
        return NextResponse.json({ success: false, error: createErr.message }, { status: 400 });
    }

    const newUserId = newUser.user.id;

    // 2. MIGRATE CHAT MEMORY in Railway
    if (guestId.startsWith('guest-')) {
        console.log(`[Identity Link] Migrating guest ${guestId} data to ${newUserId} on Railway...`);
        
        await db.query('UPDATE chat_messages SET user_id = $1 WHERE user_id = $2', [newUserId, guestId]);
        await db.query('UPDATE user_persona_stats SET user_id = $1 WHERE user_id = $2', [newUserId, guestId]);
    }

    // 3. TASK 2: BONUS POINTS LOGIC (50 POINTS UPON ACCOUNT CREATION)
    const startingBonus = 50;
    
    // UPSERT Wallet in Railway
    await db.query(`
        INSERT INTO wallets (user_id, balance, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET 
            balance = wallets.balance + EXCLUDED.balance,
            updated_at = NOW()
    `, [newUserId, startingBonus]);

    return NextResponse.json({ 
        success: true, 
        message: 'Account linked, history merged, and 50 Breathe Points awarded on Railway.',
        user_id: newUserId
    });

  } catch (error: any) {
    console.error('[Identity Link] Critical Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}



