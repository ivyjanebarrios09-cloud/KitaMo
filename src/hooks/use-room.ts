
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useRoom(roomId) {
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'rooms', roomId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setRoom({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.log("No such document!");
        setRoom(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching room: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  return { room, loading };
}
