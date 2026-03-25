-- SQL Code for Supabase Profiles Table --
-- Run this in your Supabase SQL Editor --

CREATE TABLE profiles (
  id TEXT PRIMARY KEY, -- Unique slug like 'valeria'
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  flag TEXT NOT NULL,
  vibe TEXT NOT NULL,
  likes TEXT[] DEFAULT '{}',
  image TEXT NOT NULL,
  status TEXT DEFAULT 'online',
  color TEXT DEFAULT 'from-neon-pink to-neon-purple',
  system_prompt TEXT NOT NULL,
  model_id TEXT DEFAULT 'meta-llama/llama-3-8b-instruct', -- THE LLM
  is_highlighted BOOLEAN DEFAULT false
);

-- Enable RLS (Optional, but good practice)
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

