import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const CITY_TO_ICAO: Record<string, string> = {
    "NYC": "KLGA", "LONDON": "EGLL", "ATLANTA": "KATL", 
    "CHICAGO": "KORD", "DALLAS": "KDFW", "SAO PAULO": "SBGR",
    "MIAMI": "KMIA", "SEATTLE": "KSEA", "SEOUL": "RKSI",
    "WELLINGTON": "NZWN", "TORONTO": "CYYZ", "PARIS": "LFPG",
    "BUENOS AIRES": "SAEZ", "ANKARA": "LTAC"
};

function isToday(title: string) {
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const match = title.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})/i);
    if (match) {
        const monthStr = match[1].toLowerCase();
        const day = parseInt(match[2], 10);
        const now = new Date();
        if (months.indexOf(monthStr) === now.getMonth() && day === now.getDate()) {
            return true;
        }
    }
    return false;
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
                    c: tempC,
                    f: (tempC * 1.8) + 32,
                    roundedC: Math.round(tempC),
                    roundedF: Math.round((tempC * 1.8) + 32)
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
    const titleLow = bucketTitle.toLowerCase();
    if (titleLow.includes('higher') || titleLow.includes('above') || titleLow.includes('or more')) return temp >= nums[0];
    if (titleLow.includes('lower') || titleLow.includes('below') || titleLow.includes('under') || titleLow.includes('or less')) return temp <= nums[0];
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
            const { rows: unlocks } = await db.query(
                `SELECT event_id FROM weather_unlocks WHERE user_id = $1 AND expires_at > NOW()`,
                [userId]
            );
            unlocks.forEach(r => unlockedIds.add(r.event_id));
        }

        const tagRes = await fetch(`https://gamma-api.polymarket.com/events?limit=50&active=true&closed=false&tag_slug=weather`, {
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

        const pages = await Promise.all([
            fetchPage(0), fetchPage(100), fetchPage(200)
        ]);
        
        let allEvents: any[] = [];
        if (tagRes.ok) allEvents = await tagRes.json();
        pages.forEach(page => { if (Array.isArray(page)) allEvents = allEvents.concat(page); });

        const uniqueEvents = new Map();
        allEvents.forEach((e: any) => { if (e && e.id && !uniqueEvents.has(e.id)) uniqueEvents.set(e.id, e); });

        const weatherNodes = Array.from(uniqueEvents.values()).filter((e: any) => {
            const t = (e.title || '').toLowerCase();
            const isTemp = /\b(temperature|hottest|degrees)\b/.test(t);
            return isTemp && isToday(t);
        });

        const enriched = await Promise.all(weatherNodes.map(async (e: any) => {
            let recommendedBucket = null;
            let currentTempStr = null;
            let recommendedPrice = null;
            let recommendedPriceStr = null;
            let roiPct = 0;
            
            const cityMatch = Object.keys(CITY_TO_ICAO).find(c => e.title.toUpperCase().includes(c));
            
            if (cityMatch && e.markets?.length > 0) {
                const icao = CITY_TO_ICAO[cityMatch];
                const ground = await getMetarData(icao);
                
                if (ground) {
                    const sampleBucket = e.markets[0].groupItemTitle || e.markets[0].question || '';
                    const isC = sampleBucket.includes('°C') || sampleBucket.includes('°c');
                    const activeTemp = isC ? ground.roundedC : ground.roundedF;
                    currentTempStr = `${cityMatch} is ${activeTemp}${isC ? '°C' : '°F'}`;
                    
                    for (const m of e.markets) {
                        const bucketName = m.groupItemTitle || m.question || '';
                        if (checkBucketMatch(activeTemp, bucketName)) {
                            recommendedBucket = bucketName;
                            const priceList = m.outcomePrices;
                            if (priceList?.length >= 2) {
                                const yes = parseFloat(priceList[0]) || 0;
                                const no = parseFloat(priceList[1]) || 0;
                                // Implied Price: If Yes is 0, use 1 - No
                                recommendedPrice = (yes === 0 && no > 0) ? (1 - no) : yes;
                                recommendedPriceStr = (recommendedPrice * 100).toFixed(1);
                                if (recommendedPrice > 0 && recommendedPrice < 1) {
                                    roiPct = Math.round(((1 - recommendedPrice) / recommendedPrice) * 100);
                                }
                            }
                            break;
                        }
                    }
                }
            }
            
            return {
                ...e,
                recommendedBucket,
                currentTempStr,
                recommendedPrice,
                recommendedPriceStr,
                roiPct,
                isUnlockedByDB: unlockedIds.has(e.id),
                city: cityMatch
            };
        }));

        // 🛡️ QUALITY GATE: Filter out junk/dud nodes for the locked slots
        // We only show Premium Nodes if they have a clear ACTION bucket and > 5% ROI opportunity
        const filteredEnriched = enriched.filter((n, i) => {
            if (i < 2 || n.isUnlockedByDB) return true; // Always show Freebies and already Unlocked
            return n.recommendedBucket && n.roiPct >= 5; // Only show other locked nodes if they are high-quality snipes
        });

        const nycNodes = filteredEnriched.filter(n => n.city === 'NYC');
        const others = filteredEnriched.filter(n => n.city !== 'NYC');
        const hourSeed = Math.floor(Date.now() / (1000 * 60 * 60));
        const shuffledOthers = seedShuffle([...others], hourSeed);
        const finalResults = [...nycNodes, ...shuffledOthers];

        return NextResponse.json(finalResults.slice(0, limit));
        
    } catch (error) {
        console.error('Weather API Quality Gate Failure:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
