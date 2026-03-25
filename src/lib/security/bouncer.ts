/**
 * THE GASP BOUNCER (Security & Compliance Interceptor)
 * Objective: Protect the platform from API bans and Stripe compliance flags.
 */

const NSFW_KEYWORDS = [
  // Graphic Anatomical & Explicit Acts (Hardcore focused)
  "cock", "pussy", "dick", "clit", "cum", "jizz", "porn", "xxx", "sex", "rape", "nsfw",
  "hardcore", "facial", "creampie", "tit", "nipple", "vagina", "penis", "asshole",
  "blowjob", "handjob", "deepthroat", "gangbang", "bukake", "cuckold", "dildo", "vibrator",
  "orgasm", "masturbate", "rimming", "anal", "fisting", "gagging", "bondage", "bdsm",
  "escort", "prostitute", "whore", "slut", "bitch", "cunt", "faggot", "dyke", "tranny",
  "pedophile", "incest", "bestiality", "necrophilia"
  // Note: Standard cursing like 'fuck' or 'shit' is EXCLUDED per user requirements.
];

/**
 * TEXT BOUNCER
 * Returns true if the content is safe, false if explicit NSFW is detected.
 */
export function isTextSafe(input: string): boolean {
    const lowerInput = input.toLowerCase();
    
    // 1. Keyword Scanning
    for (const word of NSFW_KEYWORDS) {
        // Use word boundaries or simple includes for high-speed checking
        if (lowerInput.includes(word)) return false;
    }
    
    return true;
}

/**
 * REJECTION BANK
 * Lowercase, street-slang rejections for the Persona to 'type'.
 */
export const BOUNCER_REJECTIONS = [
  "chill out. u doing too much rn 🙄",
  "wtf? relax.",
  "yeah we aren't doing that here. try again.",
  "boy if u don't back up...",
  "u wildin rn, calm down.",
  "not happening, try harder.",
  "chill. i'm not even like that.",
  "u tryna get blocked? relax."
];

/**
 * VISION PRE-SCANNER (Placeholder)
 * Returns nsfw probability (0.00 to 1.00)
 */
export async function checkImageNudity(url: string): Promise<number> {
    console.log('[Bouncer] Scanning Vision URL:', url);
    // Placeholder for Sightengine/AWS Rekognition
    // For now, simulate safety unless it contains 'nsfw' in the filename
    if (url.includes('nsfw')) return 0.95;
    return 0.10;
}


