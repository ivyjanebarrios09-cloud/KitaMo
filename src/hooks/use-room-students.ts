
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRoom } from './use-room';

export function useRoomStudents(roomId: string) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { room } = useRoom(roomId);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!room || !room.members || room.members.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        // Firestore 'in' queries are limited to 30 values per batch.
        // We'll process in chunks if there are more than 30 members.
        const memberChunks: string[][] = [];
        for (let i = 0; i < room.members.length; i += 30) {
          memberChunks.push(room.members.slice(i, i + 30));
        }
        
        const allStudents: any[] = [];

        for (const chunk of memberChunks) {
            if (chunk.length === 0) continue;
            const q = query(usersRef, where('__name__', 'in', chunk));
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
            allStudents.push(...studentsWithDetails);
        }

        setStudents(allStudents.sort((a, b) => a.name.localeCompare(b.name)));

      } catch (error) {
        console.error("Error fetching students: ", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudents();

  }, [roomId, room]);

  return { students, loading };
}
