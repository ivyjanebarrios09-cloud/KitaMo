'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useUserProfile(userId) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.log("No such user document!");
        setUserProfile(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching user profile: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { userProfile, loading };
}
