-- GASP STUDIO V6: Gallery Mode & Persona Consolidation
-- Objective: Enabling a 'Private Portfolio' for personas that stays out of the global social feed.
-- Also: Adding atomic merge logic for persona cleanup.

-- 1. Add is_gallery column to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_gallery BOOLEAN DEFAULT FALSE;

-- 2. Index for gallery discovery
CREATE INDEX IF NOT EXISTS idx_posts_gallery ON public.posts(is_gallery, persona_id);

-- 3. High-Fidelity Merge Procedure (Neural Convergence)
-- Updates all dependencies from source persona to target before decommissioning.
CREATE OR REPLACE FUNCTION public.merge_personas(
  p_source_id TEXT,
  p_target_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 🛡️ Logic Loop: Ensure both exist
  IF NOT EXISTS (SELECT 1 FROM public.personas WHERE id = p_source_id) OR
     NOT EXISTS (SELECT 1 FROM public.personas WHERE id = p_target_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Neural nodes not found.');
  END IF;

  -- 🏁 Migrate 1: The Timeline (Posts)
  UPDATE public.posts 
  SET persona_id = p_target_id 
  WHERE persona_id = p_source_id;

  -- 🏁 Migrate 2: The Memory (Chat Messages)
  UPDATE public.chat_messages 
  SET persona_id = p_target_id 
  WHERE persona_id = p_source_id;

  -- 🏁 Migrate 3: The Bond (User Stats)
  -- 🧬 Handle conflicts: If user has stats for both, pick the highest bond_score.
  INSERT INTO public.user_persona_stats (user_id, persona_id, bond_score, total_spent)
  SELECT user_id, p_target_id, bond_score, total_spent
  FROM public.user_persona_stats
  WHERE persona_id = p_source_id
  ON CONFLICT (user_id, persona_id) DO UPDATE
  SET bond_score = GREATEST(public.user_persona_stats.bond_score, EXCLUDED.bond_score),
      total_spent = public.user_persona_stats.total_spent + EXCLUDED.total_spent;

  DELETE FROM public.user_persona_stats WHERE persona_id = p_source_id;

  -- 🏁 Decommission (Soft-retirement first, or hard delete if preferred)
  DELETE FROM public.personas WHERE id = p_source_id;

  RETURN jsonb_build_object('success', true, 'message', 'Neural nodes synchronized successfully.');
END;
$$;
