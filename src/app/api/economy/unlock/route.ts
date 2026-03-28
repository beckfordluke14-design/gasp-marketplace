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

        // 🧬 CNS SYNC: Update Profile node with Atomic Subtraction
        if (result?.success) {
           const { data: profile } = await supabase.from('profiles').select('credit_balance').eq('id', userId).maybeSingle();
           const newBal = Math.max(0, (profile?.credit_balance || 0) - cost);
           await supabase.from('profiles').upsert({ id: userId, credit_balance: newBal, updated_at: new Date().toISOString() });
        }

       return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
    }

    // ── CASE B: MEDIA VAULT (Original Logic) ──
    // CNS: Try posts table first (most common for vaulted feed items)
    let { data: media, error: mediaError } = await supabase
      .from('posts')
      .select('id, content_url, is_vault')
      .eq('id', mediaId)
      .single();

    // Fallback: Try persona_vault table
    if (mediaError || !media) {
       const { data: vaultMedia } = await supabase
         .from('persona_vault')
         .select('id, content_url')
         .eq('id', mediaId)
         .maybeSingle();
       media = vaultMedia as any;
    }

    if (!media) {
      return new Response('Media node not found in any registry', { status: 404 });
    }

    // Resolve price: In Syndicate V1.5, we favor 75cr for standard vault and 150cr for premiums
    // We can also check a 'price_credits' column if it exists in persona_vault
    const cost = (media as any).price_credits || 75;

    const { data: existingUnlock } = await supabase
      .from('user_vault_unlocks')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', mediaId)
      .maybeSingle();

    if (existingUnlock) {
      console.log(`♻️ [Economy] Media ${mediaId} already unlocked for ${userId}.`);
      return new Response(JSON.stringify({
        success: true,
        media_url: media.content_url,
        already_owned: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. TRANSACTION STAGE: Call the Atomic Unlock RPC
    // RPC 'unlock_media' should handle: 1. check balance, 2. deduct, 3. add to user_vault_unlocks
    console.log(`💸 [Economy] Deducting ${cost} credits for media ${mediaId}...`);
    const { data: rpcResult, error: rpcError } = await supabase.rpc('unlock_media', {
      p_user_id: userId,
      p_item_id: mediaId,
      p_cost: cost
    });

    if (rpcError) {
      console.error('[Economy] Transaction Collapse:', rpcError.message);
      
      // FALLBACK: Manual tx if RPC is signature mismatched
      const { data: profile } = await supabase.from('profiles').select('credit_balance').eq('id', userId).maybeSingle();
      if ((profile?.credit_balance || 0) < cost) {
         return new Response(JSON.stringify({ success: false, error: 'Insufficient Balance' }), { status: 400 });
      }
      
      await supabase.from('profiles').upsert({ 
         id: userId,
         credit_balance: (profile?.credit_balance || 0) - cost,
         updated_at: new Date().toISOString()
      });

      await supabase.from('user_vault_unlocks').insert({ 
         user_id: userId, 
         item_id: mediaId 
      });

      return new Response(JSON.stringify({ success: true, media_url: media.content_url }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 4. Return Final Payload
    if (rpcResult?.success) {
      console.log(`✅ [Economy] Unlock successful for User ${userId}.`);
      return new Response(JSON.stringify({
        success: true,
        media_url: media.content_url
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: rpcResult?.description || 'Insufficient funds'
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



