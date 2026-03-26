'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Session, User } from '@supabase/supabase-js';

interface UserContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.warn('[UserContext] Profile fetch err:', error.message);
      return;
    }
    setProfile(data);
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: initialSession } } = await getSupabase().auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user || null);
      if (initialSession?.user) {
        await fetchProfile(initialSession.user.id);
      }
      setLoading(false);
    };

    getSession();

    // ACTIVITY PING: THE PULSE
    let pingInterval: any;
    if (user) {
      pingInterval = setInterval(async () => {
        await getSupabase()
          .from('profiles')
          .update({ last_active_at: new Date().toISOString(), ghost_email_sent: false })
          .eq('id', user.id);
      }, 1000 * 60 * 5); // 5 mins
    }

    const { data: { subscription } } = getSupabase().auth.onAuthStateChange(async (_event: string, newSession: any) => {
      setSession(newSession);
      setUser(newSession?.user || null);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const signOut = async () => {
    await getSupabase().auth.signOut();
    window.location.href = '/login';
  };

  return (
    <UserContext.Provider value={{ user, session, profile, loading, refreshProfile, signOut }}>
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



