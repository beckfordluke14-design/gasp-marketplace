-- 🧬 SYNDICATE ECONOMY NORMALIZATION v1.7
-- Objective: Universal migration from 'Breathe Points' to 'Credits'.
-- Targets: 'breathe_balance' (users), 'price_points' (media_vault), and 'unlock_media' RPC.

-- 1. Rename columns in the users table
ALTER TABLE public.users 
RENAME COLUMN breathe_balance TO credit_balance;

-- 2. Rename columns in the profiles table (Auth sync)
ALTER TABLE public.profiles 
RENAME COLUMN breathe_points TO credit_balance;

-- 3. Rename columns in the wallets table (Transaction sync)
ALTER TABLE public.wallets 
RENAME COLUMN balance TO credit_balance;

-- 4. Rename columns in the media_vault table
ALTER TABLE public.media_vault 
RENAME COLUMN price_points TO price_credits;

-- 3. Update the 'unlock_media' RPC function to use the new nomenclature
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
  SELECT credit_balance INTO current_balance 
  FROM public.users 
  WHERE id = p_user_id 
  FOR UPDATE; 

  IF current_balance IS NULL OR current_balance < p_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient Credits');
  END IF;

  -- 2. Deduct credits
  UPDATE public.users 
  SET credit_balance = credit_balance - p_cost
  WHERE id = p_user_id;

  -- 3. Mark as unlocked
  INSERT INTO public.unlocked_media (user_id, media_id)
  VALUES (p_user_id, p_media_id)
  ON CONFLICT DO NOTHING; 

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
