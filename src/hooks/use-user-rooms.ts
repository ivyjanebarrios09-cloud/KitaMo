
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useUserRooms(userId: string, isChairperson: boolean) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = isChairperson
      ? query(collection(db, 'rooms'), where('createdBy', '==', userId))
      : query(collection(db, 'rooms'), where('members', 'array-contains', userId));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        setLoading(true);
        const roomsDataPromises = querySnapshot.docs.map(async (roomDoc) => {
            const roomData = { id: roomDoc.id, ...roomDoc.data() };
            // Fetch creator's name if not already present
            if (roomData.createdBy && !roomData.createdByName) {
                const userRef = doc(db, 'users', roomData.createdBy);
                try {
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        roomData.createdByName = userSnap.data().name;
                    } else {
                        roomData.createdByName = 'Unknown User';
                    }
                } catch (e) {
                    console.error("Error fetching creator name: ", e);
                    roomData.createdByName = 'Unknown User';
                }
            }
            return roomData;
        });
        const roomsData = await Promise.all(roomsDataPromises);
        setRooms(roomsData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching rooms: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, isChairperson]);

  return { rooms, loading };
}
