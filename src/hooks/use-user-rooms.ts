
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useUserRooms(userId: string, isChairperson: boolean) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const q = isChairperson
              ? query(collection(db, 'rooms'), where('createdBy', '==', userId))
              : query(collection(db, 'rooms'), where('members', 'array-contains', userId));
            
            const querySnapshot = await getDocs(q);

            const roomsDataPromises = querySnapshot.docs.map(async (roomDoc) => {
                const roomData = { id: roomDoc.id, ...roomDoc.data() };
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

        } catch (error) {
            console.error("Error fetching rooms: ", error);
        } finally {
            setLoading(false);
        }
    };
    
    fetchRooms();

  }, [userId, isChairperson]);

  return { rooms, loading };
}
