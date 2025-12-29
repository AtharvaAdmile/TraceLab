import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthChange, logOut, type User } from '../lib/firebase';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Sync with Supabase in background (non-blocking)
        syncUserWithSupabase(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const syncUserWithSupabase = async (firebaseUser: User) => {
    try {
      // Use upsert to handle both insert and update in one call
      const { error } = await supabase
        .from('users')
        .upsert({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || null,
          avatar_url: firebaseUser.photoURL || null,
          provider: firebaseUser.providerData[0]?.providerId || 'email',
          email_verified: firebaseUser.emailVerified,
          last_login_at: new Date().toISOString(),
        }, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.warn('Supabase sync skipped:', error.message);
      }
    } catch (error) {
      // Silently fail - Supabase sync is optional
      console.warn('Supabase sync error (non-critical):', error);
    }
  };

  const handleSignOut = async () => {
    await logOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};
