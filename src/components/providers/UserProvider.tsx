'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

interface UserContextType {
  user: any | null; // Privy User
  session: any | null;
  profile: {
    id: string;
    nickname?: string;
    is_admin?: boolean;
    is_known?: boolean;
    last_active_at?: string;
    credit_balance?: number;
    total_spent_usd?: number;
  } | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  ready: boolean;
  authenticated: boolean;
  login: (options?: any) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * 💎 SOVEREIGN PROVIDER: Railway Core Sync
 * High-Velocity terminal for real-time credit & points tracking.
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, logout, login } = usePrivy();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, privyUser: any) => {
    try {
        const res = await fetch(`/api/economy/balance?userId=${userId}`);
        const data = await res.json();
        
        if (data.success) {
            setProfile({
                id: userId,
                credit_balance: data.balance,
                is_admin: data.is_admin,
                total_spent_usd: data.total_spent_usd,
                nickname: data.nickname || privyUser?.email?.address?.split('@')[0] || 'Syndicate Member'
            });

            // 🧬 GENESIS HANDSHAKE: One-time 1,500 CR signup bonus for brand-new users only
            // Guard: only fires if balance is exactly 0 (new account) — never for existing users
            if (data.balance === 0 && !data.is_admin) {
              fetch('/api/economy/balance', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId, action: 'starter_claim' })
              }).then(r => r.json()).then(async claimData => {
                  if (claimData.success) {
                    console.log('🏦 [Genesis] 1,500 CR Bonus Provisioned.');
                    // Fetch fresh balance directly — no recursive call
                    const fresh = await fetch(`/api/economy/balance?userId=${userId}`).then(r => r.json());
                    if (fresh.success) {
                      setProfile((prev: any) => prev ? { ...prev, credit_balance: fresh.balance } : prev);
                    }
                  }
              }).catch(() => {});
            }
        }

        // 🛰️ SOVEREIGN BACKGROUND RECONCILIATION
        // Silence-check for any pending P2P or Stripe sessions
        const p2pRes = await fetch(`/api/economy/solana/session?userId=${userId}`);
        const p2pData = await p2pRes.json();
        if (p2pData.success && p2pData.session) {
           const ref = p2pData.session.reference;
           const amount = p2pData.session.amount_usd || 19.99;
           // Trigger a verification ping without blocking
           fetch(`/api/economy/solana/verify/reference?reference=${ref}&userId=${userId}&expectedAmount=${amount}`)
             .then(r => r.json())
             .then(v => {
                if (v.success) {
                   console.log('[Sovereign Sync]: Background payment confirmed.');
                   window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
                }
             }).catch(() => {});
        }
    } catch (e) {
        console.error('[UserProvider] Sovereign Sync Failed:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!ready) return;

    if (authenticated && user) {
       // Identity Handshake
       fetchProfile(user.id, user);

       // 🛰️ HIGH-VELOCITY BALANCE SYNC: Instant Revenue Capture
       const interval = setInterval(() => {
          fetchProfile(user.id, user);
       }, 10000); // 10s Polling during launch window
       
       return () => clearInterval(interval);
    } else {
       setProfile(null);
       setLoading(false);
    }
  }, [ready, authenticated, user?.id]);

  useEffect(() => {
    if (!authenticated || !user?.id) return;
    
    // 🛰️ EVENT-DRIVEN SYNC: Refresh balance on manual triggers
    const handleRefresh = async () => {
       fetchProfile(user.id, user);
    };
    
    window.addEventListener('gasp_balance_refresh', handleRefresh);
    window.addEventListener('gasp_sync_follows', handleRefresh);
    
    return () => {
       window.removeEventListener('gasp_balance_refresh', handleRefresh);
       window.removeEventListener('gasp_sync_follows', handleRefresh);
    };
  }, [authenticated, user?.id]);

  const refreshProfile = async () => {
    if (authenticated && user?.id) await fetchProfile(user.id, user);
  };

  const signOut = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <UserContext.Provider value={{ user, session: null, profile, loading, refreshProfile, signOut, ready, authenticated, login }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
