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
    
    let unsubscribeFromRooms = () => {};

    const unsubscribeFromJoinedRooms = onSnapshot(q, (snapshot) => {
        const roomIds = snapshot.docs.map(doc => doc.id);
        
        // cleanup previous rooms listener
        unsubscribeFromRooms();

        if (roomIds.length === 0) {
            setRooms([]);
            setLoading(false);
            return;
        }

        // NOTE: 'in' queries are limited to 30 items. For this app, we assume a user won't join more than 30 active rooms.
        const roomsQuery = query(collection(db, 'rooms'), where(documentId(), 'in', roomIds));
        
        unsubscribeFromRooms = onSnapshot(roomsQuery, (roomsSnapshot) => {
            const roomsData = new Map(
                roomsSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data()}])
            );

            // Re-sort the rooms based on the order from joinedRooms (by joinedAt)
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
