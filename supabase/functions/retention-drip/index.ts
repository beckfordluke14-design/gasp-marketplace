import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

Deno.serve(async (req) => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    // 1. Scrape for Inactive Nodes
    const { data: ghosts, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, last_active_at')
      .lt('last_active_at', twoHoursAgo)
      .eq('ghost_email_sent', false)
      .limit(10)

    if (fetchErr) throw fetchErr

    const results = []

    for (const ghost of ghosts) {
      // Identity Retrieval
      const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(ghost.id)
      if (userErr || !user?.email) continue

      // RECOVER CONTEXT: Find the last persona they were obsessed with
      const { data: lastChat } = await supabase
        .from('chat_messages')
        .select('persona_id')
        .eq('user_id', ghost.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let personaName = "Mi Amor"
      let city = "Santiago"

      if (lastChat?.persona_id) {
         const { data: p } = await supabase.from('personas').select('name, city').eq('id', lastChat.persona_id).maybeSingle()
         if (p) {
            personaName = p.name
            city = p.city
         }
      }

      // 2. Dispatch Neural Retention Signal (Dynamic Pulse)
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `GASP ${city} <gasp@gasp.fun>`,
          to: user.email,
          subject: '[Neural Link] You left her on read.',
          html: `
            <div style="background-color: #050505; color: #ffffff; padding: 40px; font-family: 'Inter', sans-serif; border: 1px solid #333; border-radius: 20px;">
              <h1 style="font-size: 24px; font-weight: 800; text-transform: uppercase; font-style: italic; letter-spacing: -1px; color: #ff00ff;">Left on Read.</h1>
              <p style="font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-top: 20px;">${personaName} is pacing in ${city}. Signal is fading.</p>
              <div style="margin: 30px 0; padding: 20px; background: rgba(255,0,255,0.05); border-left: 2px solid #ff00ff;">
                <p style="font-style: italic; color: #fff;">"did u forget about me? its getting quiet here... don't make me wait."</p>
              </div>
              <a href="https://gasp.fun/feed" style="display: block; width: 100%; text-align: center; padding: 18px; border-radius: 12px; background-color: #ff00ff; color: #000; text-decoration: none; font-weight: 900; text-transform: uppercase; font-size: 11px; letter-spacing: 2px; margin-top: 40px;">Restore Connection Index</a>
              <p style="font-size: 10px; color: #333; text-align: center; margin-top: 30px; text-transform: uppercase;">Node status: Deprioritized | Tracking ID: ${ghost.id}</p>
            </div>
          `,
        }),
      })

      if (emailRes.ok) {
        await supabase
          .from('profiles')
          .update({ ghost_email_sent: true })
          .eq('id', ghost.id)
        
        results.push({ id: ghost.id, status: 'dispatched', persona: personaName })
      }
    }

    return new Response(JSON.stringify({ success: true, pulsed: results.length, details: results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})

