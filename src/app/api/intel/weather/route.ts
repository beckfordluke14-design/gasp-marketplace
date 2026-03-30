import { NextResponse } from 'next/server';

/**
 * 🕵️‍♂️ SOVEREIGN ATMOSPHERIC HUB: Weather Prediction Alpha
 * This node ingests real-time weather and Polymarket temperature data.
 * Focus: Informational Sector Alpha. No Betting. No Wallets.
 */

const SECTOR_ICAOS: Record<string, { icao: string, city: string }> = {
    "NYC": { icao: "KLGA", city: "New York" },
    "LONDON": { icao: "EGLL", city: "London" },
    "TOKYO": { icao: "RJTT", city: "Tokyo" },
    "MEDELLIN": { icao: "SKRG", city: "Medellín" }
};

export async function GET() {
    console.log("📡 [Atmospheric Hub] Sourcing Sector Alpha...");
    
    try {
        const ids = Object.values(SECTOR_ICAOS).map(s => s.icao).join(',');
        
        // 🧬 STEP 1: Aviation Weather (METAR)
        const weatherRes = await fetch(`https://aviationweather.gov/api/data/metar?ids=${ids}&format=json`, { 
            next: { revalidate: 300 } 
        });
        const weatherData = await weatherRes.json();
        
        // 🧬 STEP 2: Polymarket Atmospheric Trends
        const polyRes = await fetch('https://gamma-api.polymarket.com/events?active=true&closed=false&limit=100&offset=0', {
            next: { revalidate: 300 }
        });
        const polyData = await polyRes.json();

        const formatted = weatherData.map((metar: any) => {
            const cityInfo = Object.values(SECTOR_ICAOS).find(s => s.icao === metar.icaoId);
            const cityName = cityInfo?.city || 'Unknown Sector';

            const matchingMarkets = polyData.filter((e: any) => 
                e.title.toLowerCase().includes(cityName.toLowerCase()) && 
                e.title.toLowerCase().includes('temperature')
            );

            const activePrice = matchingMarkets[0]?.markets[0]?.outcomePrices 
                ? JSON.parse(matchingMarkets[0].markets[0].outcomePrices)[0] 
                : null;

            return {
                sector: cityName,
                icao: metar.icaoId,
                temp: metar.temp,
                vibe: metar.clouds && metar.clouds[0] ? metar.clouds[0].cover : 'CLEAR',
                prediction: activePrice ? `${(activePrice * 100).toFixed(0)}% Certainty` : '--',
                signal_link: matchingMarkets[0] ? `https://polymarket.com/event/${matchingMarkets[0].slug}` : null
            };
        });

        return NextResponse.json({ success: true, sectors: formatted });
    } catch (e: any) {
        console.error("❌ [Atmospheric Hub Failure]:", e.message);
        return NextResponse.json({ 
            success: false, 
            sectors: Object.values(SECTOR_ICAOS).map(s => ({ sector: s.city, temp: '--', prediction: '--', vibe: 'OFFLINE' })) 
        });
    }
}
