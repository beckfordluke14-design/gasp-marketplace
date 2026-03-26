-- 1. CREATE TABLES
CREATE TABLE vault_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    persona_id TEXT NOT NULL, -- or UUID if linked to personas table
    type TEXT CHECK (type IN ('image', 'video')),
    blurred_url TEXT NOT NULL,
    full_url TEXT NOT NULL, -- Consider making this a private storage path
    price INT DEFAULT 10,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE unlocked_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    item_id UUID REFERENCES vault_items(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- 2. THE ATOMIC REVENUE SPLIT FUNCTION (RPC)
CREATE OR REPLACE FUNCTION unlock_media_item(target_item_id UUID, current_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    item_price INT;
    item_full_url TEXT;
    agency_owner_id UUID;
    v_platform_share INT;
    v_agency_share INT;
BEGIN
    -- A. Fetch Item Details & Agency Owner
    SELECT vi.price, vi.full_url, a.owner_id 
    INTO item_price, item_full_url, agency_owner_id
    FROM vault_items vi
    JOIN personas p ON vi.persona_id = p.id
    JOIN agencies a ON p.agency_id = a.id
    WHERE vi.id = target_item_id;

    -- B. Verify Balance
    IF (SELECT balance FROM profiles WHERE id = current_user_id) < item_price THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;

    -- C. Deduct Credits from User
    UPDATE profiles SET balance = balance - item_price WHERE id = current_user_id;

    -- D. Record the Unlock
    INSERT INTO unlocked_media (user_id, item_id) VALUES (current_user_id, target_item_id);

    -- E. EXECUTE 80/20 REVENUE SPLIT
    v_platform_share := FLOOR(item_price * 0.20);
    v_agency_share := item_price - v_platform_share;

    -- Add 80% to Agency Owner
    UPDATE profiles SET balance = balance + v_agency_share WHERE id = agency_owner_id;

    -- Add 20% to Master Admin (Hardcoded Platform ID or dynamic)
    UPDATE profiles SET balance = balance + v_platform_share 
    WHERE is_master_admin = TRUE; -- Distribute to all master admins or specific platform wallet

    -- F. Return the Private URL
    RETURN item_full_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

