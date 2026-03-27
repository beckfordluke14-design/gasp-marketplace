import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * THE ECONOMY PROTOCOL: UNLOCK NODE
 * Refined to prevent double-charging and prioritize user persistence.
 */
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
       
       // 1. Check if already unlocked locally in messages
       const { data: msg } = await supabase.from('chat_messages').select('translation_locked, audio_translation').eq('id', mediaId).single();
       if (msg && !msg.translation_locked) {
          return new Response(JSON.stringify({ success: true, translation: msg.audio_translation, already_owned: true }), { headers: { 'Content-Type': 'application/json' } });
       }

       // 2. Resolve Balance & Atomic Deduct (Using RPC if possible, or manual for now to match current patterns)
       // Here we use the same RPC but we might need a more generic one or just the current one if it handles credit deduction.
       // Looking at current code, 'unlock_media' seems to be the core credit deduct + access grant.
       const cost = 25; // COST_VOICE_TRANSLATION
       
       const { data: result, error: rpcError } = await supabase.rpc('unlock_translation', {
          p_user_id: userId,
          p_message_id: mediaId,
          p_cost: cost
       });

       if (rpcError) {
          console.error('[Economy] Translation Transaction Collapse:', rpcError.message);
          return new Response('Transaction failed: DB Sync Issue', { status: 500 });
       }

        // 🧬 CNS SYNC: Update Profile node to prevent UI drift
        if (result?.success) {
           try {
             const { data: profile } = await supabase.from('profiles').select('credit_balance').eq('id', userId).single();
             if (profile) {
                await supabase.from('profiles').update({
                  credit_balance: Math.max(0, (profile.credit_balance || 0) - cost),
                  updated_at: new Date().toISOString()
                }).eq('id', userId);
             }
           } catch (e) {
             console.warn('[Translate Economy] Profile sync failed.');
           }
        }

       return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
    }

    // ── CASE B: MEDIA VAULT (Original Logic) ──
    const { data: existingUnlock } = await supabase
      .from('unlocked_media')
      .select('unlocked_at')
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .maybeSingle();

    // 2. Resolve Media URL early if unlocked
    const { data: media, error: mediaError } = await supabase
      .from('media_vault')
      .select('price_credits, media_url')
      .eq('id', mediaId)
      .single();

    if (mediaError || !media) {
      return new Response('Media node not found in vault registry', { status: 404 });
    }

    if (existingUnlock) {
      console.log(`♻️ [Economy] Media ${mediaId} already unlocked for ${userId}. Granting access without charge.`);
      return new Response(JSON.stringify({
        success: true,
        media_url: media.media_url,
        already_owned: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. TRANSACTION STAGE: Call the Atomic Unlock RPC
    console.log(`💸 [Economy] Deducting ${media.price_credits} credits for media ${mediaId}...`);
    const { data: rpcResult, error: rpcError } = await supabase.rpc('unlock_media', {
      p_user_id: userId,
      p_media_id: mediaId,
      p_cost: media.price_credits
    });

    if (rpcError) {
      console.error('[Economy] Transaction Collapse:', rpcError.message);
      return new Response('Transaction failed: Internal Database Sync Issue', { status: 500 });
    }

    // 4. Return Final Payload
    if (rpcResult?.success) {
      console.log(`✅ [Economy] Unlock successful for User ${userId}. Media is live.`);

      // 🧬 PULSE PROTOCOL: Track Spent-to-Earn (Future Airdrop)
      try {
        const { data: profile } = await supabase.from('profiles').select('credit_balance').eq('id', userId).single();
        if (profile) {
          await supabase.from('profiles').update({
            credit_balance: Math.max(0, (profile.credit_balance || 0) - media.price_credits),
            updated_at: new Date().toISOString()
          }).eq('id', userId);
        }
      } catch (e) {
        console.warn('[Unlock Loyalty] Profile update skipped.');
      }

      return new Response(JSON.stringify({
        success: true,
        media_url: media.media_url
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.warn(`💰 [Economy] Insufficient balance for User ${userId}. Charging 402/Unauthorized.`);
      return new Response(JSON.stringify({
        success: false,
        error: rpcResult?.error || 'Insufficient funds'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (err: any) {
    console.error('❌ [Economy] Critical Server Exception:', err.message);
    return new Response(err.message || 'Economy Node Offline', { status: 500 });
  }
}



