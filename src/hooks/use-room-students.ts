
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRoom } from './use-room';

export function useRoomStudents(roomId: string) {
  const [students, setStudents] = useState<any[]>([]);
  const [chairperson, setChairperson] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { room } = useRoom(roomId);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!room || !room.members || room.members.length === 0) {
        setStudents([]);
        setChairperson(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch Chairperson details first
        const chairpersonRef = doc(db, 'users', room.createdBy);
        const chairpersonSnap = await getDoc(chairpersonRef);
        if (chairpersonSnap.exists()) {
            setChairperson({ id: chairpersonSnap.id, ...chairpersonSnap.data() });
        }

        const studentIds = room.members.filter(id => id !== room.createdBy);
        
        if (studentIds.length === 0) {
            setStudents([]);
            setLoading(false);
            return;
        }

        const usersRef = collection(db, 'users');
        const memberChunks: string[][] = [];
        for (let i = 0; i < studentIds.length; i += 30) {
          memberChunks.push(studentIds.slice(i, i + 30));
        }
        
        const allStudents: any[] = [];

        for (const chunk of memberChunks) {
            if (chunk.length === 0) continue;
            const q = query(usersRef, where('__name__', 'in', chunk));
            const studentDocs = await getDocs(q);

            const studentDataPromises = studentDocs.docs.map(async (userDoc) => {
                const studentDetailsRef = doc(db, 'rooms', roomId, 'students', userDoc.id);
                const studentDetailsSnap = await getDoc(studentDetailsRef);
                const totalOwed = studentDetailsSnap.exists() ? studentDetailsSnap.data().totalOwed : 0;
                
                return {
                    id: userDoc.id,
                    ...userDoc.data(),
                    ...(studentDetailsSnap.exists() ? studentDetailsSnap.data() : { totalPaid: 0, totalOwed: 0 }),
                    totalOwed: Math.max(0, totalOwed)
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

  return { students, chairperson, loading };
}
