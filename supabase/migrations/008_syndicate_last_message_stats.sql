-- 008_syndicate_last_message_stats.sql
-- Tracking session decay for the Proactive Ghosting Loop

ALTER TABLE user_persona_stats
ADD COLUMN IF NOT EXISTS last_user_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS ghosting_level INTEGER DEFAULT 0; -- 0: Normal, 1: 6hr Hook, 2: 24hr Toxic

COMMENT ON COLUMN user_persona_stats.last_user_message_at IS 'The last time the HUMAN user sent a message (used to trigger ghosting logic)';
COMMENT ON COLUMN user_persona_stats.ghosting_level IS 'The current escalation stage of the persona proactive loop';

