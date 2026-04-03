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
            FROM feed_posts 
            WHERE content_url IS NULL OR content_url LIKE '%null%' OR content_url = ''
            ORDER BY created_at DESC LIMIT 100
        `);

        // 3. Browse R2 Vault (Real-time Cloudflare Listing)
        const r2Prefixes = ['personas/', 'posts/personas/lostfiles/'];
        let r2Assets: any[] = [];

        for (const prefix of r2Prefixes) {
            const cmd = new ListObjectsV2Command({
                Bucket: BUCKET_NAME,
                Prefix: prefix,
                MaxKeys: 1000
            });
            const { Contents } = await r2Client.send(cmd);
            if (Contents) {
                Contents.forEach(item => {
                    if (item.Key && !item.Key.endsWith('/')) {
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
            vault: r2Assets 
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

        const { id, type, assetUrl } = await req.json();
        if (!id || !type || !assetUrl) return NextResponse.json({ success: false, error: 'MISSING_DATA' }, { status: 400 });

        if (type === 'persona') {
            await db.query(`UPDATE personas SET seed_image_url = $1 WHERE id = $2`, [assetUrl, id]);
        } else if (type === 'post') {
            await db.query(`UPDATE feed_posts SET content_url = $1 WHERE id = $2`, [assetUrl, id]);
        }

        return NextResponse.json({ success: true, updatedId: id });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
