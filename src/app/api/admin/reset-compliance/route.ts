import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    const COMPLIANCE_EMAIL = 'compliance@alltheseflows.com';
    const COMPLIANCE_PASS = 'review'; // Must match Supabase settings (min 6 chars)

    console.log('[Compliance Admin] Initiating State Reset Sequence...');

    // STEP A: CREATE OR RESET COMPLIANCE USER
    let { data: { users }, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
    let complianceUser = users.find(u => u.email === COMPLIANCE_EMAIL);

    if (complianceUser) {
        // Reset password just in case
        await supabaseAdmin.auth.admin.updateUserById(complianceUser.id, { password: COMPLIANCE_PASS });
    } else {
        // Create user
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: COMPLIANCE_EMAIL,
            password: COMPLIANCE_PASS,
            email_confirm: true
        });
        if (createErr) throw new Error(`User Creation Failed: ${createErr.message}`);
        complianceUser = newUser.user;
    }

    const userId = complianceUser.id;

    // Optional: Make sure tables exist (user_wallets, user_unlocked_vaults)
    // Assuming they are created. We will just attempt to UPSERT/DELETE without breaking.
    
    // STEP B: UPSERT WALLET BALANCE (10,000 Breathe Points)
    const { data: existingWallet } = await supabaseAdmin.from('wallets').select('id, balance').eq('user_id', userId).maybeSingle();
    if (!existingWallet) {
        // Insert new wallet if they don't have one
        const { error: insertErr } = await supabaseAdmin.from('wallets').insert({ user_id: userId, balance: 10000 });
        if (insertErr) console.warn('[Compliance Admin] Wallet Insert Error:', insertErr);
    } else {
        // Update existing wallet
        const { error: updateErr } = await supabaseAdmin.from('wallets').update({ balance: 10000 }).eq('id', existingWallet.id);
        if (updateErr) console.warn('[Compliance Admin] Wallet Update Error:', updateErr);
    }

    // STEP C: RELOCK EVERYTHING
    const { error: relockErr } = await supabaseAdmin
        .from('user_unlocked_vaults')
        .delete()
        .eq('user_id', userId);
        
    if (relockErr && relockErr.code !== '42P01') {
        console.warn('[Compliance Admin] Relock Error:', relockErr);
    }

    // STEP D: SEED 3 MOCK VAULT ITEMS ACROSS ALL ACTIVE PERSONAS
    const { data: allPersonas } = await supabaseAdmin.from('personas').select('id, name').eq('is_active', true);
    
    if (allPersonas && allPersonas.length > 0) {
        const mockPrompts = [
            { prompt: 'cute doodle of a glowing star, pink background, simple sketch', cap: 'my little lucky star ✨', price: 500 },
            { prompt: '3d emoji render of a cute angry face, neon lighting, glossy', cap: 'mood right now 😡', price: 1000 },
            { prompt: 'aesthetic polaroid sketch with a heart drawn in lipstick, soft lighting', cap: 'sealed with a kiss 💋', price: 2000 }
        ];

        for (const p of allPersonas) {
            for (const item of mockPrompts) {
                // Ensure no duplicating
                const { data: existing } = await supabaseAdmin.from('posts').select('id').match({ 
                    persona_id: p.id, 
                    is_vault: true, 
                    price: item.price 
                }).maybeSingle();

                if (!existing) {
                    const encoded = encodeURIComponent(item.prompt + ' ' + p.name);
                    const drawUrl = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random()*9999)}`;
                    await supabaseAdmin.from('posts').insert({
                        persona_id: p.id,
                        content_type: 'vault',
                        caption: item.cap,
                        content_url: drawUrl,
                        price: item.price,
                        is_vault: true
                    });
                }
            }
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Compliance Review Account successfully reset to 10,000 pts with locked vault state.',
        user_id: userId
    });

  } catch (error: any) {
    console.error('[Compliance Admin] Critical Reset Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}



