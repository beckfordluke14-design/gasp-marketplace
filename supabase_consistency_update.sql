-- Update Profiles Table to support Visual Consistency --
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS visual_description TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hair_style TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS body_type TEXT;

-- Example: "Afro-Dominican, long curly dark hair, almond eyes, athletic/curvy build, skin tone: caramel."

