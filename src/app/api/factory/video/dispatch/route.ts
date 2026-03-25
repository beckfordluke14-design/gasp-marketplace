import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { persona_id, seed_image_url, vibe = '', prompt = '' } = await req.json();

    if (!persona_id || !seed_image_url) {
      return NextResponse.json({ error: "Missing required payload" }, { status: 400 });
    }

    let finalActionPrompt = prompt;

    // The Gemini Pre-Processor: Autonomous Scene Generation
    if (!finalActionPrompt || finalActionPrompt.trim() === '') {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY || '');
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(`Act as a high-end cinematic director. Write exactly ONE short sentence describing a hyper-realistic physical video movement for a subject with this vibe: "${vibe}". (Example: "She slowly turns her head towards the camera and smirks under neon club lights"). Do not use quotes or descriptions, just the action string.`);
            finalActionPrompt = result.response.text().trim();
        } catch (e) {
            console.error('[Gemini Pre-Processor Error]', e);
            finalActionPrompt = 'subtle cinematic movement, gazing into the camera tightly';
        }
    }

    // Ping Grok Vision Video API asynchronously
    const grokPayload = {
      model: "grok-2-vision-video",
      image_url: seed_image_url,
      // Pass the Gemini-directed prompt or the manual override naturally
      prompt: `Cinematic slow motion tracking shot, hyper-realistic, 4k. ${finalActionPrompt}`.trim(),
      duration: 15,
      webhook_url: `https://gasp-marketplace-production.up.railway.app/api/webhooks/grok?persona_id=${persona_id}`
    };

    // We do NOT await the final video completion, just fire the hook.
    // Assuming x.ai endpoint structure for the prompt
    fetch("https://api.x.ai/v1/video/generations", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROK_API_KEY || 'dummy_key'}`
        },
        body: JSON.stringify(grokPayload)
    }).catch(e => console.error("[Grok API Dispatch Error]", e));

    return NextResponse.json({ status: "rendering", message: "Grok cluster uplink active." });

  } catch (err: any) {
    console.error("[Dispatcher Error]:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



