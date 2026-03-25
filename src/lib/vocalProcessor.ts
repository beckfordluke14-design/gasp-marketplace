/**
 * VOCAL PROCESSOR (Extreme Immersion Module)
 * Translates standard LLM text into hyper-realistic, origin-aware dialogue 
 * with performance tags for ElevenLabs Multilingual v2.
 */

// REGIONAL SLANG DICTIONARY
const REGIONS: Record<string, Record<string, string>> = {
    'newark': {
        'what are you doing': 'what you on',
        'money': 'coins',
        'flows': 'coins',
        'crazy': 'loco',
        'baby': 'papi',
        'i don\'t know': 'ion even know',
        'hello': 'klk'
    },
    'london': {
        'going to': 'gonna',
        'friend': 'mate',
        'crazy': 'mental',
        'yes': 'yeah bruv',
        'money': 'coins',
        'tired': 'long day innit'
    },
    'medellin': {
        'baby': 'papi',
        'my love': 'mi amor',
        'well': 'pues',
        'money': 'coins',
        'crazy': 'loco'
    }
    }

// PERFORMANCE TAG INJECTION: Neural Silence triggering (Anti-Robotic)
const TAGS = ['... ', '... -- ', '... ... ', '... '];

export function processVocalText(text: string, personaId: string, location: string, timeHour: number): string {
    let newText = text.toLowerCase();
    
    // 1. Accent Intensity (Dynamic Slang Overdrive)
    const idSum = personaId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const accentIntensity = 0.3 + ((idSum % 4) / 10); // 0.3 to 0.6 replacement probability
    
    const locKey = Object.keys(REGIONS).find(k => location.toLowerCase().includes(k)) || 'newark';
    const dictionary = REGIONS[locKey] || {};
    
    for (const [formal, slang] of Object.entries(dictionary)) {
        if (Math.random() < accentIntensity) { // Apply based on persona's unique intensity
            const regex = new RegExp(`\\b${formal}\\b`, 'gi');
            newText = newText.replace(regex, slang);
        }
    }

    // 2. Neural Warming (Google-Style Stability)
    // Mandatory leading silence to trigger natural breath
    newText = `... ${newText}`;

    // 3. Late Night "Whisper" Override (1AM-5AM)
    if (timeHour >= 1 && timeHour <= 5) {
        newText = `... (whispers) ${newText.split(' ').join(' ... ')}`;
    }

    return newText;
}


