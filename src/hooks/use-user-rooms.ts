
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useUserRooms(userId: string, isChairperson: boolean, archived: boolean | null = false) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    if (isChairperson && archived) {
        // Chairperson looking at archived rooms
        const fetchArchivedRooms = async () => {
            const q = query(
                collection(db, 'rooms'), 
                where('createdBy', '==', userId), 
                where('archived', '==', true)
            );
            const snapshot = await getDocs(q);
            const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));
            setRooms(roomsData);
            setLoading(false);
        }
        fetchArchivedRooms();
        return;
    }


    // For active rooms (both student and chairperson)
    const joinedRoomsRef = collection(db, 'users', userId, 'joinedRooms');
    const q = query(joinedRoomsRef, orderBy('joinedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const roomsData = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().roomName,
            description: doc.data().roomDescription,
            createdByName: doc.data().chairpersonName,
            createdBy: doc.data().chairpersonId,
            code: doc.data().code,
        }));
        setRooms(roomsData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching user rooms from subcollection: ", error);
        setLoading(false);
    });

    return () => unsubscribe();

  }, [userId, isChairperson, archived]);

  return { rooms, loading };
}
