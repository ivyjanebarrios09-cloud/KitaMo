'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useRoomStudents(roomId) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'rooms', roomId, 'students'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsData: any[] = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching students: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  return { students, loading };
}
