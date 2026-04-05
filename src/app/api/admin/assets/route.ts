import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { r2Client, BUCKET_NAME } from '@/lib/r2Client';
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { isAdminRequest, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * 🛰️ SOVEREIGN ASSET DISCOVERY v2.1
 * Purpose: Identifies 'Orphaned' database entries (dead images) and 
 * provides a real-time browser for the Cloudflare R2 'Lost Files' vault.
 */
export async function GET(req: Request) {
    try {
        if (!(await isAdminRequest(req))) return unauthorizedResponse();

        // 1. Identify Orphans (Dead/Placeholder Persona Images)
        const { rows: orphanPersonas } = await db.query(`
            SELECT id, name, seed_image_url as url, 'persona' as type 
            FROM personas 
            WHERE seed_image_url IS NULL OR seed_image_url LIKE '%null%' OR seed_image_url = ''
        `);

        // 2. Identify Orphaned Posts (Placeholder Feed Items)
        const { rows: orphanPosts } = await db.query(`
            SELECT id, persona_id, content_url as url, 'post' as type 
            FROM posts 
            WHERE (content_url IS NULL OR content_url LIKE '%null%' OR content_url = '')
            AND content_type != 'text'
            ORDER BY created_at DESC LIMIT 100
        `);

        // 3. Identify ALL Inventory (For Nodal Inventory Hub)
        const { rows: allPosts } = await db.query(`
            SELECT id, persona_id, content_url, content_type, is_vault, is_gallery, is_freebie, caption, created_at 
            FROM posts 
            WHERE (caption IS NULL OR caption NOT LIKE 'DELETED%')
            ORDER BY created_at DESC
        `);


        // 4. Browse ALL R2 Assets (Global Node Discovery)
        const r2Prefixes = ['', 'personas/', 'posts/', 'profile/'];
        let r2Assets: any[] = [];

        // Note: Using ['', 'personas/', ...] to ensure we hit root and subfolders
        // We will deduplicate based on Key
        const seenKeys = new Set<string>();

        for (const prefix of r2Prefixes) {
            const cmd = new ListObjectsV2Command({
                Bucket: BUCKET_NAME,
                Prefix: prefix,
                MaxKeys: 1000
            });
            const { Contents } = await r2Client.send(cmd);
            if (Contents) {
                Contents.forEach(item => {
                    if (item.Key && !item.Key.endsWith('/') && !seenKeys.has(item.Key)) {
                        seenKeys.add(item.Key);
                        r2Assets.push({
                            key: item.Key,
                            url: `https://asset.gasp.fun/${item.Key}`,
                            size: item.Size,
                            lastModified: item.LastModified
                        });
                    }
                });
            }
        }


        return NextResponse.json({ 
            success: true, 
            orphans: [...orphanPersonas, ...orphanPosts],
            vault: r2Assets,
            posts: allPosts
        });


    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

/**
 * 🛠️ SOVEREIGN GRAFTING PROTOCOL
 * Bonds a database record to an R2 file asset.
 */
export async function POST(req: Request) {
    try {
        if (!(await isAdminRequest(req))) return unauthorizedResponse();

        const { id, type, assetUrl, personaId, action, targetPersonaId } = await req.json();
        
        // 🧪 SOVEREIGN ACTION: CRAFTING NEW NODES (VAULT / GALLERY / GIFT)
        if (action === 'create_vault' || action === 'create_gallery' || action === 'create_freebie') {
            const isVault = action === 'create_vault';
            const isFreebie = action === 'create_freebie';
            if (!personaId || !assetUrl) return NextResponse.json({ success: false, error: 'MISSING_DATA' }, { status: 400 });
            const { rows } = await db.query(`
                INSERT INTO posts (persona_id, content_url, content_type, is_vault, is_gallery, is_freebie, caption, created_at, updated_at)
                VALUES ($1, $2, 'image', $3, $4, $5, 'Identity Update // Syndicate Node', NOW(), NOW())
                RETURNING id
            `, [personaId, assetUrl, isVault, (action === 'create_gallery'), isFreebie]);
            return NextResponse.json({ success: true, createdId: rows[0].id });
        }

        // 🧪 SOVEREIGN ACTION: OVERHAULING EXISTING POSTS
        if (action === 'toggle_vault') {
            await db.query(`UPDATE posts SET is_vault = NOT is_vault, is_gallery = false, is_freebie = false WHERE id = $1`, [id]);
            return NextResponse.json({ success: true });
        }
        if (action === 'toggle_gallery') {
            await db.query(`UPDATE posts SET is_gallery = NOT is_gallery, is_vault = false, is_freebie = false WHERE id = $1`, [id]);
            return NextResponse.json({ success: true });
        }
        if (action === 'toggle_freebie') {
            await db.query(`UPDATE posts SET is_freebie = NOT is_freebie, is_vault = false, is_gallery = false WHERE id = $1`, [id]);
            return NextResponse.json({ success: true });
        }

        if (action === 'move_to_persona') {
            await db.query(`UPDATE posts SET persona_id = $1 WHERE id = $2`, [targetPersonaId, id]);
            return NextResponse.json({ success: true });
        }
        if (action === 'hide_post') {
            await db.query(`UPDATE posts SET caption = CONCAT('DELETED // ', COALESCE(caption, '')) WHERE id = $1`, [id]);
            return NextResponse.json({ success: true });
        }

        if (!id || !type || !assetUrl) return NextResponse.json({ success: false, error: 'MISSING_DATA' }, { status: 400 });

        if (type === 'persona') {
            console.log(`[Grafting Pulse] Target: ${id} | Asset: ${assetUrl}`);
            
            // 📡 STAGE 1: DIRECT ID MATCH
            let res = await db.query(`UPDATE personas SET seed_image_url = $1 WHERE id = $2`, [assetUrl, id]);
            
            // 📡 STAGE 2: EXACT NAME MATCH (Fallback for human-readable IDs)
            if (res.rowCount === 0) {
                console.log(`[Grafting Fallback] Retrying by Name...`);
                res = await db.query(`UPDATE personas SET seed_image_url = $1 WHERE name = $2`, [assetUrl, id]);
            }

            // 📡 STAGE 3: FUZZY NAME MATCH (Last Resort for birthed nodes)
            if (res.rowCount === 0) {
               console.log(`[Grafting Fallback] Retrying by Fuzzy Match...`);
               const { rows } = await db.query(`SELECT id FROM personas WHERE name ILIKE $1 LIMIT 1`, [`%${id}%`]);
               if (rows[0]) {
                   res = await db.query(`UPDATE personas SET seed_image_url = $1 WHERE id = $2`, [assetUrl, rows[0].id]);
               }
            }

            if (res.rowCount === 0) {
                console.error(`[Grafting Critical] Target not found: ${id}`);
                return NextResponse.json({ success: false, error: 'PERSONA_NOT_FOUND' }, { status: 404 });
            }
        } else if (type === 'post') {
            const res = await db.query(`UPDATE posts SET content_url = $1 WHERE id = $2`, [assetUrl, id]);
            if (res.rowCount === 0) return NextResponse.json({ success: false, error: 'POST_NOT_FOUND' }, { status: 404 });
        }

        return NextResponse.json({ success: true, updatedId: id });

    } catch (err: any) {
        console.error('[Grafting Failure Dialect]:', err.message);
        return NextResponse.json({ success: false, error: err.message || 'Vault write failure.' }, { status: 500 });
    }
}
