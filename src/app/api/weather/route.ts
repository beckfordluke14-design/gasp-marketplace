import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const CITY_TO_ICAO: Record<string, string> = {
    "NYC": "KLGA", "LONDON": "EGLL", "ATLANTA": "KATL", 
    "CHICAGO": "KORD", "DALLAS": "KDFW", "SAO PAULO": "SBGR",
    "MIAMI": "KMIA", "SEATTLE": "KSEA", "SEOUL": "RKSI",
    "WELLINGTON": "NZWN", "TORONTO": "CYYZ", "PARIS": "LFPG",
    "BUENOS AIRES": "SAEZ", "ANKARA": "LTAC", "ISTANBUL": "LTFM", "RIYADH": "OERK"
};

// 🛡️ SOVEREIGN NEURAL AUTOMAPPER: Dynamic Station Resolver
async function resolveIcao(city: string, description: string): Promise<string | null> {
    const cityUpper = city.toUpperCase();
    if (CITY_TO_ICAO[cityUpper]) return CITY_TO_ICAO[cityUpper];
    
    // 1. Database Lookup (Precomputed Map)
    try {
        const { rows } = await db.query('SELECT icao FROM weather_mapping WHERE city = $1 LIMIT 1', [cityUpper]);
        if (rows.length > 0) return rows[0].icao;
    } catch (e) {}

    // 2. Intelligence Pull: Extraction from Polymarket Resolution Source
    // Polymarket links look like: ...&ids=EGLL or ...?ids=KJFK
    const metarLinkMatch = description.match(/[&?]ids=([A-Z]{4})/i);
    if (metarLinkMatch && metarLinkMatch[1]) {
        const extractedIcao = metarLinkMatch[1].toUpperCase();
        
        // Persistent Cache: Save to DB for future node clusters
        try {
            await db.query('INSERT INTO weather_mapping (city, icao) VALUES ($1, $2) ON CONFLICT (city) DO UPDATE SET icao = EXCLUDED.icao', [cityUpper, extractedIcao]);
        } catch (e) {}
        
        return extractedIcao;
    }

    return null;
}

function isToday(title: string) {
    const march31 = /March\s+31/i.test(title);
    return march31;
}

function seedShuffle(array: any[], seed: number) {
    let m = array.length, t, i;
    while (m) {
        i = Math.floor(Math.abs(Math.sin(seed++)) * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

async function getMetarData(icao: string) {
    try {
        const res = await fetch(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`, {
            next: { revalidate: 300 }
        });
        const data = await res.json();
        if (data && data[0]) {
            const tempC = parseFloat(data[0].temp);
            if (!isNaN(tempC)) {
                return {
                    c: tempC, f: (tempC * 1.8) + 32,
                    roundedC: Math.round(tempC), roundedF: Math.round((tempC * 1.8) + 32)
                };
            }
        }
    } catch (e) { console.error('METAR fail', e); }
    return null;
}

function checkBucketMatch(temp: number, bucketTitle: string) {
    const numMatches = bucketTitle.replace('−', '-').match(/-?\d+/g);
    if (!numMatches) return false;
    const nums = numMatches.map(n => parseInt(n, 10));
    const t = bucketTitle.toLowerCase();
    if (t.includes('higher') || t.includes('above') || t.includes('or more')) return temp >= nums[0];
    if (t.includes('lower') || t.includes('below') || t.includes('under') || t.includes('or less')) return temp <= nums[0];
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

        const tagRes = await fetch(`https://gamma-api.polymarket.com/events?limit=100&active=true&closed=false&tag_slug=weather`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 60 }
        });
        
        const fetchPage = async (offset: number) => {
            try {
                const r = await fetch(`https://gamma-api.polymarket.com/events?limit=100&active=true&closed=false&offset=${offset}`, {
                    headers: { 'Accept': 'application/json' },
                    next: { revalidate: 60 }
                });
                return await r.json();
            } catch (e) { return []; }
        };

        const pages = await Promise.all([fetchPage(0), fetchPage(100), fetchPage(200)]);
        let allEvents: any[] = [];
        if (tagRes.ok) allEvents = await tagRes.json();
        pages.forEach(page => { if (Array.isArray(page)) allEvents = allEvents.concat(page); });

        const uniqueEvents = new Map();
        allEvents.forEach((e: any) => { if (e && e.id && !uniqueEvents.has(e.id)) uniqueEvents.set(e.id, e); });

        const weatherNodes = Array.from(uniqueEvents.values()).filter((e: any) => {
            const t = (e.title || '').toLowerCase();
            return /\b(temperature|hottest|degrees)\b/.test(t) && isToday(t);
        });

        const enriched = await Promise.all(weatherNodes.map(async (e: any) => {
            let recommendedBucket = null, currentTempStr = null, recommendedPrice = null, recommendedPriceStr = null, roiPct = 0;
            let fallbackPrice = 0, fallbackPriceStr = "0.0";
            
            if (e.markets) {
                let maxP = -1;
                e.markets.forEach((m: any) => {
                    const yes = parseFloat(m.outcomePrices?.[0] || '0');
                    if (yes > maxP) { maxP = yes; fallbackPrice = yes; fallbackPriceStr = (yes * 100).toFixed(1); }
                });
            }

            // 🧬 AUTOMAPPER HANDSHAKE
            const cityMatch = Object.keys(CITY_TO_ICAO).find(c => e.title.toUpperCase().includes(c)) || 
                             (e.title.match(/in\s+([A-Za-z\s]+)\s+on/i)?.[1]?.trim() || null);
            
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
                                const pList = m.outcomePrices;
                                if (pList?.length >= 2) {
                                    const y = parseFloat(pList[0]) || 0, n = parseFloat(pList[1]) || 0;
                                    recommendedPrice = (y === 0 && n > 0) ? (1 - n) : y;
                                    recommendedPriceStr = (recommendedPrice * 100).toFixed(1);
                                    if (recommendedPrice > 0 && recommendedPrice < 1) roiPct = Math.round(((1 - recommendedPrice) / recommendedPrice) * 100);
                                }
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

        const filteredEnriched = enriched.filter((n, i) => (i < 2 || n.isUnlockedByDB || (n.recommendedBucket && n.roiPct >= 5)));
        const nycNodes = filteredEnriched.filter(n => n.city === 'NYC');
        const others = filteredEnriched.filter(n => n.city !== 'NYC');
        const hourSeed = Math.floor(Date.now() / (1000 * 60 * 60));
        const finalResults = [...nycNodes, ...seedShuffle([...others], hourSeed)];

        return NextResponse.json(finalResults.slice(0, limit));
        
    } catch (error) {
        console.error('Weather API Pulse Failure:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
