-- 🕴️ ADMIN IDENTITY HUB v1.0
-- Objective: Grant Administrative Power for Manual Economy Management.

-- 1. Add Admin Privilege Pillar to Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Audit Trail Enrichment: Add memo field for manual adjustments
ALTER TABLE public.audit_ledger
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'SETTLED',
ADD COLUMN IF NOT EXISTS memo TEXT;

-- 3. Security: Ensure only the Service Role or Admins can toggle this
COMMENT ON COLUMN public.profiles.is_admin IS 'Master Administrative Flag. Restricted access.';
