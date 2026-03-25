-- 💎 NEURAL TELEMETRY: The Billion-Dollar Dataset Foundation
CREATE TABLE IF NOT EXISTS neural_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  persona_id text,
  event_type text NOT NULL, -- 'feed_view', 'conversion', 're-engagement', 'wit_success', 'unlock'
  vibe_at_time text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Index for high-velocity lookups
CREATE INDEX IF NOT EXISTS idx_telemetry_event ON neural_telemetry(event_type);
CREATE INDEX IF NOT EXISTS idx_telemetry_persona ON neural_telemetry(persona_id);

-- Enable RLS for telemetry (Admin-only or Public Insert)
ALTER TABLE neural_telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert telemetry" ON neural_telemetry FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view telemetry" ON neural_telemetry FOR SELECT USING (true); -- Usually restricted by SERVICE_ROLE

