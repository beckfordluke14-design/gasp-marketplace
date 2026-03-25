import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { BraveSearch } from '../lib/tools/braveSearch';

// SYSTEM: AUTOMATED CULTURAL FEED AUTOMATOR (System 3)
// Objective: Ground AI personas in real-time global news/trends.

const GOOGLE_GEMINI_KEY = process.env.GOOGLE_GEMINI_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const brave = new BraveSearch('BSA2-DiqlsfcBvtr-S2oxY8DtQeWo5y');

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

    // 2. FETCH ALL ACTIVE PERSONAS
    const { data: personas, error: pError } = await supabase.from('personas').select('*').eq('is_active', true);
    if (pError || !personas) {
       console.error('[FeedAutomator] Failed to fetch active personas:', pError);
       return;
    }

    console.log(`[FeedAutomator] Injecting context into ${personas.length} personas for category:`, category);

    // 3. GENERATE OPINIONATED POST FOR EACH PERSONA (Gemini Direct)
    for (const persona of personas) {
      try {
        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GOOGLE_GEMINI_KEY}`;
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

        // 4. INSERT INTO POSTS TABLE
        const { error: postError } = await supabase.from('posts').insert([{
           persona_id: persona.id,
           content_type: 'text',
           caption: postText,
           scheduled_for: new Date()
        }]);

        if (postError) console.error(`[FeedAutomator] Failed to post for ${persona.name}:`, postError);
        else console.log(`[FeedAutomator] Content live for ${persona.name}: ${postText}`);

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


