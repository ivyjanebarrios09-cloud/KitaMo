
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
    // This effect handles the result of a redirect sign-in (for mobile)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          // This was a successful redirect sign-in
          toast({
            title: 'Welcome!',
            description: 'You have successfully signed in with Google.',
          });
          
          const user = result.user;
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // New user, redirect to select role.
            router.push('/select-role');
          } else {
            // Existing user, go to dashboard. onAuthStateChanged will also handle this,
            // but we can push here for a faster redirect.
            router.push('/dashboard');
          }
        } else {
            // No redirect result, so we check the auth state normally.
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (!userDoc.exists()) {
                        // This can happen with popup sign-in for new users.
                        if (router) router.push('/select-role');
                    }
                }
                setUser(user);
                setLoading(false);
            });
            return () => unsubscribe();
        }
      })
      .catch((error) => {
        // Handle Errors here.
        console.error("Error during redirect sign-in: ", error);
        toast({
          variant: 'destructive',
          title: 'Google Sign-In Failed',
          description: error.message || 'An unexpected error occurred.',
        });
        setLoading(false); // Stop loading on error
      });
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const logout = () => {
    signOut(auth);
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
