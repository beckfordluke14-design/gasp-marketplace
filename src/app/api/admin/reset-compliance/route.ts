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
    const COMPLIANCE_EMAIL = 'compliance@GASP Syndicate.com';
    const COMPLIANCE_PASS = 'review'; 

    console.log('[Compliance Admin] Initiating Railway State Reset Sequence...');

    // STEP A: CREATE OR RESET COMPLIANCE USER (Identity Node)
    let { data: { users }, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
    let complianceUser = users.find(u => u.email === COMPLIANCE_EMAIL);

    if (complianceUser) {
        await supabaseAdmin.auth.admin.updateUserById(complianceUser.id, { password: COMPLIANCE_PASS });
    } else {
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: COMPLIANCE_EMAIL,
            password: COMPLIANCE_PASS,
            email_confirm: true
        });
        if (createErr) throw new Error(`User Creation Failed: ${createErr.message}`);
        complianceUser = newUser.user;
    }

    const userId = complianceUser.id;

    // STEP B: UPSERT WALLET BALANCE (10,000 Breathe Points) on Railway
    await db.query(`
        INSERT INTO wallets (user_id, balance, updated_at)
        VALUES ($1, 10000, NOW())
        ON CONFLICT (user_id) DO UPDATE SET 
            balance = 10000,
            updated_at = NOW()
    `, [userId]);

    // STEP C: RELOCK EVERYTHING on Railway
    await db.query('DELETE FROM user_unlocked_vaults WHERE user_id = $1', [userId]);

    // STEP D: SEED 3 MOCK VAULT ITEMS ACROSS ALL ACTIVE PERSONAS on Railway
    const { rows: allPersonas } = await db.query('SELECT id, name FROM personas WHERE is_active = true');
    
    if (allPersonas && allPersonas.length > 0) {
        const mockPrompts = [
            { prompt: 'cute doodle of a glowing star, pink background, simple sketch', cap: 'my little lucky star ✨', price: 500 },
            { prompt: '3d emoji render of a cute angry face, neon lighting, glossy', cap: 'mood right now 😡', price: 1000 },
            { prompt: 'aesthetic polaroid sketch with a heart drawn in lipstick, soft lighting', cap: 'sealed with a kiss 💋', price: 2000 }
        ];

        for (const p of allPersonas) {
            for (const item of mockPrompts) {
                // Ensure no duplicating on Railway
                const { rows: existing } = await db.query(
                    'SELECT id FROM posts WHERE persona_id = $1 AND is_vault = true AND price = $2',
                    [p.id, item.price]
                );

                if (existing.length === 0) {
                    const encoded = encodeURIComponent(item.prompt + ' ' + p.name);
                    const drawUrl = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random()*9999)}`;
                    
                    await db.query(`
                        INSERT INTO posts (persona_id, content_type, caption, content_url, price, is_vault, created_at)
                        VALUES ($1, $2, $3, $4, $5, true, NOW())
                    `, [p.id, 'vault', item.cap, drawUrl, item.price]);
                }
            }
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Compliance Review Account successfully reset on Railway to 10,000 pts with locked vault state.',
        user_id: userId
    });

  } catch (error: any) {
    console.error('[Compliance Admin] Critical Reset Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}



