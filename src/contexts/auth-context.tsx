
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Safety timeout: If Firebase doesn't respond within 2 seconds, 
    // stop loading so the app doesn't hang.
    const timeout = setTimeout(() => {
      setLoading((currentLoading) => {
        if (currentLoading) {
          console.warn('AuthProvider: Firebase auth listener timed out, forcing render.');
          return false;
        }
        return currentLoading;
      });
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (loading) {
    return (
       <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
         <div className="h-40"></div>
         <main className="flex-1 p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">Loading...</p>
            </div>
         </main>
       </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
