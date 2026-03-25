-- Broadcasts & Comments Table --
CREATE TABLE IF NOT EXISTS broadcasts (
  id TEXT PRIMARY KEY,
  profile_id TEXT REFERENCES profiles(id),
  content TEXT NOT NULL,
  image_url TEXT, -- Optional lifestyle shot
  post_type TEXT DEFAULT 'broadcast', -- broadcast, moment, life_update
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT, -- ID from broadcasts or moments
  profile_id TEXT REFERENCES profiles(id), -- The AI commenter
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

