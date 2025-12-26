
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useUserRooms(userId) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'rooms'), where('ownerId', '==', userId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const roomsData: any[] = [];
      querySnapshot.forEach((doc) => {
        roomsData.push({ id: doc.id, ...doc.data() });
      });
      setRooms(roomsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching rooms: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { rooms, loading };
}
