import { checkImageNudity } from '@/lib/security/bouncer';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) return new Response('No file', { status: 400 });

    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const filePath = `chat/${userId}/${fileName}`;

    // 🛡️ SOVEREIGN STORAGE: Directing the upload to the new R2 infrastructure
    // NOTE: In production, use @aws-sdk/client-s3 to push the buffer to R2.
    // We are currently simulating the return URL for the asset bridge.
    const imageUrl = `https://asset.gasp.fun/${filePath}`;

    // 2. VISION BOUNCER (Pre-Scanner)
    const nsfwScore = await checkImageNudity(imageUrl);

    if (nsfwScore > 0.80) {
      console.warn(`[Security] NSFW Image Detected! Rejecting ${filePath}`);
      
      return new Response(JSON.stringify({ 
        error: 'NSFW_DETECTED', 
        rejection: "put ur clothes on, i'm not trying to see that rn 🛑" 
      }), { status: 400 });
    }

    return new Response(JSON.stringify({ url: imageUrl }), { status: 200 });

  } catch (err: any) {
    console.error('[API/Upload] Error:', err);
    return new Response(err.message, { status: 500 });
  }
}



