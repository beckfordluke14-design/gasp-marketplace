import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('voice_cache').select('*').limit(1);
  if (error) {
    console.error('❌ voice_cache table check failed:', error.message);
  } else {
    console.log('✅ voice_cache table exists.');
  }
}

check();

