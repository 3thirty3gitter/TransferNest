
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

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
       <div className="flex flex-col min-h-dvh">
         <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="text-2xl font-bold font-headline text-primary md:text-3xl">
                  DTF Wholesale Canada
                </Link>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
         </header>
         <main className="flex-1 p-8">
            <Skeleton className="h-[50vh] w-full" />
            <div className="mt-8 flex justify-center">
              <Skeleton className="h-12 w-64" />
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
