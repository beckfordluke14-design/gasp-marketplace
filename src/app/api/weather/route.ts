import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const CITY_TO_ICAO: Record<string, string> = {
    "NYC": "KLGA", "LONDON": "EGLL", "ATLANTA": "KATL", 
    "CHICAGO": "KORD", "DALLAS": "KDFW", "SAO PAULO": "SBGR",
    "MIAMI": "KMIA", "SEATTLE": "KSEA", "SEOUL": "RKSI",
    "WELLINGTON": "NZWN", "TORONTO": "CYYZ", "PARIS": "LFPG",
    "BUENOS AIRES": "SAEZ", "ANKARA": "LTAC", "ISTANBUL": "LTFM", "RIYADH": "OERK"
};

// 🛡️ INDESTRUCTIBLE CLOB SNIPER
async function fetchClobPrices(tokenIds: string[]): Promise<Record<string, number>> {
    if (!tokenIds.length) return {};
    try {
        const query = [...new Set(tokenIds)].join(',');
        const res = await fetch(`https://clob.polymarket.com/prices?token_ids=${query}`, {
            next: { revalidate: 10 } 
        });
        const data = await res.json();
        const priceMap: Record<string, number> = {};
        if (data && typeof data === 'object') {
            Object.entries(data).forEach(([tid, price]) => {
               const p = parseFloat(String(price));
               if (!isNaN(p)) priceMap[tid] = p;
            });
        }
        return priceMap;
    } catch (e) {
        console.error('CLOB Fatal:', e);
        return {};
    }
}

async function resolveIcao(city: string, description: string): Promise<string | null> {
    const cityUpper = city.toUpperCase();
    if (CITY_TO_ICAO[cityUpper]) return CITY_TO_ICAO[cityUpper];
    try {
        const { rows } = await db.query('SELECT icao FROM weather_mapping WHERE city = $1 LIMIT 1', [cityUpper]);
        if (rows.length > 0) return rows[0].icao;
    } catch (e) {}
    const metarLinkMatch = description.match(/[&?]ids=([A-Z]{4})/i);
    if (metarLinkMatch && metarLinkMatch[1]) {
        const extractedIcao = metarLinkMatch[1].toUpperCase();
        try { await db.query('INSERT INTO weather_mapping (city, icao) VALUES ($1, $2) ON CONFLICT (city) DO UPDATE SET icao = EXCLUDED.icao', [cityUpper, extractedIcao]); } catch (e) {}
        return extractedIcao;
    }
    return null;
}

function isToday(title: string) {
    const d = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const regex = new RegExp(`${month}\\s+${day}`, 'i');
    return regex.test(title) || title.toLowerCase().includes('today');
}

function seedShuffle(array: any[], seed: number) {
    let m = array.length, t, i;
    while (m) { i = Math.floor(Math.abs(Math.sin(seed++)) * m--); t = array[m]; array[m] = array[i]; array[i] = t; }
    return array;
}

