import { NextResponse } from 'next/server';
import { r2Client, BUCKET_NAME, LOST_FILES_PREFIX } from '@/lib/r2Client';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

/**
 * 🛰️ NEURAL RECOVERY SCANNER API v1.0
 * Purpose: Recursively scans your Cloudflare R2 archive for 'Lost Files' to be restored.
 * Usage: GET /api/admin/lostfiles
 */

export async function GET() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: LOST_FILES_PREFIX,
    });

    const response = await r2Client.send(command);
    
    // Transform Cloudflare objects into a 'Restoration Node' array
    const nodes = (response.Contents || [])
      .filter(obj => obj.Key && obj.Key !== LOST_FILES_PREFIX) // Skip the folder itself
      .map(obj => {
        const key = obj.Key!;
        const filename = key.split('/').pop() || '';
        
        // 🧪 NEURAL FUZZY MATCH: Try to identify the persona from the filename
        // Assumes naming convention like 'personaId-something.jpg' or 'personaId_something.jpg'
        const possiblePersona = filename.split(/[-_.]/)[0];

        return {
          id: key,
          url: `https://asset.gasp.fun/${key}`, // Base URL from user screenshot
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
    console.error('[LostFiles] R2 Scan Failure:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Vault scan failed.'
    }, { status: 500 });
  }
}
