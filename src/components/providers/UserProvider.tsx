'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Session } from '@supabase/supabase-js';

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

// Lazy singleton — only created client-side, never during SSR
let _supabaseClient: ReturnType<typeof createBrowserClient> | null = null;
function getSupabase() {
  if (!_supabaseClient) {
    _supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
    );
  }
  return _supabaseClient;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, logout, login } = usePrivy();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, privyUser: any) => {
    // 🛡️ NO-AUTH LIMIT: We query the public profiles table directly 
    // Secure via RLS (uuid-deterministic mapping)
    const { data: existing, error: fetchErr } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    // 🧬 Extract Email Identity (Google, Social, or Direct)
    const email = privyUser?.email?.address || privyUser?.google?.email || privyUser?.twitter?.username;

    if (fetchErr) {
       // Auto-Genesis: Initial Node Registration
       console.log('[UserProvider] New node detected. Registering identity...');
       const { data: newProfile } = await getSupabase()
          .from('profiles')
          .insert({ 
            id: userId, 
            credit_balance: 2000, // 🎁 GENESIS BONUS
            role: 'user', 
            email: email, 
            last_active_at: new Date().toISOString() 
          })
          .select()
          .single();
       if (newProfile) setProfile(newProfile);
       return;
    }

    // 🧬 Update Pulse: Sync any changed email handle
    if (email && existing.email !== email) {
       await getSupabase().from('profiles').update({ email }).eq('id', userId);
    }
    
    setProfile({ ...existing, email: email || existing.email });
  };

  useEffect(() => {
    if (!ready) return;

    if (authenticated && user) {
       // Identity Handshake
       fetchProfile(user.id, user);
       
       // Sync Guest Data
       const guestId = localStorage.getItem('gasp_guest_id');
       if (guestId && guestId !== user.id) {
          getSupabase().rpc('migrate_guest_data', { p_guest_id: guestId, p_user_id: user.id });
          localStorage.removeItem('gasp_guest_id');
       }
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



