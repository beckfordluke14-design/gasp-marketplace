-- 🧬 AIRDROP ARCHIVE v1.8
-- Objective: Permanently lock Sender Wallets for the $GASPAI Launch.

-- 1. Create the Audit Ledger (The Source of Truth)
CREATE TABLE IF NOT EXISTS public.audit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  amount_usd NUMERIC(20,2) DEFAULT 0,
  credits_added INTEGER DEFAULT 0,
  network TEXT NOT NULL,
  external_id TEXT UNIQUE, -- The Tx Hash (Prevents Double-Spend)
  sender_wallet TEXT, -- THE AIRDROP ADDRESS 🛡️
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update Profiles to track Total Airdrop Weight
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_spent_usd NUMERIC(20,2) DEFAULT 0;

-- 3. Enable RLS on Ledger (Admin Only)
ALTER TABLE public.audit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all ledger entries" 
ON public.audit_ledger FOR SELECT 
USING (auth.jwt() ->> 'role' = 'admin');

COMMENT ON TABLE public.audit_ledger IS 'Permanent ledger of all sovereign settlements for Airdrop calculation.';
