
'use client';

import type { User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, getRedirectResult, UserCredential } from 'firebase/auth';
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
    // This handles the result from a redirect sign-in flow (primarily for mobile)
    getRedirectResult(auth)
    .then(async (result: UserCredential | null) => {
      if (result) {
        // User has successfully signed in via redirect.
        const user = result.user;
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        toast({
          title: 'Welcome!',
          description: 'You have successfully signed in.',
        });

        if (!userDoc.exists()) {
          // New user: Redirect to select a role.
          router.push('/select-role');
        } else {
          // Existing user: Go to the dashboard.
          router.push('/dashboard');
        }
      }
      // If result is null, it means this isn't a return from a redirect,
      // so we let onAuthStateChanged handle the session state below.
    }).catch((error) => {
        console.error("Error during redirect sign in:", error);
        toast({
            variant: 'destructive',
            title: 'Sign-In Failed',
            description: error.message || 'An unexpected error occurred during sign-in.',
        });
    }).finally(() => {
        // This is the primary listener for auth state. It will also catch the user
        // from the redirect result after the promise above resolves.
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
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
