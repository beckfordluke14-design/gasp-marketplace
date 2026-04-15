'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

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

        // 🧬 TIERED GENESIS PROTOCOL: Only trigger for brand new identities
        if (isNewUser && !data.is_admin && !data.is_initialized) {
          const isActuallyGuest = userId.startsWith('guest-');
          const claimAction = isActuallyGuest ? 'guest_genesis' : 'starter_claim';
          const bonusAmount = isActuallyGuest ? 250 : 1000;

          fetch('/api/economy/balance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, action: claimAction })
          }).then(r => r.json()).then(async claimData => {
              if (claimData.success) {
                console.log(`🏦 [Genesis] ${bonusAmount} CR Bonus Provisioned.`);
                
                // ⚡️ TRIGGER VISUAL FLASH
                setBountyAlert({ amount: bonusAmount, active: true });
                setTimeout(() => setBountyAlert(prev => ({ ...prev, active: false })), 5000);

                // 🏦 INSTANT TRUST: Set balance directly from the claim result
                const newBalance = claimData.balance || bonusAmount;
                setProfile((prev: any) => prev ? { ...prev, credit_balance: newBalance } : prev);
              }
          }).catch(() => {});
        }
    } catch (e) {
        console.error('[UserProvider] Balance Sync Failed:', e);
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

    let guestId = typeof window !== 'undefined' ? localStorage.getItem('gasp_guest_id') : null;
    
    // 🧬 INITIALIZE GUEST IDENTITY: Ensure brand new landers have an ID for the bonus signal
    if (!guestId && !user?.id) {
       guestId = `guest-${Math.random().toString(36).substring(2, 11)}`;
       localStorage.setItem('gasp_guest_id', guestId);
       console.log('🛰️ [Identity] New Guest Node Assigned:', guestId);
    }

    const activeUserId = user?.id || guestId;

    if (activeUserId) {
       // Identity Handshake
       fetchProfile(activeUserId, user, true);

       // 🛰️ HIGH-VELOCITY BALANCE SYNC: Instant Revenue Capture
       const interval = setInterval(() => {
          fetchProfile(activeUserId, user);
       }, 10000); // 10s Polling during launch window
       
       return () => clearInterval(interval);
    } else {
       setProfile(null);
       setLoading(false);
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
      
      {/* 🚀 REAL-TIME BOUNTY NOTIFICATION: CINEMATIC PULSE */}
      <AnimatePresence>
        {bountyAlert.active && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, filter: 'blur(20px)' }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
          >
              <div className="relative">
                  {/* 🧬 NEURAL RADIANCE: Outer Glow Pulse */}
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-[#ffea00] blur-3xl opacity-30 rounded-full"
                  />
                  
                  <div className="bg-black/95 border-2 border-[#ffea00] px-8 py-5 rounded-[2rem] shadow-[0_0_80px_rgba(255,234,0,0.3)] flex items-center gap-6 relative z-10 overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#ffea00]/10 to-transparent pointer-events-none" />
                      
                      <div className="w-14 h-14 rounded-full bg-[#ffea00] flex items-center justify-center text-black shadow-[0_0_20px_#ffea00]">
                          <Zap size={28} fill="currentColor" />
                      </div>
                      
                      <div className="flex flex-col">
                          <span className="text-[10px] font-black text-[#ffea00] tracking-[0.5em] uppercase italic leading-none mb-1">
                             {profile?.id?.startsWith('guest-') ? 'GIFT RECEIVED' : 'WELCOME BONUS'}
                          </span>
                          <div className="flex items-center gap-3">
                             <span className="text-3xl font-syncopate font-black text-white italic tracking-tighter leading-none">
                                +{bountyAlert.amount.toLocaleString()} 
                             </span>
                             <div className="px-2 py-1 bg-white/10 rounded flex items-center gap-1 border border-white/10">
                                <span className="text-[11px] font-black text-[#ffea00] uppercase tracking-widest">CREDITS</span>
                             </div>
                          </div>
                      </div>
                  </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
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
