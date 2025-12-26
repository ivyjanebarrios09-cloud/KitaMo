
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useStudentRooms(userId) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchRooms = async () => {
        setLoading(true);
        const roomsRef = collection(db, 'rooms');
        const q = query(collection(db, 'rooms'));
        const querySnapshot = await getDocs(q);

        const studentRooms: any[] = [];
        for (const roomDoc of querySnapshot.docs) {
            const studentRef = doc(db, 'rooms', roomDoc.id, 'students', userId);
            const studentSnap = await getDocs(query(collection(db, 'rooms', roomDoc.id, 'students'), where('__name__', '==', userId)));
            if (!studentSnap.empty) {
                studentRooms.push({ id: roomDoc.id, ...roomDoc.data() });
            }
        }
        setRooms(studentRooms);
        setLoading(false);
    }

    // We can't use onSnapshot here easily without listening to every room's subcollection
    // For now, we fetch once. If real-time is needed, a more complex listener setup is required.
    fetchRooms().catch(error => {
        console.error("Error fetching student rooms: ", error);
        setLoading(false);
    });
    

  }, [userId]);

  return { rooms, loading };
}
