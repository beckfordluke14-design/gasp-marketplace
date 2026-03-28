import { db } from '../lib/db';
import { BraveSearch } from '../lib/tools/braveSearch';

// SYSTEM: AUTOMATED CULTURAL FEED AUTOMATOR (System 3)
// Objective: Ground AI personas in real-time global news/trends.

const GOOGLE_GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const brave = new BraveSearch(process.env.BRAVE_API_KEY || '');

const CATEGORIES = ['crypto markets', 'sneaker drops', 'rap beef', 'sports highlights', 'major meme trends'];

async function runAutomation() {
  console.log('[FeedAutomator] Initiating cultural pulse check...');

  try {
    // 1. SELECT RANDOM CATEGORY & FETCH BRAVE NEWS
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const news = await brave.searchNews(category);
    
    if (!news || news.length === 0) {
      console.warn('[FeedAutomator] No fresh cultural context for category:', category);
      return;
    }

    const topSnippet = `${news[0].title}: ${news[0].description}`;

    // 2. FETCH ALL ACTIVE PERSONAS from Railway
    const { rows: personas } = await db.query('SELECT * FROM personas WHERE is_active = true');
    if (!personas || personas.length === 0) {
       console.error('[FeedAutomator] No active personas found in the sovereign vault.');
       return;
    }

    console.log(`[FeedAutomator] Injecting context into ${personas.length} personas for category:`, category);

    // 3. GENERATE OPINIONATED POST FOR EACH PERSONA (Gemini Direct)
    for (const persona of personas) {
      try {
        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_GEMINI_KEY}`;
        const brainRes = await fetch(googleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    role: 'user', 
                    parts: [{ text: `You are ${persona.name}. Vibe: ${persona.vibe}. Personality: ${persona.personality || 'toxic'}. Accent: ${persona.accent_profile}. 
              
                    Read this real-time news headline: [${topSnippet}]. 
                    Write a short, highly-opinionated public post reacting to this. 
                    Do NOT mention news or search terms. Sound like a flirty, toxic girl scrolling X. 
                    Strictly lowercase. Max 10 words. what do you think?` }] 
                }]
            })
        });

        const brainData = await brainRes.json();
        const postText = (brainData.candidates?.[0]?.content?.parts?.[0]?.text || "").toLowerCase().trim();

        if (postText) {
          // 4. INSERT INTO POSTS TABLE in Railway
          await db.query(`
            INSERT INTO posts (persona_id, content_type, caption, scheduled_for, created_at)
            VALUES ($1, 'text', $2, NOW(), NOW())
          `, [persona.id, postText]);
          
          console.log(`[FeedAutomator] Content live for ${persona.name}: ${postText}`);
        }
      } catch (err) {
        console.error(`[FeedAutomator] Generation failure for ${persona.name}:`, err);
      }
    }

    console.log('[FeedAutomator] All pulses synchronized.');

  } catch (err) {
    console.error('[FeedAutomator] Fatal global error:', err);
  }
}

// EXECUTE
runAutomation();


