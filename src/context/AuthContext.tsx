import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { User } from '@supabase/supabase-js';

export type UserRole = 'Arcanjo' | 'Querubim' | 'Serafim' | 'Anjinho';

export interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  church_id: string | null;
  people_id: string | null;
  group_ids: string[];
  plano: 'gratuito' | 'pagante';
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(token: string): Promise<{
  role: UserRole;
  church_id: string;
  people_id: string | null;
  group_ids: string[];
  plano: 'gratuito' | 'pagante';
} | null> {
  try {
    const res = await fetch('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [church_id, setChurchId] = useState<string | null>(null);
  const [people_id, setPeopleId] = useState<string | null>(null);
  const [group_ids, setGroupIds] = useState<string[]>([]);
  const [plano, setPlano] = useState<'gratuito' | 'pagante'>('gratuito');
  const [loading, setLoading] = useState(true);

  const applyProfile = async (token: string) => {
    const profile = await fetchProfile(token);
    if (profile) {
      setRole(profile.role);
      setChurchId(profile.church_id);
      setPeopleId(profile.people_id ?? null);
      setGroupIds(profile.group_ids ?? []);
      setPlano(profile.plano ?? 'gratuito');
    } else {
      setRole(null);
      setChurchId(null);
      setPeopleId(null);
      setGroupIds([]);
      setPlano('gratuito');
    }
  };

  const clearProfile = () => {
    setRole(null);
    setChurchId(null);
    setPeopleId(null);
    setGroupIds([]);
    setPlano('gratuito');
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.access_token) {
        await applyProfile(session.access_token);
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.access_token) {
        await applyProfile(session.access_token);
      } else {
        clearProfile();
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    clearProfile();
  };

  const ctx: AuthContextType = {
    user,
    role,
    church_id,
    people_id,
    group_ids,
    plano,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={ctx}>
      {children}
    </AuthContext.Provider>
  );
};
