'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useStudentRooms(userId: string) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'rooms'), where('members', 'array-contains', userId));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const roomsData: any[] = [];
      for (const doc of querySnapshot.docs) {
        const roomData = { id: doc.id, ...doc.data() };
        const userRef = doc(db, 'users', roomData.createdBy);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          roomData.createdByName = userSnap.data().name;
        } else {
          roomData.createdByName = "Unknown";
        }
        roomsData.push(roomData);
      }
      setRooms(roomsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching student rooms: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { rooms, loading };
}
