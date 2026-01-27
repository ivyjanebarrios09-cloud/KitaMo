'use client';

import type { User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Loader } from '@/components/loader';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        setUser(user);
        
        if (!userDoc.exists()) {
          // New user (from Google or email signup) who needs to select a role.
          if (window.location.pathname !== '/select-role') {
            router.push('/select-role');
          }
        } else {
          // Existing user with a role document.
          // If they are on a public page, redirect to the dashboard.
          if (['/', '/login', '/register', '/select-role'].includes(window.location.pathname)) {
            router.push('/dashboard');
          }
        }
        setLoading(false);

      } else {
        setUser(null);
        setLoading(false);
      }
    });
    
    // Process redirect result for errors
    getRedirectResult(auth).catch((error) => {
        console.error("Error from getRedirectResult:", error);
        toast({
            variant: "destructive",
            title: "Sign-in failed",
            description: error.message || "An internal error occurred during sign-in.",
        });
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  
  const logout = () => {
    signOut(auth).then(() => {
        router.push('/');
    });
  };

  const value = {
    user,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <div className="h-screen w-full flex items-center justify-center"><Loader /></div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