async function getMetarData(icao: string) {
    try {
        const res = await fetch(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`, { next: { revalidate: 300 } });
        const data = await res.json();
        if (data && data[0]) {
            const tempC = parseFloat(data[0].temp);
            if (!isNaN(tempC)) return { c: tempC, f: (tempC * 1.8) + 32, roundedC: Math.round(tempC), roundedF: Math.round((tempC * 1.8) + 32) };
        }
    } catch (e) {}
    return null;
}

function checkBucketMatch(temp: number, bucketTitle: string) {
    const numMatches = bucketTitle.replace('−', '-').match(/-?\d+/g);
    if (!numMatches) return false;
    const nums = numMatches.map(n => parseInt(n, 10));
    const t = bucketTitle.toLowerCase();
    if (t.includes('higher') || t.includes('above') || t.includes('more')) return temp >= nums[0];
    if (t.includes('lower') || t.includes('below') || t.includes('under')) return temp <= nums[0];
    if (nums.length === 2) return temp >= nums[0] && temp <= nums[1];
    return temp === nums[0];
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const userId = searchParams.get('userId');
        
        let unlockedIds = new Set<string>();
        if (userId) {
            const { rows: unlocks } = await db.query(`SELECT event_id FROM weather_unlocks WHERE user_id = $1 AND expires_at > NOW()`, [userId]);
            unlocks.forEach(r => unlockedIds.add(r.event_id));
        }

        const tagRes = await fetch(`https://gamma-api.polymarket.com/events?limit=40&active=true&closed=false&tag_slug=weather`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 60 }
        });
        if (!tagRes.ok) return NextResponse.json([]);
        const rawEvents = await tagRes.json();
        
        const weatherNodes = rawEvents.filter((e: any) => {
            const t = (e.title || '').toLowerCase();
            return /\b(temperature|hottest|degrees|highest)\b/.test(t) && isToday(t);
        });

        // 🧠 DEEP TOKEN SCAN: Handle both string and array formats
        const allTokenIds: string[] = [];
        weatherNodes.forEach((e: any) => {
            e.markets?.forEach((m: any) => {
                try {
                    let tids = [];
                    if (typeof m.clobTokenIds === 'string') tids = JSON.parse(m.clobTokenIds);
                    else if (Array.isArray(m.clobTokenIds)) tids = m.clobTokenIds;
                    if (tids && tids[0]) allTokenIds.push(tids[0]);
                } catch(err) {}
            });
        });

        const liveClobPrices = await fetchClobPrices(allTokenIds);

        const enriched = await Promise.all(weatherNodes.map(async (e: any) => {
            let recommendedBucket = null, currentTempStr = null, recommendedPrice = null, recommendedPriceStr = null, roiPct = 0;
            let fallbackPrice = 0, fallbackPriceStr = "0.0";
            
            if (e.markets) {
                let maxP = -1;
                e.markets.forEach((m: any) => {
                    try {
                        let tids = [];
                        if (typeof m.clobTokenIds === 'string') tids = JSON.parse(m.clobTokenIds);
                        else if (Array.isArray(m.clobTokenIds)) tids = m.clobTokenIds;
                        
                        // CLOB First, Gamma Second
                        const p = liveClobPrices[tids[0]] || parseFloat(m.outcomePrices?.[0] || '0');
                        if (p > maxP && p > 0) { 
                            maxP = p; 
                            fallbackPrice = p; 
                            fallbackPriceStr = (p * 100).toFixed(1); 
                        }
                    } catch(err) {}
                });
            }

            const cityMatch = Object.keys(CITY_TO_ICAO).find(c => e.title.toUpperCase().includes(c)) || (e.title.match(/in\s+([A-Za-z\s]+)\s+on/i)?.[1]?.trim() || null);
            
            if (cityMatch && e.markets?.length > 0) {
                const icao = await resolveIcao(cityMatch, e.description || '');
                if (icao) {
                    const ground = await getMetarData(icao);
                    if (ground) {
                        const sampleBucket = e.markets[0].groupItemTitle || e.markets[0].question || '';
                        const isC = sampleBucket.includes('°C') || sampleBucket.includes('°c');
                        const activeTemp = isC ? ground.roundedC : ground.roundedF;
                        currentTempStr = `${cityMatch.toUpperCase()} IS ${activeTemp}${isC ? '°C' : '°F'}`;
                        
                        for (const m of e.markets) {
                            const bucketName = m.groupItemTitle || m.question || '';
                            if (checkBucketMatch(activeTemp, bucketName)) {
                                recommendedBucket = bucketName;
                                try {
                                    let tids = [];
                                    if (typeof m.clobTokenIds === 'string') tids = JSON.parse(m.clobTokenIds || '[]');
                                    else if (Array.isArray(m.clobTokenIds)) tids = m.clobTokenIds;
                                    
                                    recommendedPrice = liveClobPrices[tids[0]] || parseFloat(m.outcomePrices?.[0] || '0');
                                    recommendedPriceStr = (recommendedPrice * 100).toFixed(1);
                                    if (recommendedPrice > 0 && recommendedPrice < 1) roiPct = Math.round(((1 - recommendedPrice) / recommendedPrice) * 100);
                                } catch(err) {}
                                break;
                            }
                        }
                    }
                }
            }
            
            return {
                ...e,
                recommendedBucket, currentTempStr, recommendedPrice, recommendedPriceStr, fallbackPrice, fallbackPriceStr, roiPct,
                isUnlockedByDB: unlockedIds.has(e.id), city: cityMatch
            };
        }));

        const hourSeed = Math.floor(Date.now() / (1000 * 60 * 60));
        const finalResults = seedShuffle(enriched.filter(n => n.fallbackPrice > 0), hourSeed);

        return NextResponse.json(finalResults.slice(0, limit));
    } catch (error) {
        console.error('Final Logic Failure:', error);
        return NextResponse.json([]);
    }
}
