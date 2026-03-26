-- 1. Upgrade Profiles for Persona Memory
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS is_known BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Guest-to-User Migration Function
-- This handles chats, wallets, and unlocks when a guest finally signs up.
CREATE OR REPLACE FUNCTION migrate_guest_data(p_guest_id TEXT, p_user_id TEXT)
RETURNS JSONB AS $$
DECLARE
    guest_balance INTEGER;
    user_balance INTEGER;
BEGIN
    -- 1. Migrate Chat Messages
    UPDATE chat_messages 
    SET user_id = p_user_id 
    WHERE user_id = p_guest_id;

    -- 2. Consolidate Wallets
    SELECT balance INTO guest_balance FROM wallets WHERE user_id = p_guest_id;
    
    IF guest_balance IS NOT NULL THEN
        SELECT balance INTO user_balance FROM wallets WHERE user_id = p_user_id;
        
        IF user_balance IS NULL THEN
            -- Check if user exists (Supabase might have created it)
            INSERT INTO wallets (user_id, balance) 
            VALUES (p_user_id, guest_balance)
            ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + guest_balance;
        ELSE
            UPDATE wallets SET balance = balance + guest_balance WHERE user_id = p_user_id;
        END IF;
        
        -- Zero out guest wallet (or delete?)
        DELETE FROM wallets WHERE user_id = p_guest_id;
    END IF;

    -- 3. Migrate Persona Stats
    -- Need to handle conflicts (user might have interacted with same persona before)
    INSERT INTO user_persona_stats (user_id, persona_id, bond_score, total_spent)
    SELECT p_user_id, persona_id, bond_score, total_spent
    FROM user_persona_stats
    WHERE user_id = p_guest_id
    ON CONFLICT (user_id, persona_id) DO UPDATE 
    SET bond_score = user_persona_stats.bond_score + EXCLUDED.bond_score,
        total_spent = user_persona_stats.total_spent + EXCLUDED.total_spent;
    
    DELETE FROM user_persona_stats WHERE user_id = p_guest_id;

    -- 4. Migrate Vault Unlocks
    INSERT INTO user_vault_unlocks (user_id, post_id)
    SELECT p_user_id, post_id
    FROM user_vault_unlocks
    WHERE user_id = p_guest_id
    ON CONFLICT (user_id, post_id) DO NOTHING;
    
    DELETE FROM user_vault_unlocks WHERE user_id = p_guest_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
