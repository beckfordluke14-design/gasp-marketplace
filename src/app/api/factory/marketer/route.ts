/**
 * GASP ALPHA MARKETER v1.0
 * The 'CEO' of the content engine.
 * 1. Scans Brave for high-intent male trends (Cosplay, Gaming, Fashion).
 * 2. Analyzes DB performance (who is earning the most?).
 * 3. Orders new Persona Births based on market gaps.
 * 4. Strictly follows governance: No Trans, No Gay, Straight Male Fantasy only.
 */

import { createClient } from '@supabase/supabase-js';
import { BraveSearch } from '@/lib/tools/braveSearch';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GOOGLE_GEMINI_KEY = '';
const BRAVE_KEY = 'BSA2-DiqlsfcBvtr-S2oxY8DtQeWo5y';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const brave = new BraveSearch(BRAVE_KEY);

// ─── MARKET PULSE ────────────────────────────────────────────────────────────
const MARKET_QUERIES = [
  'trending latina fitness models miami 2026',
  'black women luxury aesthetic nyc 2026',
  'trending blonde white women aesthetics 2026',
  'l.a. ig model trends long blonde hair 2026',
  'trending asian gamer girl cosplay 2026',
  'quiet luxury fashion trends caucasian women 2026',
  'aesthetic girl outfits blonde hair beach vibes 2026',
];

async function getMarketPulse(): Promise<string> {
  try {
    const q = MARKET_QUERIES[Math.floor(Math.random() * MARKET_QUERIES.length)];
    const res = await brave.searchWeb(q);
    return res?.[0]?.description?.split(' ').slice(0, 15).join(' ') || 'high fashion, gamer aesthetic';
  } catch { return 'urban street style'; }
}

// ─── PERFORMANCE ANALYSIS ─────────────────────────────────────────────────────
async function getPerformanceData() {
  // Query posts to see which persona_id has most likes/unlocks
  const { data: posts } = await supabase
    .from('posts')
    .select('persona_id, is_vault')
    .limit(1000);

  if (!posts) return { top_performers: [], niches: [] };

  const stats: Record<string, number> = {};
  posts.forEach(p => {
    stats[p.persona_id] = (stats[p.persona_id] || 0) + (p.is_vault ? 5 : 1);
  });

  const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  return {
    top_performers: sorted.slice(0, 3).map(s => s[0]),
    total_active_nodes: Object.keys(stats).length
  };
}

// ─── THE ANALYST BRAIN (RESEARCH-FIRST) ──────────────────────────────────────
export async function GET() {
  try {
    const pulse = await getMarketPulse();
    const performance = await getPerformanceData();

    // The Research Mission: Identify what is TRENDING vs what we HAVE.
    const prompt = `You are the GASP ALPHA RESEARCHER.
Current Global Trends: "${pulse}"
Current DB Roster stats: ${performance.total_active_nodes} personas.
Active ID list: ${performance.top_performers.join(', ')}

RESEARCH TASKS:
1. Analyze the 'Trend Heatmap': What specific race, niche, and city is peaking based on the pulse?
2. Perform 'Gap Analysis': Based on our current nodes, what high-intent niche are we missing? (IG model, Gamer, Fitness, Cosplay).
3. Identify the 'Highest ROI Archetype': Is it a Black woman in NYC? A Latina in Miami? An Asian in Seoul?

Respond ONLY with valid JSON:
{
  "research_evidence": "summary of the market data you found",
  "market_gap_detected": "the specific niche/race we are missing",
  "verdict_reasoning": "why this will generate the most vault unlocks right now",
  "recommended_birth_vibe": "precise prompt for the next persona",
  "recommended_tier": "Normal or High-Luxury",
  "target_city": "best city for this niche"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-preview-02-05:generateContent?key=${GOOGLE_GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      }
    );

    const data = await res.json();
    const research = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

    return Response.json({
      status: 'research_complete',
      ...research,
      raw_pulse: pulse,
      roster_stats: performance
    });

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ─── EXECUTE STRATEGIC BIRTH ──────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { vibe_hint, auto_birth = true } = await req.json();
    
    // 1. Trigger the Factory Birth
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const factoryRes = await fetch(`${baseUrl}/api/factory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vibe_hint, platform_governance: 'STRAIGHT_MALE_FANTASY_ELITE' }),
      signal: AbortSignal.timeout(55000) // Give birth 55s
    });

    const newPersona = await factoryRes.json();
    
    return Response.json({
      status: 'strategic_birth_complete',
      persona: newPersona
    });

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}



