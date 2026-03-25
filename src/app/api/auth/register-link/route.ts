import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    const { email, password, guestId } = await req.json();

    if (!email || !password || !guestId) {
      return NextResponse.json({ success: false, error: 'Missing auth data' }, { status: 400 });
    }

    console.log(`[Identity Link] Forging permanent node for ${email}...`);

    // 1. CREATE USER VIA ADMIN
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (createErr) {
        return NextResponse.json({ success: false, error: createErr.message }, { status: 400 });
    }

    const newUserId = newUser.user.id;

    // 2. MIGRATE CHAT MEMORY
    if (guestId.startsWith('guest-')) {
        await supabaseAdmin
            .from('chat_messages')
            .update({ user_id: newUserId })
            .eq('user_id', guestId);
            
        await supabaseAdmin
            .from('user_persona_stats')
            .update({ user_id: newUserId })
            .eq('user_id', guestId);
    }

    // 3. TASK 2: BONUS POINTS LOGIC (50 POINTS UPON ACCOUNT CREATION)
    // Check if wallet history exists for the guest
    const { data: existingWallet } = await supabaseAdmin.from('wallets').select('id, balance').eq('user_id', guestId).maybeSingle();
    
    const startingBonus = 50;
    
    if (existingWallet) {
        // Update user_id to point to the new user AND add 50 bonus points
        await supabaseAdmin.from('wallets')
            .update({ user_id: newUserId, balance: existingWallet.balance + startingBonus })
            .eq('id', existingWallet.id);
    } else {
        // Create new wallet entirely with 50 bonus points
        await supabaseAdmin.from('wallets')
            .insert({ user_id: newUserId, balance: startingBonus });
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Account linked, history merged, and 50 Breathe Points awarded.',
        user_id: newUserId
    });

  } catch (error: any) {
    console.error('[Identity Link] Critical Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}



