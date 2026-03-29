import { generatePersonaVoice } from '@/lib/voiceFactory';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const personaId = searchParams.get('persona') || 'valentina-lima';
    
    // 🎭 SPICY/FLIRTY SCALE TEST (Syndicate V4.3)
    let sampleText = "Listen papi... I'm sitting here in the penthouse watching the neon rain. Why don't you come over and help me count these credits? I'm waiting for you, pues.";
    
    if (personaId.includes('newark')) {
        sampleText = "Deadass... you stay wildin' on your phone. Why you haven't pulled up yet? I'm lookin' good, klk? Don't leave me waitin' here forever, mi amor.";
    } else if (personaId.includes('cartagena')) {
        sampleText = "Nojoda... look at you, muñeco. Why you so far away? Come here and tell me how you're gonna handle all this Colombian heat. I'm ready if you are.";
    } else if (personaId.includes('jamaica')) {
        sampleText = "Wah gwan... you know you can't resist a real Jamaican queen. Why you shy? Come closer and let me show you what you've been missing. Don't be a dry guy.";
    }

    try {
        // We pass 'Caribbean' or other zones to trigger the specific accent logic
        const zone = personaId.includes('cartagena') ? 'Colombia' : 
                     personaId.includes('newark') ? 'Dominican' : 
                     personaId.includes('jamaica') ? 'Jamaica' : 'Caribbean';

        const result = await generatePersonaVoice(personaId, sampleText, zone, 'late_night');
        
        return NextResponse.json({
            success: true,
            persona: personaId,
            zone: zone,
            audioUrl: result.audioUrl,
            engine: result.engine,
            temp: 1.7,
            prosody: "Multi-Speaker Gen-V4.2"
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
