
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
    const handleGoogleRedirect = async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                // This is the first sign-in after a redirect.
                const user = result.user;
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    // New user, redirect to select role
                    router.push('/select-role');
                    return true; // Indicates redirect was handled
                } else {
                    // Existing user, redirect to dashboard
                    toast({
                        title: 'Welcome back!',
                        description: 'You have successfully signed in.',
                    });
                    router.push('/dashboard');
                    return true; // Indicates redirect was handled
                }
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Google Sign-In Failed',
                description: error.message || 'An unexpected error occurred.',
            });
        }
        return false; // No redirect result
    };


    const initializeAuth = async () => {
        setLoading(true);
        // Check for redirect result first
        const redirectHandled = await handleGoogleRedirect();
        
        // If a redirect was handled, the user state will be set by the onAuthStateChanged listener,
        // so we can wait for that. If not, we proceed with the listener immediately.
        if (!redirectHandled) {
             const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (!userDoc.exists()) {
                        // New user from a non-redirect sign-in (e.g., first-time email or popup)
                        router.push('/select-role');
                    }
                }
                setUser(user);
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            // After a redirect, onAuthStateChanged will fire, so we just need to listen for it.
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                setUser(user);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    };

    initializeAuth();
    
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

