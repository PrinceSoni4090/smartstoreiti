import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import supabase from '../lib/supabase';
import type { Staff, Role } from '../lib/types';

interface AuthContextValue {
  user: { id: string; email: string } | null;
  staff: Staff | null;
  role: Role | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, staff: null, role: null, loading: true,
  signIn: async () => {}, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStaff = async (email: string) => {
    try {
      const res = await fetch(`/api/staff?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setStaff(data || null);
    } catch (e) {
      console.error(e);
      setStaff(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
        await loadStaff(session.user.email!);
      }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
        await loadStaff(session.user.email!);
      } else {
        setUser(null); setStaff(null);
      }
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };
  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <AuthContext.Provider value={{ user, staff, role: staff?.role || null, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
