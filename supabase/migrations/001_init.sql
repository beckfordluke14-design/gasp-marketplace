-- STEP 1: Supabase Database Schema
-- Digital Companion Agency (Gasp.fun) Core

-- 1. Users table (balance)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY, -- Linked to auth.users but simpler as public representation
  breathe_balance INTEGER DEFAULT 0
);

-- 2. AI Personas
CREATE TABLE IF NOT EXISTS public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_dna TEXT NOT NULL,
  current_global_mood TEXT NOT NULL DEFAULT 'bored'
);

-- 3. Tracking relationships and mood overrides
CREATE TABLE IF NOT EXISTS public.user_relationships (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  affinity_score INTEGER DEFAULT 0,
  last_spend_at TIMESTAMP WITH TIME ZONE,
  custom_mood_override TEXT,
  PRIMARY KEY (user_id, persona_id)
);

-- 4. Media storage (the locked content)
CREATE TABLE IF NOT EXISTS public.media_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  price_points INTEGER NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('retail', 'whale', 'photo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tracking unlocked content
CREATE TABLE IF NOT EXISTS public.unlocked_media (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  media_id UUID REFERENCES public.media_vault(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, media_id)
);

-- RPC function for atomic unlock transaction
-- p_user_id (uuid), p_media_id (uuid), p_cost (int)
CREATE OR REPLACE FUNCTION public.unlock_media(
  p_user_id UUID,
  p_media_id UUID,
  p_cost INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INTEGER;
  target_persona_id UUID;
BEGIN
  -- 1. Check current balance
  SELECT breathe_balance INTO current_balance 
  FROM public.users 
  WHERE id = p_user_id 
  FOR UPDATE; -- Lock the row

  IF current_balance IS NULL OR current_balance < p_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient Breathe Points');
  END IF;

  -- 2. Deduct points
  UPDATE public.users 
  SET breathe_balance = breathe_balance - p_cost
  WHERE id = p_user_id;

  -- 3. Mark as unlocked
  INSERT INTO public.unlocked_media (user_id, media_id)
  VALUES (p_user_id, p_media_id)
  ON CONFLICT DO NOTHING; -- Already unlocked?

  -- 4. Update relationship
  SELECT persona_id INTO target_persona_id FROM public.media_vault WHERE id = p_media_id;
  
  INSERT INTO public.user_relationships (user_id, persona_id, affinity_score, last_spend_at)
  VALUES (p_user_id, target_persona_id, (p_cost / 100), NOW())
  ON CONFLICT (user_id, persona_id) DO UPDATE
  SET last_spend_at = EXCLUDED.last_spend_at,
      affinity_score = public.user_relationships.affinity_score + EXCLUDED.affinity_score;

  RETURN jsonb_build_object('success', true);
END;
$$;

