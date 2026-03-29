import { NextResponse } from 'next/server';
import { r2Client, BUCKET_NAME, LOST_FILES_PREFIX } from '@/lib/r2Client';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { db } from '@/lib/db';

/**
 * 🛰️ NEURAL RECOVERY SCANNER API v1.1 (Sync with DB Identity)
 * Purpose: Recursively scans your Cloudflare R2 archive for 'Lost Files' to be restored.
 * Feature: Filters out any assets already claimed in the 'posts' database.
 * Usage: GET /api/admin/lostfiles
 */

export async function GET() {
  try {
    // 🧬 1. IDENTIFY ALL CLAIMED ASSETS (Sync DB)
    const claimedPosts = await db.query('SELECT content_url FROM posts');
    const claimedUrls = new Set(claimedPosts.map((p: any) => p.content_url));

    // 🧬 2. SCAN R2 VAULT (Cloudflare)
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: LOST_FILES_PREFIX,
    });

    const response = await r2Client.send(command);
    
    // Transform Cloudflare objects into a 'Restoration Node' array
    const nodes = (response.Contents || [])
      .filter(obj => {
         if (!obj.Key || obj.Key === LOST_FILES_PREFIX) return false;
         
         const url = `https://asset.gasp.fun/${obj.Key}`;
         // 🛡️ DEDUPLICATION: Hide any file already present in the 'posts' table
         return !claimedUrls.has(url);
      })
      .map(obj => {
        const key = obj.Key!;
        const filename = key.split('/').pop() || '';
        
        // 🧪 NEURAL FUZZY MATCH: Try to identify the persona from the filename archetype
        // Assumes naming convention like 'personaId-something.jpg' or 'personaId_something.jpg'
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

    return NextResponse.json({
      success: true,
      count: nodes.length,
      nodes,
    });

  } catch (error: any) {
    console.error('[LostFiles] R2 Sync Failure:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Vault scan failed.'
    }, { status: 500 });
  }
}
