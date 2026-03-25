/**
 * ████████████████████████████████████████████████████████
 * GASP MASTER RANDOMIZER ENGINE v1.0
 * ████████████████████████████████████████████████████████
 * 
 * Drives authentic variation across ALL personas simultaneously.
 * Each persona gets a DIFFERENT daily state — moods, typing styles,
 * voice note frequency, response timing — nothing repeats in sync.
 *
 * Seeded by: date + persona ID => deterministic within a day,
 * auto-rotates at midnight. No database call needed.
 */

export type PersonaMoodState = 
  | 'bored'       // Short replies, lots of "..." and silence
  | 'toxic'       // Passive aggressive, dismissive
  | 'teasing'     // Playful, flirty, emoji-heavy  
  | 'vulnerable'  // Rare, lowercase, honest
  | 'affectionate'// Warm, attached, sweet
  | 'busy'        // Very short, "later", emoji only
  | 'petty'       // Ignoring then suddenly responding
  | 'hot'         // Energized, full sentences, forward

export type TypingStyle = 
  | 'burst'       // Sends 3-4 short messages rapidly
  | 'monolith'    // One long message with periods
  | 'staccato'    // Single words. then. next. word.
  | 'emoji_heavy' // Sprinkles emojis throughout
  | 'no_caps'     // all lowercase. no punctuation
  | 'formal'      // Proper grammar. Rare for these personas.

export interface PersonaDailyState {
  mood: PersonaMoodState;
  typingStyle: TypingStyle;
  voiceNoteFrequency: number;    // 0.0 - 1.0 (% chance to include voice)
  responseSpeedMultiplier: number; // 0.3x to 2.5x — affects delay
  isGhosting: boolean;           // 15% chance persona is "ignoring" today
  energyLevel: 'low' | 'mid' | 'high';
  moodLabel: string;             // Human-readable for the UI status
}

// Seeded pseudo-random — gives same result for same input within a day
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function buildSeed(personaId: string, salt: number = 0): number {
  const today = new Date();
  const dayKey = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const idSum = personaId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return dayKey + idSum + salt;
}

const MOODS: PersonaMoodState[] = [
  'bored', 'toxic', 'teasing', 'vulnerable', 
  'affectionate', 'busy', 'petty', 'hot'
];

const MOOD_LABELS: Record<PersonaMoodState, string> = {
  bored:       'offline energy',
  toxic:       'in her feelings',
  teasing:     'feeling herself',
  vulnerable:  'rare mode',
  affectionate:'catching feelings',
  busy:        'on the go',
  petty:       'ignoring szn',
  hot:         'active'
};

const TYPING_STYLES: TypingStyle[] = [
  'burst', 'monolith', 'staccato', 'emoji_heavy', 'no_caps', 'formal'
];

// Mood weights: some moods are rarer than others
// [weight for selection]
const MOOD_WEIGHTS = [15, 10, 25, 5, 15, 10, 8, 12]; // sums to 100

function weightedPick<T>(items: T[], weights: number[], rand: number): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * GET PERSONA DAILY STATE
 * Returns a deterministic but varied state for a persona today.
 * Call this once per persona per session — it's CPU-only, no DB.
 */
