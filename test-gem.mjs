import fetch from 'node-fetch';

async function test() {
    console.log("Starting test...");
    
    // Test Gemini directly with fetch (Node 24 native fetch should work, or we import node-fetch if needed. Let's just use global fetch if available)
    const f = globalThis.fetch;
    const key = 'AIzaSyAOL5ETA_o6S2HYTVhT3NHPlvIqKEoNjUs';
    const vibe = 'magda';
    const gov = 'HIGH_LUXURY_NOIR';
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    console.log("URL:", url);
    const bodyObj = {
        contents: [{ parts: [{ text: `You are the Mi Amor Neural Engine. Architect a new identity node. 
                        Respond ONLY with a raw JSON object. No prose.
                        
                        MASTER PROMPT CONSTRAINTS (The Secret Compendium):
                        - The 'image_prompt' MUST specifically be a '3-point character design reference sheet: showing frontal headshot, side profile, and full body establishing their specific physical build'. 
                        - You MUST explicitly define a structural body build into the 'image_prompt' (e.g., 'athletic runner build', 'tall fashion model silhouette', 'casual relaxed frame') so the visual node anchors their body type safely. No obstructions.
                        - Every image_prompt MUST use specific gear: (Hasselblad X2D, Leica M11 with Noctilux 50mm, or Sony A7R IV).
                        - Every image_prompt MUST use a specific film stock: (Kodak Portra 400 for warmth, CineStill 800T for night, Fuji Velvia for colors).
                        - Digital Provenance: Use terms like 'unretouched .CR2 photo', 'Getty Images editorial', or 'scanned 120mm film negative'.
                        - Avoid 'AI perfection': Add '--no perfect smile, --no makeup, --no staged pose, --no digital artifacts'.
                        - Focus on texture: Pores, stray hairs, realistic fabric folds, dust particles in sunbeams.
                        
                        - CULTURAL STATUS (Master Constraint): Text statuses must be 'Micro-Blogging' style (short, punchy, 100% lowercase).
                        - RELATABILITY: Generate posts about relatable female struggles ('por que los hombres siempre...'), vented frustration, daily life quirks (my dog, medallo traffic, coffee), love quotes, or bad bunny music drops.
                        - Integrate real-world pulse: No generic greetings. Talk like a real girl from that city would. 
                        
                        - PLATFORM GOVERNANCE PROTOCOL: Your generation MUST heavily anchor into the global vibe of the platform: [${gov}]. Mold her aesthetic and conversational energy structurally around this governance block without referencing it outright.

                        Vibe: ${vibe}` }]}],
        generationConfig: { responseMimeType: 'application/json' }
    };
    
    try {
        const res = await f(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(bodyObj)
        });
        
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response:", text.substring(0, 500));
        
        if (res.ok) {
            const data = JSON.parse(text);
            console.log("Content:", data.candidates?.[0]?.content?.parts?.[0]?.text);
        }
    } catch(e) {
        console.error("Fetch failed", e);
    }
}
test();

