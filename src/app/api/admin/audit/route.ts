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
            case 'global-rename': {
                const { id, oldName, newName } = payload;
                if (!id || !newName) throw new Error('Identity Target Missing.');
                
                // 1. Update Persona Node
                const { error: pError } = await supabase.from('personas').update({ name: newName }).eq('id', id);
                if (pError) throw pError;

                // 2. Cascade to post captions (Neural Sweep)
                if (oldName) {
                    const { data: posts } = await supabase.from('posts').select('id, caption').eq('persona_id', id);
                    if (posts) {
                        for (const post of posts) {
                            if (post.caption && post.caption.includes(oldName)) {
                                const newCaption = post.caption.replace(new RegExp(oldName, 'gi'), newName);
                                await supabase.from('posts').update({ caption: newCaption }).eq('id', post.id);
                            }
                        }
                    }
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
            case 'delete-post-hard': {
                const { id } = payload;
                if (!id) throw new Error('ID Missing.');
                const { error } = await supabase.from('posts').delete().eq('id', id);
                if (error) throw error;
                return NextResponse.json({ success: true });
            }
            case 'delete-post': {
                const { id } = payload;
                console.log(`[Neural Admin] Soft-hiding post: ${id}`);
                // Soft hide: mark post as hidden so feed queries filter it out
                const { error } = await supabase.from('posts')
                    .update({ is_burner: false, is_vault: false, caption: 'DELETED_NODE_SYNC_V15' })
                    .eq('id', id);
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
            case 'update-persona': {
                // Writes identity fields to the personas table so chat + story sync automatically.
                const { id, name, age, city, system_prompt, seed_image_url } = payload;
                if (!id) throw new Error('Persona ID Missing.');
                const fields: Record<string, any> = {};
                if (name           !== undefined) fields.name           = name;
                if (age            !== undefined) fields.age            = parseInt(age, 10) || age;
                if (city           !== undefined) fields.city           = city;
                if (system_prompt  !== undefined) fields.system_prompt  = system_prompt;
                if (seed_image_url !== undefined) fields.seed_image_url = seed_image_url; // hero image sync
                if (Object.keys(fields).length === 0) return NextResponse.json({ success: true });
                console.log(`[Neural Admin] Identity update for persona ${id}:`, Object.keys(fields));
                const { error } = await supabase.from('personas').update(fields).eq('id', id);
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

                // Build update object — only include defined fields
                const updateFields: Record<string, any> = {};
                if (caption     !== undefined) updateFields.caption      = caption;
                if (persona_id  !== undefined) updateFields.persona_id   = persona_id;
                if (content_url !== undefined) updateFields.content_url  = content_url;
                if (content_type!== undefined) updateFields.content_type = content_type;
                if (is_vault    !== undefined) updateFields.is_vault     = is_vault;
                if (is_featured !== undefined) updateFields.is_burner    = is_featured;
                updateFields.scheduled_for = new Date().toISOString();

                const { error } = await supabase.from('posts').upsert([{ id, ...updateFields }]);
                if (error) throw error;
                return NextResponse.json({ success: true });
            }
            case 'mark-freebie': {
                // Marks a post as a freebie gift: removes from for-sale vault, available for chat drops
                const { id, is_freebie } = payload;
                if (!id) throw new Error('Post ID Missing.');
                const { error } = await supabase.from('posts')
                    .update({ is_freebie: is_freebie ?? true, is_vault: false })
                    .eq('id', id);
                if (error) throw error;
                return NextResponse.json({ success: true });
            }
            case 'create-post': {
                const { persona_id, content_url, content_type, is_vault, is_featured, caption } = payload;
                if (!persona_id || !content_url) throw new Error('persona_id and content_url required.');
                const { error } = await supabase.from('posts').insert([{
                    persona_id,
                    content_url,
                    content_type: content_type || 'video',
                    is_vault:    is_vault    ?? false,
                    is_burner:   is_featured ?? false,
                    caption:     caption     || '',
                    scheduled_for: new Date().toISOString(),
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