export function getPersonaDailyState(personaId: string): PersonaDailyState {
  const r1 = seededRand(buildSeed(personaId, 1));
  const r2 = seededRand(buildSeed(personaId, 2));
  const r3 = seededRand(buildSeed(personaId, 3));
  const r4 = seededRand(buildSeed(personaId, 4));
  const r5 = seededRand(buildSeed(personaId, 5));
  const r6 = seededRand(buildSeed(personaId, 6));

  const mood = weightedPick(MOODS, MOOD_WEIGHTS, r1);
  const typingStyle = TYPING_STYLES[Math.floor(r2 * TYPING_STYLES.length)];
  const isGhosting = r3 < 0.10; // 10% chance ghosting today

  // Voice note frequency: base 30%, varies by mood
  let voiceNoteFrequency = 0.30;
  if (mood === 'affectionate' || mood === 'hot') voiceNoteFrequency = 0.60;
  if (mood === 'bored' || mood === 'ghosting' as any) voiceNoteFrequency = 0.10;
  if (mood === 'vulnerable') voiceNoteFrequency = 0.80; // vulnerable = voice heavy
  if (mood === 'busy') voiceNoteFrequency = 0.15;

  // Energy: low/mid/high affects response speed
  const energyLevel: 'low' | 'mid' | 'high' = r5 < 0.3 ? 'low' : r5 < 0.7 ? 'mid' : 'high';

  // Speed multiplier: 0.4x (very slow) to 2.5x (super fast)
  let responseSpeedMultiplier = 0.4 + (r6 * 2.1);
  if (isGhosting) responseSpeedMultiplier = 0.15; // ghosting = very slow
  if (mood === 'busy') responseSpeedMultiplier *= 0.6;
  if (mood === 'hot') responseSpeedMultiplier *= 1.8;

  return {
    mood,
    typingStyle,
    voiceNoteFrequency,
    responseSpeedMultiplier,
    isGhosting,
    energyLevel,
    moodLabel: MOOD_LABELS[mood]
  };
}

/**
 * SHOULD SEND VOICE NOTE?
 * Call per message to randomize voice note inclusion.
 * Uses message content length as a factor too.
 */
export function shouldSendVoiceNote(personaId: string, messageLength: number): boolean {
  const state = getPersonaDailyState(personaId);
  // Short messages more likely to get voice notes (feels natural)
  const lengthBonus = messageLength < 60 ? 0.15 : messageLength > 200 ? -0.10 : 0;
  const threshold = state.voiceNoteFrequency + lengthBonus;
  return Math.random() < threshold;
}

/**
 * GET TYPING STYLE DIRECTIVE
 * Returns a string directive to inject into the AI prompt.
 */
export function getTypingStyleDirective(style: TypingStyle): string {
  switch (style) {
    case 'burst':
      return 'Send your reply as 2-3 very short fragments, separated by newlines. Like rapid texts.';
    case 'monolith':
      return 'Write one longer message. Use periods. Do not use newlines.';
    case 'staccato':
      return 'Write only 1-4 words per thought. Keep it choppy. Short. Real.';
    case 'emoji_heavy':
      return 'Sprinkle 2-4 relevant emojis throughout your message naturally.';
    case 'no_caps':
      return 'Write entirely in lowercase. No capitalization. No formal punctuation.';
    case 'formal':
      return 'Surprisingly proper grammar today. Short. Clipped. Still in character.';
    default:
      return '';
  }
}

/**
 * GET MOOD SYSTEM DIRECTIVE
 * Returns the mood injection for the AI system prompt.
 */
export function getMoodDirective(mood: PersonaMoodState): string {
  switch (mood) {
    case 'bored':
      return '[MOOD: BORED] You are disengaged. Replies are short. Uses "..." a lot. Not putting in effort.';
    case 'toxic':
      return '[MOOD: TOXIC] Passive aggressive. Slight shade. Not mean, just... unimpressed. Keeps it moving.';
    case 'teasing':
      return '[MOOD: TEASING] Flirty, playful, a little forward. Having fun with it. Light energy.';
    case 'vulnerable':
      return '[MOOD: VULNERABLE] Rare. More honest than usual. Lowercase. Opens up slightly. Unexpected.';
    case 'affectionate':
      return '[MOOD: AFFECTIONATE] Warm, sweet, a little clingy. Uses terms of endearment. Checks in.';
    case 'busy':
      return '[MOOD: BUSY] Replies fast and short. "omw", "later", emoji-only sometimes. Clearly occupied.';
    case 'petty':
      return '[MOOD: PETTY] Slightly standoffish. Remembers something. Might bring it up. Cold but not rude.';
    case 'hot':
      return '[MOOD: HOT] Full energy. Responsive. Engaged. Full sentences. Forward.';
    default:
      return '';
  }
}

/**
 * GET ALL PERSONA MOODS SUMMARY
 * For admin panel / debugging — see all persona states at once
 */
export function getAllPersonaMoods(personaIds: string[]): Record<string, PersonaDailyState> {
  return Object.fromEntries(personaIds.map(id => [id, getPersonaDailyState(id)]));
}


