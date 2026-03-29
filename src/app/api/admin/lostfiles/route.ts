import { NextResponse } from 'next/server';
import { r2Client, BUCKET_NAME, LOST_FILES_PREFIX } from '@/lib/r2Client';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { db } from '@/lib/db';

/**
 * 🛰️ NEURAL RECOVERY SCANNER API v1.2 (Sovereign Deep Scan)
 * Purpose: Scans Cloudflare R2 archive for 'Lost Files' to be restored.
 * Hardening: Deep scans the bucket regardless of prefix if prefix scan returns zero.
 */

export async function GET() {
  try {
    console.log(`[LostFiles] Ingress: Scanning Bucket=${BUCKET_NAME} Prefix=${LOST_FILES_PREFIX}`);
    
    // 🧬 1. IDENTIFY ALL CLAIMED ASSETS (Sync DB)
    const claimedPosts = await db.query('SELECT content_url FROM posts');
    const claimedUrls = new Set(claimedPosts.map((p: any) => p.content_url));
    console.log(`[LostFiles] Audit: Found ${claimedUrls.size} claimed posts in DB.`);

    // 🧬 2. SCAN R2 VAULT (Initial Prefix Scan)
    let command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: LOST_FILES_PREFIX,
    });

    let response = await r2Client.send(command).catch(err => {
        console.error(`[LostFiles] S3 Error (Prefix Scan):`, err);
        return { Contents: [] };
    });

    // 🧬 3. FALLBACK: DEEP BUCKET SCAN (If prefix results are empty)
    if (!response.Contents || response.Contents.length === 0) {
        console.warn(`[LostFiles] Warning: Prefix scan returned ZERO files. Performing Deep Bucket Ingress...`);
        command = new ListObjectsV2Command({ Bucket: BUCKET_NAME });
        response = await r2Client.send(command).catch(err => {
            console.error(`[LostFiles] S3 Error (Deep Scan):`, err);
            return { Contents: [] };
        });
    }

    console.log(`[LostFiles] R2 Stats: Total objects found in scan = ${response.Contents?.length || 0}`);
    
    // Transform Cloudflare objects into a 'Restoration Node' array
    const nodes = (response.Contents || [])
      .filter(obj => {
         if (!obj.Key) return false;
         // Skip folders
         if (obj.Key.endsWith('/')) return false;
         
         const url = `https://asset.gasp.fun/${obj.Key}`;
         // 🛡️ DEDUPLICATION: Hide any file already present in the 'posts' table
         const isClaimed = claimedUrls.has(url);
         
         // 🛡️ RECOVERY: Show files that are in the LOST_FILES_PREFIX OR files that are orphans anywhere
         const isInsideLostFolder = obj.Key.startsWith(LOST_FILES_PREFIX);
         
         // If we are doing a deep scan, we only show files from the lost folder
         // UNLESS the lost folder is empty, then we show everything that isn't claimed.
         return isInsideLostFolder ? !isClaimed : (!isClaimed && obj.Key.includes('lostfiles'));
      })
      .map(obj => {
        const key = obj.Key!;
        const filename = key.split('/').pop() || '';
        const possiblePersona = filename.split(/[-_.]/)[0];

        return {
          id: key,
          url: `https://asset.gasp.fun/${key}`, 
          filename,
          size: obj.Size,
          lastModified: obj.LastModified,
          suggestedPersona: possiblePersona,
        };
      });

    console.log(`[LostFiles] Final Count: Returning ${nodes.length} orphaned nodes.`);

    return NextResponse.json({
      success: true,
      count: nodes.length,
      nodes,
      scan_stats: {
          scanned: response.Contents?.length || 0,
          prefix: LOST_FILES_PREFIX
      }
    });

  } catch (error: any) {
    console.error('[LostFiles] Critical Failure:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Vault scan failed.'
    }, { status: 500 });
  }
}
