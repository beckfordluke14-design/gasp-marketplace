CREATE TABLE IF NOT EXISTS public.consent_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ip_address TEXT,
    user_agent TEXT,
    agreed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    site_version TEXT
);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- Allow only service_role to insert (bypassing RLS inherently)
-- No public insert policies exist, meaning anonymous users cannot write to it directly.

