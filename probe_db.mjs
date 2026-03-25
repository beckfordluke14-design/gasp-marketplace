import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function probe() {
  const { data, error } = await supabase.from('chat_messages').select('*').limit(1);
  if (error) console.error('Error fetching chat_messages:', error);
  else console.log('Successfully connected to chat_messages');
  
  const { data: pData, error: pError } = await supabase.from('personas').select('*').limit(1);
  if (pError) console.error('Error fetching personas:', pError);
  else console.log('Successfully connected to personas');
}

probe();

