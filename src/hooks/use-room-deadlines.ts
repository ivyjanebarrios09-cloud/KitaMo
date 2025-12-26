
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useRoomDeadlines(roomId) {
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const deadlinesRef = collection(db, 'rooms', roomId, 'deadlines');
    const q = query(deadlinesRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data: any[] = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        setDeadlines(data);
        setLoading(false);
      },
      (error) => {
        console.error(`Error fetching deadlines: `, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  return { deadlines, loading };
}
