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

async function getMetarData(icao: string) {
    try {
        const res = await fetch(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`, {
            next: { revalidate: 300 } // Cache for 5 mins
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
    // Extract negative/positive numbers from bucket (e.g., "19°C - 20°C" or "-5°C or lower")
    const numMatches = bucketTitle.replace('−', '-').match(/-?\d+/g);
    if (!numMatches) return false;
    const nums = numMatches.map(n => parseInt(n, 10));
    const titleLow = bucketTitle.toLowerCase();
    
    if (titleLow.includes('higher') || titleLow.includes('above') || titleLow.includes('or more')) {
        return temp >= nums[0];
    }
    if (titleLow.includes('lower') || titleLow.includes('below') || titleLow.includes('under') || titleLow.includes('or less')) {
        return temp <= nums[0];
    }
    if (nums.length === 2) {
        return temp >= nums[0] && temp <= nums[1];
    }
    return temp === nums[0];
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        
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
            fetchPage(0), fetchPage(100), fetchPage(200), fetchPage(300), fetchPage(400)
        ]);
        
        let allEvents: any[] = [];
        if (tagRes.ok) allEvents = await tagRes.json();
        
        pages.forEach(page => {
            if (Array.isArray(page)) allEvents = allEvents.concat(page);
        });

        const uniqueEvents = new Map();
        allEvents.forEach((e: any) => {
            if (e && e.id && !uniqueEvents.has(e.id)) uniqueEvents.set(e.id, e);
        });

        const weatherNodes = Array.from(uniqueEvents.values()).filter((e: any) => {
            const t = (e.title || '').toLowerCase();
            const isTemp = /\b(temperature|hottest|degrees)\b/.test(t);
            return isTemp && !/\b(coin|solana|bitcoin|crypto|eth|token)\b/.test(t) && isToday(t);
        });

        const recommendedNodes = await Promise.all(weatherNodes.map(async (e: any) => {
            let recommendedBucket = null;
            let currentTempStr = null;
            let recommendedPrice = null;
            let recommendedPriceStr = null;
            
            // Deduce City
            const titleUpper = (e.title || '').toUpperCase();
            const cityMatch = Object.keys(CITY_TO_ICAO).find(c => titleUpper.includes(c));
            
            if (cityMatch && e.markets && e.markets.length > 0) {
                const icao = CITY_TO_ICAO[cityMatch];
                const ground = await getMetarData(icao);
                
                if (ground) {
                    const sampleBucket = e.markets[0].groupItemTitle || e.markets[0].question || '';
                    const isC = sampleBucket.includes('°C') || sampleBucket.includes('°c');
                    const activeTemp = isC ? ground.roundedC : ground.roundedF;
                    const unit = isC ? '°C' : '°F';
                    
                    currentTempStr = `${cityMatch} is ${activeTemp}${unit}`;
                    
                    // Iterate buckets to see what matches the CURRENT ground condition
                    for (const m of e.markets) {
                        const bucketName = m.groupItemTitle || m.question || '';
                        if (checkBucketMatch(activeTemp, bucketName)) {
                            recommendedBucket = bucketName;
                            const priceList = m.outcomePrices;
                            if (priceList && priceList.length > 0) {
                                recommendedPrice = parseFloat(priceList[0]);
                                recommendedPriceStr = (recommendedPrice * 100).toFixed(1);
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
                recommendedPriceStr
            };
        }));

        // Randomly rotate to distribute 'free' nodes (which are the first 2 indices) across all active daily bets
        recommendedNodes.sort(() => Math.random() - 0.5);

        return NextResponse.json(recommendedNodes.slice(0, limit));
        
    } catch (error) {
        console.error('Polymarket Proxy Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
