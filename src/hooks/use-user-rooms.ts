
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, getDocs, documentId } from 'firebase/firestore';
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


    const joinedRoomsRef = collection(db, 'users', userId, 'joinedRooms');
    const q = query(joinedRoomsRef, orderBy('joinedAt', 'desc'));
    
    let unsubscribeFromRooms = () => {};

    const unsubscribeFromJoinedRooms = onSnapshot(q, (snapshot) => {
        const roomIds = snapshot.docs.map(doc => doc.id);
        
        unsubscribeFromRooms();

        if (roomIds.length === 0) {
            setRooms([]);
            setLoading(false);
            return;
        }

        const roomsQuery = query(collection(db, 'rooms'), where(documentId(), 'in', roomIds));
        
        unsubscribeFromRooms = onSnapshot(roomsQuery, (roomsSnapshot) => {
            const roomsData = new Map(
                roomsSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data()}])
            );

            const sortedRooms = roomIds.map(id => roomsData.get(id)).filter(Boolean);

            setRooms(sortedRooms as any[]);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching rooms details:", error);
            setLoading(false);
        });

    }, (error) => {
        console.error("Error fetching user rooms from subcollection: ", error);
        setLoading(false);
    });

    return () => {
        unsubscribeFromJoinedRooms();
        unsubscribeFromRooms();
    };

  }, [userId, isChairperson, archived]);

  return { rooms, loading };
}
