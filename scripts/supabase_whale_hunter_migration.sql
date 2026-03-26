-- 1. WHALE-HUNTER TABLES
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    persona_id TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type TEXT CHECK (type IN ('tip', 'unlock', 'subscription')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages 
ADD COLUMN is_priority BOOLEAN DEFAULT FALSE,
ADD COLUMN tip_amount DECIMAL(10, 2) DEFAULT 0.00;

ALTER TABLE profiles
ADD COLUMN total_spent DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN status TEXT CHECK (status IN ('standard', 'whale')) DEFAULT 'standard';

-- 2. AUTO-GRATITUDE TRIGGER & LOGIC
CREATE OR REPLACE FUNCTION handle_whale_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles 
    SET total_spent = total_spent + NEW.amount,
        status = CASE 
            WHEN (total_spent + NEW.amount) > 500 THEN 'whale' 
            ELSE 'standard' 
        END
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_transaction_received
AFTER INSERT ON transactions
FOR EACH ROW EXECUTE FUNCTION handle_whale_status();

-- 3. THE AUTO-GRATITUDE SCRIPT (MOCKED VIA SUPABASE LOGGING)
-- Note: Real execution would happen via a Supabase Edge Function listening to the 'transactions' channel.
CREATE OR REPLACE FUNCTION notify_agency_of_whale()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'tip' THEN
        -- Trigger Real-time Broadcast for the "Pulse" animation
        PERFORM pg_notify('agency_pulse', json_build_object(
            'agency_id', (SELECT agency_id FROM personas WHERE id = NEW.persona_id),
            'user_id', NEW.user_id,
            'amount', NEW.amount
        )::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_whale_tip
AFTER INSERT ON transactions
FOR EACH ROW EXECUTE FUNCTION notify_agency_of_whale();

