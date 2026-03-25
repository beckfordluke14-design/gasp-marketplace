/**
 * THE GASP PULSE ENGINE (Dopamine Latency Algorithm)
 * Objective: Eliminate robotic instant reactions and simulate human texting patterns.
 */

export interface LatencyResult {
  delayMs: number;
  needsApology: boolean;
  intensity: 'fast' | 'normal' | 'slow';
}

/**
 * CALCULATE RESPONSE DELAY
 * Logic:
 * - HARD TO GET: First 3 user messages = 10-18s delay. (Simulate checking notifications).
 * - HEATED CONVO: Short exchanges (< 40 characters) = 2-5s delay. (Simulate active typing).
 * - LATE NIGHT DRAG: If local time is 11 PM - 5 AM = 15-40s delay. (Simulate dozing off).
 * - COMPLEXITY: + 100ms per character of the AI response (simulated typing speed).
 */
export function calculateResponseDelay(
  messageLength: number, 
  userStatus: string = 'standard', 
  hasTip: boolean = false,
  convoHistory: any[] = [],
  localHour: number = 14 // default afternoon
): LatencyResult {
  
  // 1. WHALE OVERRIDE (Priority but not instant)
  if (userStatus === 'whale' || hasTip) {
    return { delayMs: 800 + Math.random() * 2000, needsApology: false, intensity: 'fast' };
  }

  const userMsgs = convoHistory.filter(m => m.role === 'user');
  const isInitial = userMsgs.length < 3;
  
  const lastMsg = convoHistory[convoHistory.length - 1];
  const isShortExchange = lastMsg && lastMsg.content?.length < 50;

  // 2. STAGE CALCULATIONS
  let baseDelay = 3000; // default 3s
  let variance = 2000;

  // RULE A: HARD TO GET (Initial)
  if (isInitial) {
     baseDelay = 10000;
     variance = 8000;
  } 
  // RULE B: HEATED (Fast Fire)
  else if (isShortExchange) {
     baseDelay = 1500;
     variance = 2500;
  }
  // RULE C: LATE NIGHT (Tired)
  if (localHour >= 23 || localHour <= 5) {
     baseDelay += 12000;
     variance += 15000;
  }

  // Add typing simulation (100ms per char)
  const typingSimulation = messageLength * 80;

  const totalDelay = baseDelay + (Math.random() * variance) + typingSimulation;
  
  return {
    delayMs: totalDelay,
    needsApology: totalDelay > 45000,
    intensity: totalDelay < 5000 ? 'fast' : totalDelay > 20000 ? 'slow' : 'normal'
  };
}

/**
 * SHARED REALITY CONTEXT (Reality Sync)
 */
export async function getEnvironmentContext(city: string) {
  const map: Record<string, string> = {
    'Santiago': 'America/Santo_Domingo',
    'Medellín': 'America/Bogota',
    'Santo Domingo': 'America/Santo_Domingo',
    'Tulum': 'America/Cancun',
    'Buenos Aires': 'America/Argentina/Buenos_Aires',
    'Rio': 'America/Sao_Paulo'
  };
  const tz = map[city] || 'UTC';
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: true });
  const rawHour = parseInt(now.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }));

  const vibes = ['humid as hell', 'pure tropical energy', 'dripping in rain', 'sunset heat', 'warm breeze nights'];
  const weather = vibes[Math.floor(Math.random() * vibes.length)];

  return {
    time: timeStr.toLowerCase(),
    weather,
    rawHour
  };
}


