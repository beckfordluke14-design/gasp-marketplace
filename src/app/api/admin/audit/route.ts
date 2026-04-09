import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { isAdminRequest, unauthorizedResponse } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        // 🛡️ SYNDICATE SECURITY: Verify Admin Clearance
        const isAuthorized = await isAdminRequest(req);
        if (!isAuthorized) return unauthorizedResponse();

        const { action, payload } = await req.json();
        console.log(`[Neural Command Pulse]: Action=${action}`, payload);

        switch (action) {
            case 'sync-follow': {
                const { user_id, persona_id, is_following } = payload;
                if (!user_id || !persona_id) throw new Error('Identity Missing.');
                
                await db.query(`
                    INSERT INTO user_persona_stats (user_id, persona_id, is_following, updated_at)
                    VALUES ($1, $2, $3, NOW())
                    ON CONFLICT (user_id, persona_id) DO UPDATE SET is_following = EXCLUDED.is_following, updated_at = NOW()
                `, [user_id, persona_id, is_following || false]);
                return NextResponse.json({ success: true });
            }
            case 'toggle-status': {
                const { id, is_active } = payload;
                await db.query('UPDATE personas SET is_active = $1 WHERE id = $2', [is_active, id]);
                return NextResponse.json({ success: true });
            }
            case 'global-rename': {
                const { id, oldName, newName } = payload;
                if (!id || !newName) throw new Error('Identity Target Missing.');
                
                await db.query('UPDATE personas SET name = $1 WHERE id = $2', [newName, id]);

                if (oldName) {
                    await db.query("UPDATE posts SET caption = REPLACE(caption, $1, $2) WHERE persona_id = $3", [oldName, newName, id]);
                }
                return NextResponse.json({ success: true });
            }
            case 'rename': {
                const { id, name } = payload;
                await db.query('UPDATE personas SET name = $1 WHERE id = $2', [name, id]);
                return NextResponse.json({ success: true });
            }
            case 'kill': {
                const { id } = payload;
                await db.query('DELETE FROM personas WHERE id = $1', [id]);
                return NextResponse.json({ success: true });
            }
            case 'map-asset': {
                const { persona_id, content_url, is_vault, caption } = payload;
                await db.query(`
                    INSERT INTO posts (persona_id, content_url, is_vault, caption, scheduled_for, created_at)
                    VALUES ($1, $2, $3, $4, NOW(), NOW())
                `, [persona_id, content_url, is_vault, caption]);
                return NextResponse.json({ success: true });
            }
            case 'delete-post-hard': {
                const { id } = payload;
                await db.query('DELETE FROM posts WHERE id = $1', [id]);
                return NextResponse.json({ success: true });
            }
            case 'delete-post': {
                const { id } = payload;
                await db.query("UPDATE posts SET is_burner = false, is_vault = false, caption = 'DELETED_NODE_SYNC_V15' WHERE id = $1", [id]);
                return NextResponse.json({ success: true });
            }
            case 'set-seed': {
                const { id, url } = payload;
                await db.query('UPDATE personas SET seed_image_url = $1 WHERE id = $2', [url, id]);
                return NextResponse.json({ success: true });
            }
            case 'toggle-vault': {
                const { id, is_vault } = payload;
                await db.query('UPDATE posts SET is_vault = $1 WHERE id = $2', [is_vault, id]);
                return NextResponse.json({ success: true });
            }
            case 'update-persona-full': {
                const { id, name, city, vibe, system_prompt, seed_image_url, status, metadata } = payload;
                if (!id) throw new Error('Persona ID Missing.');
                
                const m = metadata || {};
                await db.query(`
                    INSERT INTO personas (
                        id, name, city, vibe, system_prompt, seed_image_url, status, 
                        culture, ethnicity, hair_style, body_type, skin_tone, syndicate_zone, language, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
                    ON CONFLICT (id) DO UPDATE SET 
                        name = EXCLUDED.name, city = EXCLUDED.city, vibe = EXCLUDED.vibe, 
                        system_prompt = EXCLUDED.system_prompt, seed_image_url = EXCLUDED.seed_image_url, 
                        status = EXCLUDED.status, culture = EXCLUDED.culture, ethnicity = EXCLUDED.ethnicity,
                        hair_style = EXCLUDED.hair_style, body_type = EXCLUDED.body_type,
                        skin_tone = EXCLUDED.skin_tone, syndicate_zone = EXCLUDED.syndicate_zone,
                        language = EXCLUDED.language, updated_at = NOW()
                `, [
                    id, name, city, vibe, system_prompt, seed_image_url, status,
                    m.culture, m.ethnicity, m.hair_style, m.body_type, m.skin_tone, m.syndicate_zone, m.language
                ]);
                return NextResponse.json({ success: true });
            }
            case 'update-persona': {
                const { id, name, age, city, system_prompt, seed_image_url } = payload;
                await db.query(`
                    UPDATE personas SET 
                        name = COALESCE($1, name), 
                        age = COALESCE($2, age), 
                        city = COALESCE($3, city), 
                        system_prompt = COALESCE($4, system_prompt), 
                        seed_image_url = COALESCE($5, seed_image_url),
                        updated_at = NOW()
                    WHERE id = $6
                `, [name, age, city, system_prompt, seed_image_url, id]);
                return NextResponse.json({ success: true });
            }
            case 'toggle-gallery': {
                const { id, is_gallery } = payload;
                await db.query('UPDATE posts SET is_gallery = $1 WHERE id = $2', [is_gallery, id]);
                return NextResponse.json({ success: true });
            }
            case 'merge-persona': {
                const { sourceId, targetId } = payload;
                await db.query('BEGIN');
                try {
                    await db.query('UPDATE chat_messages SET persona_id = $1 WHERE persona_id = $2', [targetId, sourceId]);
                    await db.query('UPDATE posts SET persona_id = $1 WHERE persona_id = $2', [targetId, sourceId]);
                    await db.query('DELETE FROM personas WHERE id = $1', [sourceId]);
                    await db.query('COMMIT');
                    return NextResponse.json({ success: true });
                } catch (e) {
                    await db.query('ROLLBACK');
                    throw e;
                }
            }
            case 'toggle-featured': {
                const { id, is_featured } = payload;
                await db.query('UPDATE posts SET is_burner = $1 WHERE id = $2', [is_featured, id]);
                return NextResponse.json({ success: true });
            }
            case 'mark-freebie': {
                const { id, is_freebie } = payload;
                await db.query('UPDATE posts SET is_freebie = $1, is_vault = false WHERE id = $2', [is_freebie ?? true, id]);
                return NextResponse.json({ success: true });
            }
            case 'bulk-delete': {
                const { ids } = payload;
                await db.query("UPDATE posts SET is_burner = false, is_vault = false, caption = 'DELETED_NODE_SYNC_V15' WHERE id = ANY($1)", [ids]);
                return NextResponse.json({ success: true });
            }
            case 'bulk-delete-hard': {
                const { ids } = payload;
                await db.query("DELETE FROM posts WHERE id = ANY($1)", [ids]);
                return NextResponse.json({ success: true });
            }
            case 'create-post': {
                const { persona_id, content_url, content_type, is_vault, is_featured, caption, is_freebie, is_gallery } = payload;
                await db.query(`
                    INSERT INTO posts (
                        persona_id, content_url, content_type, is_vault, is_burner, is_freebie, is_gallery, caption, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                `, [persona_id, content_url, content_type || 'image', is_vault ?? false, is_featured ?? false, is_freebie ?? false, is_gallery ?? false, caption || '']);
                return NextResponse.json({ success: true });
            }
            case 'birth-persona': {
                const { id, name, age, city, vibe, content_url } = payload;
                if (!id || !name || !content_url) throw new Error('Birth Credentials Incomplete.');
                
                await db.query('BEGIN');
                try {
                    // 1. Create Persona
                    await db.query(`
                        INSERT INTO personas (id, name, age, city, vibe, seed_image_url, is_active, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
                    `, [id, name, Number(age) || 22, city || '', vibe || 'mysterious', content_url]);

                    // 2. Create Initial Post
                    await db.query(`
                        INSERT INTO posts (persona_id, content_url, is_vault, is_burner, is_freebie, caption, created_at)
                        VALUES ($1, $2, false, true, false, $3, NOW())
                    `, [id, content_url, `[Neural Birth Archive]: Identity verified as ${name}.`]);

                    await db.query('COMMIT');
                    return NextResponse.json({ success: true });
                } catch (e) {
                    await db.query('ROLLBACK');
                    throw e;
                }
            }
            case 'get-conversations': {
                const { rows } = await db.query(`
                    WITH LatestMessages AS (
                        SELECT 
                            user_id, 
                            persona_id, 
                            content, 
                            role,
                            created_at,
                            ROW_NUMBER() OVER(PARTITION BY user_id, persona_id ORDER BY created_at DESC) as rn,
                            COUNT(*) OVER(PARTITION BY user_id, persona_id) as total_messages,
                            SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) OVER(PARTITION BY user_id, persona_id) as user_messages
                        FROM chat_messages
                    )
                    SELECT 
                        lm.user_id, 
                        lm.persona_id, 
                        lm.content as last_message, 
                        lm.role as last_role,
                        lm.created_at, 
                        lm.total_messages,
                        lm.user_messages,
                        p.name as persona_name,
                        p.seed_image_url as persona_image
                    FROM LatestMessages lm
                    LEFT JOIN personas p ON lm.persona_id = p.id
                    WHERE lm.rn = 1
                    ORDER BY lm.created_at DESC
                    LIMIT 50
                `);
                return NextResponse.json({ success: true, conversations: rows });
            }
            default:
                throw new Error('Neural Command Not Recognized.');
        }
    } catch (e: any) {
        console.error('[Admin Command Failure]:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}



