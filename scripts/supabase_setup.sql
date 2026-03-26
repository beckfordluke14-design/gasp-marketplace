-- SQL Code for Supabase Table Setup --
-- Run this in your Supabase SQL Editor --

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  conversation_id TEXT NOT NULL -- Can be the user's ID or a unique session ID
);

-- Index for faster queries
CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);

