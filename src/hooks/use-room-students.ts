
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRoom } from './use-room';

export function useRoomStudents(roomId: string) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { room } = useRoom(roomId);

  useEffect(() => {
    if (!room || !room.members || room.members.length === 0) {
      setLoading(false);
      setStudents([]);
      return;
    }

    setLoading(true);
    const usersRef = collection(db, 'users');
    // Firestore 'in' queries are limited to 30 values.
    // For larger rooms, pagination or a different data model would be needed.
    const q = query(usersRef, where('__name__', 'in', room.members));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentData: any[] = [];
      // Also need to get their payment info from the room's subcollection
      const studentDetailsPromises = snapshot.docs.map(async (userDoc) => {
        const userData = { id: userDoc.id, ...userDoc.data() };
        const studentRoomDetailsRef = doc(db, 'rooms', roomId, 'students', userDoc.id);
        const studentRoomDetailsSnap = await getDoc(studentRoomDetailsRef);
        if (studentRoomDetailsSnap.exists()) {
          return { ...userData, ...studentRoomDetailsSnap.data() };
        }
        return userData; // Fallback if no details doc exists
      });

      Promise.all(studentDetailsPromises).then(results => {
        setStudents(results.sort((a,b) => a.name.localeCompare(b.name)));
        setLoading(false);
      })
    }, (error) => {
      console.error("Error fetching students: ", error);
      setLoading(false);
    });

    // This part is for the student room details, but the query above should handle it
    const getStudentDetails = async () => {
        const studentDocs = await getDocs(q);
        const studentDataPromises = studentDocs.docs.map(async (userDoc) => {
            const studentDetailsRef = doc(db, 'rooms', roomId, 'students', userDoc.id);
            const studentDetailsSnap = await getDoc(studentDetailsRef);
            return {
                id: userDoc.id,
                ...userDoc.data(),
                ...(studentDetailsSnap.exists() ? studentDetailsSnap.data() : { totalPaid: 0, totalOwed: 0 })
            };
        });
        const studentsWithDetails = await Promise.all(studentDataPromises);
        setStudents(studentsWithDetails.sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(false);
    }
    
    // getStudentDetails();

    return () => {
        if(typeof unsubscribe === 'function') {
            unsubscribe();
        }
    };
  }, [roomId, room]);

  return { students, loading };
}
