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
        
        const balance = data.balance || 0;
        const isNewUser = !data.success || data.is_guest || balance === 0;

        // Always set profile — even for brand new users with no DB row yet
        setProfile({
            id: userId,
            credit_balance: balance,
            is_admin: data.is_admin || false,
            nickname: data.nickname || privyUser?.google?.name?.split(' ')[0] || privyUser?.email?.address?.split('@')[0] || 'Syndicate Member'
        });

        // 🧬 GENESIS HANDSHAKE: One-time 1,500 CR signup bonus for brand-new users only
        if (isNewUser && !data.is_admin) {
          fetch('/api/economy/balance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, action: 'starter_claim' })
          }).then(r => r.json()).then(async claimData => {
              if (claimData.success) {
                console.log('🏦 [Genesis] 1,500 CR Bonus Provisioned.');
                const fresh = await fetch(`/api/economy/balance?userId=${userId}`).then(r => r.json());
                if (fresh.success) {
                  setProfile((prev: any) => prev ? { ...prev, credit_balance: fresh.balance } : prev);
                }
              }
          }).catch(() => {});
        }
    } catch (e) {
        console.error('[UserProvider] Balance Sync Failed:', e);
        // Still set a minimal profile so the user is not stuck on a loading screen
        setProfile({ id: userId, credit_balance: 0, is_admin: false, nickname: 'Syndicate Member' });
    }

    // 🛰️ SOVEREIGN BACKGROUND RECONCILIATION — fully isolated, never blocks auth
    try {
        const p2pRes = await fetch(`/api/economy/solana/session?userId=${userId}`);
        const p2pData = await p2pRes.json();
        if (p2pData.success && p2pData.session) {
           const ref = p2pData.session.reference;
           const amount = p2pData.session.amount_usd || 19.99;
           fetch(`/api/economy/solana/verify/reference?reference=${ref}&userId=${userId}&expectedAmount=${amount}`)
             .then(r => r.json())
             .then(v => {
                if (v.success) {
                   console.log('[Sovereign Sync]: Background payment confirmed.');
                   window.dispatchEvent(new CustomEvent('gasp_balance_refresh'));
                }
             }).catch(() => {});
        }
    } catch (_) { /* P2P reconciliation is non-blocking — ignore all failures */ }

    setLoading(false);
  };

  useEffect(() => {
    if (!ready) return;

    const guestId = typeof window !== 'undefined' ? localStorage.getItem('gasp_guest_id') : null;
    const activeUserId = user?.id || guestId;

    if (activeUserId) {
       // Identity Handshake
       fetchProfile(activeUserId, user);

       // 🛰️ HIGH-VELOCITY BALANCE SYNC: Instant Revenue Capture
       const interval = setInterval(() => {
          fetchProfile(activeUserId, user);
       }, 10000); // 10s Polling during launch window
       
       return () => clearInterval(interval);
    } else {
       if (!guestId) {
          setProfile(null);
          setLoading(false);
       }
    }
  }, [ready, authenticated, user?.id]);

  useEffect(() => {
    const guestId = typeof window !== 'undefined' ? localStorage.getItem('gasp_guest_id') : null;
    const activeUserId = user?.id || guestId;

    if (!activeUserId) return;
    
    // 🛰️ EVENT-DRIVEN SYNC: Refresh balance on manual triggers
    const handleRefresh = async () => {
       fetchProfile(activeUserId, user);
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

  const [prevBalance, setPrevBalance] = useState<number | null>(null);
  const [bountyAlert, setBountyAlert] = useState<{ amount: number; active: boolean }>({ amount: 0, active: false });

  useEffect(() => {
    if (profile?.credit_balance !== undefined) {
      if (prevBalance !== null && profile.credit_balance > prevBalance) {
        const diff = profile.credit_balance - prevBalance;
        if (diff > 0) {
            setBountyAlert({ amount: diff, active: true });
            setTimeout(() => setBountyAlert(prev => ({ ...prev, active: false })), 5000);
        }
      }
      setPrevBalance(profile.credit_balance);
    }
  }, [profile?.credit_balance]);

  return (
    <UserContext.Provider value={{ user, session: null, profile, loading, refreshProfile, signOut, ready, authenticated, login }}>
      {children}
      
      {/* 🚀 REAL-TIME BOUNTY NOTIFICATION */}
      {bountyAlert.active && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] animate-bounce pointer-events-none">
            <div className="bg-black/90 border-2 border-[#00fff2] px-6 py-3 rounded-2xl shadow-[0_0_50px_rgba(0,255,242,0.4)] flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#00fff2] flex items-center justify-center text-black">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M13 10V3L4 14H11V21L20 10H13Z"/></svg>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[#00fff2] tracking-[0.3em] uppercase italic">Bounty Infused</span>
                    <span className="text-xl font-black text-white italic tracking-tighter">+{bountyAlert.amount.toLocaleString()} $GASP</span>
                </div>
            </div>
        </div>
      )}
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
