import { createClient } from '@supabase/supabase-js';

// 🛡️ SOVEREIGN NEURAL BRIDGE: The Safe Supabase Interface
// Prevents app crashes when environment variables are missing during build/deploy cycles.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vvcwjlcequbkhlpmwzlc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2Y3dqbGNlcXVia2hscG13emxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTIyMTcsImV4cCI6MjA4OTUyODIxN30.L8-fSsynEwZCCzkDu9TIxvm3KG7blehsBjVaORDIS2s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
