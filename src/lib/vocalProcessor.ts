/**
 * VOCAL PROCESSOR (Extreme Immersion Module)
 * Translates standard LLM text into hyper-realistic, origin-aware dialogue 
 * with performance tags for ElevenLabs Multilingual v2.
 */

// 🧬 SYNDICATE ZONE DICTIONARY: Phonetic Slang & Accent Drivers
// ElevenLabs Multilingual v2 adopts the accent of the TEXT.
const REGIONS: Record<string, Record<string, string>> = {
    'ny_dominican': { // Spanish Newark / NYC
        'hello': 'klk mi amor',
        'what are you doing': 'what you on',
        'baby': 'papi',
        'look': 'mira',
        'tell me': 'dime',
        'crazy': 'loco'
    },
    'latina_caribbean': { // DR / PR / Cuba
        'hello': 'hola papi',
        'what are you doing': 'what you on',
        'baby': 'mi amor',
        'look': 'mira',
        'tell me': 'dime',
        'crazy': 'loco',
        'yes': 'si'
    },
    'us_urban': { // American Newark / Atlanta / Jersey / Houston
        'hello': 'yo',
        'baby': 'babe',
        'what are you doing': 'what you on',
        'crazy': 'wild',
        'money': 'credits',
        'seriously': 'facts',
        'friend': 'bestie',
        'look': 'listen'
    },
    'caribbean_hub': { // Jamaica
        'hello': 'wah gwan',
        'yes': 'seen',
        'baby': 'mi love',
        'friend': 'bredrin',
        'cool': 'stunt',
        'crazy': 'mad'
    },
    'uk_london_black': { // London / Lagos
        'hello': 'how far',
        'baby': 'bruv',
        'money': 'credits',
        'trouble': 'wahala',
        'understand': 'you get me'
    },
    'col_medallo': { // Medellin
        'baby': 'papacito',
        'my love': 'mi amor',
        'well': 'pues',
        'money': 'plata',
        'cool': 'bacán'
    },
    'london': {
        'going to': 'gonna',
        'friend': 'mate',
        'yes': 'yeah bruv',
        'money': 'quid'
    }
};

// 🎭 PERFORMANCE TAGS: Force human-like stutters and inhales
const NEURAL_BREATHS = ['... (inhales) ', '... (sighs) ', '... (chuckles) ', '... '];

// 🎀 MULTI-LINGUAL MATURE REFINEMENTS (Ages 25+)
const MULTI_MATURE: Record<string, Record<string, string>> = {
    'en': { 'no cap': 'honestly', 'facts': 'certainly', 'wild': 'interesting', 'lit': 'lovely' },
    'es': { 'loco': 'increíble', 'bueno': 'fenomenal', 'mira': 'fíjate', 'dime': 'escúchame' },
    'pt': { 'bacán': 'lindo', 'papai': 'querido', 'cara': 'você', 'tá': 'está' }
};

const MULTI_FILLERS: Record<string, string[]> = {
    'en': ['... sweetheart', '... darling', '... babe', '... love'],
    'es': ['... mi amor', '... cariño', '... mi vida', '... corazón'],
    'pt': ['... querido', '... meu bem', '... amorzinho', '... vida']
};

export interface VocalResult {
    text: string;
    mood: string | null;
}

export function processVocalText(text: string, personaId: string, location: string, timeHour: number, age: number = 22, language: string = 'en'): VocalResult {
    let rawInput = text.trim();
    
    // 🎭 MOOD DETECTION: Extract identity from stage direction
    let detectedMood: string | null = null;
    const moodMatch = rawInput.match(/\[([^\]]+)\]/);
    if (moodMatch) {
         detectedMood = moodMatch[1].toLowerCase().split(' ')[0]; // Take first word e.g. "excited"
    }

    // 1a. GLOBAL BRACKET PURGE: Strip ALL [stage directions] from the text.
    let cleanText = rawInput.replace(/\[[^\]]{1,40}\]/g, '').trim();

    // 1b. LATE NIGHT WHISPER TAG: detect intent from original text BEFORE purge
    let whisperMode = false;
    const tagMatch = rawInput.match(/^\[(whispering|whisper|soft|quiet)[^\]]*\]/i);
    if (tagMatch) whisperMode = true;

    let newText = cleanText.toLowerCase();
    const langKey = language.toLowerCase().substring(0, 2); // 'es', 'pt', 'en'
    
    // 2. Dynamic Intensity Scaling
    const idSum = personaId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    let accentIntensity = age < 25 
        ? 0.4 + ((idSum % 4) / 10) 
        : 0.15 + ((idSum % 3) / 10);
    
    const locKey = Object.keys(REGIONS).find(k => location.toLowerCase().includes(k)) || 'us_urban';
    const dictionary = REGIONS[locKey] || {};
    
    // 3. Regional Slang Injection (Deterministic but biased by accent intensity)
    for (const [formal, slang] of Object.entries(dictionary)) {
        if (Math.random() < accentIntensity) {
            const regex = new RegExp(`\\b${formal}\\b`, 'gi');
            newText = newText.replace(regex, slang);
        }
    }

    // 4. Multi-Lingual Mature Refinement (25+)
    if (age >= 25) {
        const matureMap = MULTI_MATURE[langKey] || MULTI_MATURE['en'];
        for (const [slang, mature] of Object.entries(matureMap)) {
            const regex = new RegExp(`\\b${slang}\\b`, 'gi');
            newText = newText.replace(regex, mature);
        }

        if (Math.random() > 0.75) {
            const fillers = MULTI_FILLERS[langKey] || MULTI_FILLERS['en'];
            const filler = fillers[idSum % fillers.length];
            newText = `${newText} ${filler}`;
        }
    }

    // 5. HUMAN HESITATION ENGINE
    const hesitations: Record<string, string[]> = {
        'en': ['um... ', 'like, ', 'well... ', 'so... ', 'uh... '],
        'es': ['este... ', 'bueno... ', 'o sea... ', 'uf... ', 'eh... '],
        'pt': ['tipo... ', 'é... ', 'bom... ', 'hum... ', 'ah... ']
    };
    
    let injectedHesitation = '';
    // Scale hesitation by mood: bored/vulnerable more likely to hesitate
    const hesitationChance = (detectedMood === 'bored' || detectedMood === 'longing') ? 0.7 : 0.4;
    
    if (Math.random() < hesitationChance) {
        const langHesitations = hesitations[langKey] || hesitations['en'];
        injectedHesitation = langHesitations[Math.floor(Math.random() * langHesitations.length)];
    }

    newText = newText.startsWith('...') ? newText : `... ${injectedHesitation}${newText}`;

    // Late Night "Whisper" Override
    if ((timeHour >= 1 && timeHour <= 5) || whisperMode) {
        newText = newText.split(' ').join(' ... ');
    }
    
    return {
        text: newText.trim(),
        mood: detectedMood
    };
}
