-- 007_syndicate_hybrid_native_engine.sql
-- Separates Native Audio Script from Contextual Text Message

ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS audio_script TEXT,
ADD COLUMN IF NOT EXISTS audio_translation TEXT,
ADD COLUMN IF NOT EXISTS translation_locked BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN chat_messages.content IS 'Contextual Text Message (Stream B - English/Spanglish)';
COMMENT ON COLUMN chat_messages.audio_script IS '100% Native Audio Script (Stream A - Forbidden to be English)';
COMMENT ON COLUMN chat_messages.audio_translation IS 'The locked English translation for monetization (Breathe Points)';

