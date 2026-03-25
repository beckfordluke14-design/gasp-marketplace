import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// 🏁 DATA RECOVERY: Static Persona Sync
const FALLBACK_PERSONAS: Record<string, any> = {
    'isabella': { name: 'Isabella', city: 'Newark', is_active: true },
    'tia-jamaica': { name: 'Tia', city: 'Kingston', is_active: true },
    'zola-nigeria': { name: 'Zola', city: 'Lagos', is_active: true }
};

export async function POST(req: Request) {
    try {
        const { action, payload } = await req.json();
        console.log(`[Neural Command Pulse]: Action=${action}`, payload);
        if (action === 'toggle-status') {
            console.log(`[Neural Admin Sync] Cloud-Etching Node: ${payload.id} to state: ${payload.is_active}`);
        }

        switch (action) {
            case 'sync-follow': {
                const { user_id, persona_id, is_following } = payload;
                if (!user_id || !persona_id) throw new Error('Identity Missing.');
                
                const { error } = await supabase.from('user_persona_stats').upsert([{ 
                    user_id, 
                    persona_id, 
                    is_following: is_following || false,
                    updated_at: new Date().toISOString()
                }]);
                if (error) console.error('[Follow Sync Failure]:', error.message);
                return NextResponse.json({ success: true });
            }
            case 'toggle-status': {
                const { id, is_active } = payload;
                const { error } = await supabase.from('personas').update({ is_active }).eq('id', id);
                if (error) {
                    console.error('[Admin DB Error]:', error.message);
                    throw error;
                }
                return NextResponse.json({ success: true });
            }
            case 'rename': {
                const { id, name } = payload;
                const { error } = await supabase.from('personas').update({ name }).eq('id', id);
                if (error) throw error;
                return NextResponse.json({ success: true });
            }
            case 'kill': {
                const { id } = payload;
                const { error } = await supabase.from('personas').delete().eq('id', id);
                if (error) throw error;
                return NextResponse.json({ success: true });
            }
            case 'map-asset': {
                const { persona_id, content_url, is_vault, caption } = payload;
                const { error } = await supabase.from('posts').insert([{
                    persona_id, content_url, is_vault, caption, scheduled_for: new Date().toISOString()
                }]);
                if (error) throw error;
                return NextResponse.json({ success: true });
            }
            case 'delete-post': {
                const { id, persona_id, content_url, content_type, is_vault } = payload;
                console.log(`[Neural Admin Sync] Feed-Masking Initiated for Node: ${id}`);
                
                // 🛡️ HARD ETCH: Use upsert to handle hardcoded posts not yet in DB
                const { error } = await supabase.from('posts').upsert([{ 
                    id, 
                    persona_id: persona_id || 'master-unknown',
                    content_url: content_url || 'deleted',
                    content_type: content_type || 'image',
                    caption: 'DELETED_NODE_SYNC_V15',
                    is_vault: is_vault || false,
                    is_burner: false,
                    scheduled_for: new Date().toISOString()
                }]);
                if (error) throw error;
                
                return NextResponse.json({ success: true });
            }
            case 'reassign-asset': {
                const { asset, newPersonaId } = payload;
                const { error } = await supabase.from('posts').insert([{
                    persona_id: newPersonaId,
                    content_type: asset.content_type || (asset.url?.endsWith('.mp4') ? 'video' : 'image'),
                    content_url: asset.content_url || asset.url,
                    caption: asset.caption || 'Mirror Sync: Cloned Node Asset.',
                    is_vault: asset.is_vault,
                    scheduled_for: new Date().toISOString()
                }]);
                if (error) throw error;
                return NextResponse.json({ success: true });
            }
            case 'set-seed': {
                const { id, url } = payload;
                const { error } = await supabase.from('personas').update({ seed_image_url: url }).eq('id', id);
                if (error) throw error;
                return NextResponse.json({ success: true });
            }
            case 'toggle-vault': {
                const { id, is_vault } = payload;
                const { error } = await supabase.from('posts').update({ is_vault }).eq('id', id);
                if (error) throw error;
                return NextResponse.json({ success: true });
            }
            case 'toggle-featured': {
                const { id, is_featured } = payload;
                const { error } = await supabase.from('posts').update({ is_burner: is_featured }).eq('id', id);
                if (error) throw error;
                return NextResponse.json({ success: true });
            }
            case 'update-post': {
                const { id, caption, persona_id, content_url, content_type, is_vault, is_featured } = payload;
                console.log(`[Neural Command]: Hard-Etching Post Update for ID: ${id}`);
                
                // 🛡️ SYNC PERSONA: Ensure persona exists for JOIN compatibility
                if (persona_id) {
                    const fallback = FALLBACK_PERSONAS[persona_id] || { name: persona_id, is_active: true };
                    const { error: pError } = await supabase.from('personas').upsert([{ 
                        id: persona_id, 
                        name: fallback.name, 
                        city: fallback.city || '', 
                        is_active: true 
                    }]);
                    if (pError) console.error('[Persona Sync Error]:', pError.message);
                }

                const { error } = await supabase.from('posts').upsert([{ 
                    id, 
                    caption, 
                    persona_id, 
                    content_url, 
                    content_type: content_type || 'image',
                    is_vault: is_vault || false,
                    is_burner: is_featured || false,
                    scheduled_for: new Date().toISOString()
                }]);
                if (error) throw error;
                return NextResponse.json({ success: true });
            }
            default:
                throw new Error('Neural Command Not Recognized.');
        }
    } catch (e: any) {
        console.error('[Admin Command Failure]:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}



