'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

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

// 💎 SOVEREIGN PROVIDER: Railway Core Sync

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, logout, login } = usePrivy();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, privyUser: any) => {
    // 🛡️ SOVEREIGN BALANCE HUB: Fetching from Railway instead of Supabase
    try {
        const res = await fetch(`/api/economy/balance?userId=${userId}`);
        const data = await res.json();
        
        if (data.success) {
            setProfile({
                id: userId,
                credit_balance: data.balance,
                nickname: privyUser?.email?.address?.split('@')[0] || 'Syndicate Member'
            });
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
      fetchProfile(user.id, user);
    } else {
       setProfile(null);
    }
    setLoading(false);
  }, [ready, authenticated, user]);

  const refreshProfile = async () => {
    if (authenticated && user) await fetchProfile(user.id, user);
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



