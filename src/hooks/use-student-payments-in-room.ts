'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useStudentPaymentsInRoom(roomId, studentId) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !studentId) {
      setLoading(false);
      return;
    }

    const paymentsRef = collection(db, 'rooms', roomId, 'transactions');
    const q = query(
        paymentsRef, 
        where('type', '==', 'payment'), 
        where('studentId', '==', studentId),
        orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setPayments(data);
      setLoading(false);
    }, (error) => {
        console.error(`Error fetching student payments: `, error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId, studentId]);

  return { payments, loading };
}
