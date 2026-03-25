import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';
import { checkImageNudity } from '@/lib/security/bouncer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) return new Response('No file', { status: 400 });

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `public/${fileName}`;

    // 1. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat_media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat_media/${filePath}`;

    // 2. VISION BOUNCER (Pre-Scanner)
    const nsfwScore = await checkImageNudity(imageUrl);

    if (nsfwScore > 0.80) {
      console.warn(`[Security] NSFW Image Detected! Deleting ${filePath}`);
      
      // Instantly Delete the file
      await supabase.storage
        .from('chat_media')
        .remove([filePath]);

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



