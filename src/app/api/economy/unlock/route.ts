import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * THE ECONOMY PROTOCOL: UNLOCK NODE
 * Refined to prevent double-charging and prioritize user persistence.
 */
export async function POST(req: Request) {
  console.log('💎 [Economy] Processing Media Unlock Pulse...');
  
  try {
    const { userId, mediaId } = await req.json();

    if (!userId || !mediaId) {
      return new Response('User ID and Media ID required', { status: 400 });
    }

    // 1. NEURAL CACHE CHECK: Is this media already unlocked for this user?
    const { data: existingUnlock } = await supabase
      .from('unlocked_media')
      .select('unlocked_at')
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .maybeSingle();

    // 2. Resolve Media URL early if unlocked
    const { data: media, error: mediaError } = await supabase
      .from('media_vault')
      .select('price_points, media_url')
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
    console.log(`💸 [Economy] Deducting ${media.price_points} points for media ${mediaId}...`);
    const { data: rpcResult, error: rpcError } = await supabase.rpc('unlock_media', {
      p_user_id: userId,
      p_media_id: mediaId,
      p_cost: media.price_points
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
        const { data: profile } = await supabase.from('profiles').select('pulse_points').eq('id', userId).single();
        await supabase.from('profiles').update({
          pulse_points: (profile?.pulse_points || 0) + media.price_points,
          updated_at: new Date().toISOString()
        }).eq('id', userId);
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



