/**
 * SYSTEM 1: BRAVE SEARCH UTILITY (Web Awareness Engine)
 * Objective: Give Gasp AI personas "Reality Sync" via real-time web retrieval.
 */
export class BraveSearch {
  private apiKey: string;
  private baseUrl = 'https://api.search.brave.com/res/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchWeb(query: string) {
    try {
      const res = await fetch(`${this.baseUrl}/web/search?q=${encodeURIComponent(query)}&count=2`, {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': this.apiKey
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.web?.results?.map((r: any) => ({
        title: r.title,
        description: r.description,
        url: r.url
      })) || [];
    } catch (err) {
      console.error('[Brave/Web] Error:', err);
      return null;
    }
  }

  async searchNews(query: string, recency: string = '1d') {
    try {
      const res = await fetch(`${this.baseUrl}/news/search?q=${encodeURIComponent(query)}&count=2&freshness=${recency}`, {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': this.apiKey
        }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.results?.map((r: any) => ({
        title: r.title,
        description: r.description,
        source: r.source,
        age: r.age
      })) || [];
    } catch (err) {
      console.error('[Brave/News] Error:', err);
      return null;
    }
  }

  async searchImage(query: string) {
    try {
        const res = await fetch(`${this.baseUrl}/images/search?q=${encodeURIComponent(query)}&count=1`, {
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': this.apiKey
          }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.results?.[0]?.properties?.url || null;
    } catch (err) {
        console.error('[Brave/Image] Error:', err);
        return null;
    }
  }
}

/**
 * Rapid Entity Extraction Trigger (Bouncer Prototype)
 */
export function detectWebTriggers(text: string): { topic: string, type: 'web' | 'news' | 'image' } | null {
  const brandRegex = /\b(yzy|nike|off-white|balenciaga|lvmh|stussy|supreme|rolex|porsche|ferrari|lamborghini)\b/i;
  const cryptoRegex = /\b(\$btc|\$sol|\$eth|\$gasp|bitcoin|solana|ethereum|crypto|trading|wallet|pump\.fun)\b/i;
  const eventRegex = /\b(news|happening|event|announced|dropped|release|scandal|drama|concert|festival|party)\b/i;
  const imageRegex = /\b(show me|send me|look like|pic of|visual|selfie|photo)\b/i;
  const hobbyRegex = /\b(watching|playing|listening|doing|hobby|hustle|love|obsessed with|game|match|fight|ufc|f1|soccer|basketball|gaming|anime)\b/i;

  if (imageRegex.test(text)) return { topic: text.replace(imageRegex, '').trim(), type: 'image' };
  
  // Extract specific entity if found
  if (brandRegex.test(text)) return { topic: text.match(brandRegex)![0], type: 'news' };
  if (cryptoRegex.test(text)) return { topic: text.match(cryptoRegex)![0], type: 'news' };
  
  // High-priority news triggers
  if (eventRegex.test(text)) return { topic: text.replace(eventRegex, '').trim(), type: 'news' };
  
  // Hobby/Banter triggers
  if (hobbyRegex.test(text)) {
    // Try to extract the word immediately after the hobby verb
    const words = text.split(' ');
    const idx = words.findIndex(w => hobbyRegex.test(w));
    const topic = words.slice(idx + 1, idx + 4).join(' ').trim();
    if (topic) return { topic, type: 'web' };
  }

  return null;
}


