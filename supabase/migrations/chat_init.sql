-- 1. Chat Messages (Session Context)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- guest token
    persona_id TEXT REFERENCES personas(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    image_url TEXT,
    type TEXT DEFAULT 'text',
    price INTEGER DEFAULT 0,
    memory_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Wallets (Virtual Currency)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    balance INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Persona Stats (Relationship Bonding)
CREATE TABLE IF NOT EXISTS user_persona_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    persona_id TEXT REFERENCES personas(id),
    bond_score INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, persona_id)
);

-- 4. User Unlockables (Vault Mapping)
CREATE TABLE IF NOT EXISTS user_vault_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    post_id UUID REFERENCES posts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 5. RPC Functions (Atomic State Changes)
CREATE OR REPLACE FUNCTION process_spend(p_user_id TEXT, p_amount INTEGER, p_type TEXT, p_persona_id TEXT)
RETURNS JSONB AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    SELECT balance INTO current_balance FROM wallets WHERE user_id = p_user_id;
    IF current_balance IS NULL THEN
       INSERT INTO wallets(user_id, balance) VALUES(p_user_id, 1000) RETURNING balance INTO current_balance;
    END IF;
    
    IF current_balance < p_amount THEN
       RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance');
    END IF;

    UPDATE wallets SET balance = balance - p_amount WHERE user_id = p_user_id;
    UPDATE user_persona_stats SET bond_score = bond_score + (p_amount / 10), total_spent = total_spent + p_amount 
    WHERE user_id = p_user_id AND persona_id = p_persona_id;
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

