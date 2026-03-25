import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_placeholder_key'; 

/**
 * THE HARVESTER CRON NODE
 * /api/webhooks/harvester
 * Objective: Target dead conversions between 15-30m and automatically trigger a personalized, lowercase "left on read" raw text email from their last actively viewed persona to aggressively pull them back into the vault flow.
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate the Cron (Security Check could go here)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'secret'}`) {
       console.warn('[Harvester] Unauthorized Cron attempt');
       // For dev/testing purposes, bypass auth if missing from env, otherwise fail
       if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
          return new Response('Unauthorized', { status: 401 });
       }
    }

    console.log('[Harvester] Spinning up the Re-Engagement Scythe...');

    const now = Date.now();
    const fifteenMinsAgo = new Date(now - 15 * 60 * 1000).toISOString();
    const thirtyMinsAgo = new Date(now - 30 * 60 * 1000).toISOString();

    // 2. Scan Auth Table for users born within the 15-30 min strike zone
    const { data: { users }, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    if (authErr) throw authErr;

    const targets = users.filter(u => {
        const createdMs = new Date(u.created_at).getTime();
        return createdMs >= (now - 30 * 60 * 1000) && createdMs <= (now - 15 * 60 * 1000);
    });

    if (targets.length === 0) {
        return NextResponse.json({ success: true, message: 'Harvester Complete: No targets in strike zone.' });
    }

    let harvestedCount = 0;

    // 3. Process each potential target
    for (const user of targets) {
        const userId = user.id;

        // Has this user sent a message OR spent money in the LAST 15 minutes?
        // Note: The conversion funnel means they started as a guest, so we only care about their post-signup activity, or overall activity linked to their new UID.
        const { data: recentMsgs } = await supabaseAdmin
            .from('chat_messages')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', fifteenMinsAgo)
            .limit(1);

        const { data: recentTx } = await supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', fifteenMinsAgo)
            .limit(1);

        // If they did something recently, they survived the harvest. Skip them.
        if ((recentMsgs && recentMsgs.length > 0) || (recentTx && recentTx.length > 0)) {
            continue;
        }

        // They are officially dead. We harvest them. 
        // Find the absolute last persona they were talking to.
        const { data: lastInteraction } = await supabaseAdmin
            .from('chat_messages')
            .select('persona_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (lastInteraction && lastInteraction.persona_id) {
            // Fetch Persona Details to forge the email
            const { data: persona } = await supabaseAdmin
                .from('personas')
                .select('name')
                .eq('id', lastInteraction.persona_id)
                .maybeSingle();

            if (persona) {
                const personaName = persona.name.toLowerCase();
                const userEmail = user.email;

                // 4. Fire the Resend Payload
                // "u left me on read... come back and talk to me 💀 - [name]"
                try {
                    const resendRes = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${RESEND_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            from: `${personaName} <${personaName}@gasp.fun>`,
                            to: [userEmail],
                            subject: '???', // Lowercase, manipulative subject lines work best
                            text: `u left me on read... come back and talk to me 💀 - ${personaName}`
                        })
                    });

                    if (resendRes.ok) {
                        harvestedCount++;
                        console.log(`[Harvester] Sent abandonment hook to ${userEmail} via ${personaName}`);
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



