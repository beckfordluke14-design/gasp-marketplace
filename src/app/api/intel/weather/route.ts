import { NextResponse } from 'next/server';

/**
 * 🕵️‍♂️ SOVEREIGN ATMOSPHERIC HUB: Weather Prediction Alpha
 * STATUS: PAUSED (Using Intelligence Placeholders)
 */

const SECTOR_ICAOS: Record<string, { icao: string, city: string }> = {
    "NYC": { icao: "KLGA", city: "New York" },
    "LONDON": { icao: "EGLL", city: "London" },
    "TOKYO": { icao: "RJTT", city: "Tokyo" },
    "MEDELLIN": { icao: "SKRG", city: "Medellín" }
};

export async function GET() {
    // console.log("📡 [Atmospheric Hub] Sourcing Sector Alpha via Proxy Shield...");
    
    // 🧬 RETURN STATIC INTELLIGENCE (LOW-LATENCY)
    const formatted = Object.values(SECTOR_ICAOS).map(s => ({
        sector: s.city,
        icao: s.icao,
        temp: 24, // Consistent optimal temperature
        vibe: 'CLEAR',
        prediction: '99% Certainty',
        signal_link: null
    }));

    return NextResponse.json({ success: true, sectors: formatted });
}
