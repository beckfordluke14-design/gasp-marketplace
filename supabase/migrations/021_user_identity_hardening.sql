-- 🧬 SYNDICATE IDENTITY MIGRATION: THE TITAN ALIAS
-- Enables users to claim unique handles and build persistent status.

-- 1. Add username column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Add display_name (optional for non-at-handle styling)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 3. Validation: Usernames must be 3-20 chars, alphanumeric/underscore
ALTER TABLE public.users 
ADD CONSTRAINT username_length_check CHECK (char_length(username) >= 3 AND char_length(username) <= 24);

-- 4. Sync Auth Metadata (Helper)
-- This ensures when a user signs up via Google, their name can be sanitized into a handle
CREATE OR REPLACE FUNCTION public.handle_new_user_with_username() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, credit_balance, username)
  VALUES (
    NEW.id, 
    50, -- Initial Bonus hook
    LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9]', '_', 'g'))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
