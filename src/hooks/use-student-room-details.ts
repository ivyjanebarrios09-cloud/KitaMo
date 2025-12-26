'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useStudentRoomDetails(roomId, studentId) {
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !studentId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'rooms', roomId, 'students', studentId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setStudentDetails({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.log("No such student document!");
        setStudentDetails(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching student details: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId, studentId]);

  return { studentDetails, loading };
}
