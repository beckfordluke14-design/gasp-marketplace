-- 013_syndicate_read_receipts.sql
-- Force the Squeeze with unread message tracking

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Ensure assistant messages start as unread
UPDATE chat_messages SET is_read = TRUE WHERE role = 'user';

