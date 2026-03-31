import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        
        // 1. Fetch specific tag
        const tagRes = await fetch(`https://gamma-api.polymarket.com/events?limit=50&active=true&closed=false&tag_slug=weather`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 60 }
        });
        
        // 2. Fetch recent general active markets to find daily temperature/hurricane bets
        // (Polymarket places daily highs in the first few hundred active events)
        const fetchPage = async (offset: number) => {
            try {
                const r = await fetch(`https://gamma-api.polymarket.com/events?limit=100&active=true&closed=false&offset=${offset}`, {
                    headers: { 'Accept': 'application/json' },
                    next: { revalidate: 60 }
                });
                return await r.json();
            } catch (e) {
                return [];
            }
        };

        const pages = await Promise.all([
            fetchPage(0), fetchPage(100), fetchPage(200), fetchPage(300), fetchPage(400)
        ]);
        
        let allEvents: any[] = [];
        if (tagRes.ok) {
            allEvents = await tagRes.json();
        }
        
        pages.forEach(page => {
            if (Array.isArray(page)) {
                allEvents = allEvents.concat(page);
            }
        });

        // Unique by ID
        const uniqueEvents = new Map();
        allEvents.forEach((e: any) => {
            if (e && e.id && !uniqueEvents.has(e.id)) {
                uniqueEvents.set(e.id, e);
            }
        });

        // Filter: We want ONLY Temperature events based strictly on TITLE
        const weatherNodes = Array.from(uniqueEvents.values()).filter(e => {
            const t = (e.title || '').toLowerCase();
            // Use regex boundaries for strictly temperature-related markets
            const isTemp = /\b(temperature|hottest|degrees)\b/.test(t);
            return isTemp && !/\b(coin|solana|bitcoin|crypto|eth|token)\b/.test(t);
        });

        // Sort by trading volume so the most liquid bets show up first
        weatherNodes.sort((a, b) => ((b.volume || b.volume24hr || 0) - (a.volume || a.volume24hr || 0)));

        return NextResponse.json(weatherNodes.slice(0, limit));
        
    } catch (error) {
        console.error('Polymarket Proxy Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
