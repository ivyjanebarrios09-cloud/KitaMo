
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useStudentPaymentsInRoom(roomId: string, studentId: string) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !studentId) {
      setLoading(false);
      return;
    }

    const paymentsRef = collection(db, 'rooms', roomId, 'transactions');
    // Query only by userId and order by creation date. We will filter by type on the client.
    const q = query(
        paymentsRef, 
        where('userId', '==', studentId),
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        const transaction = { id: doc.id, ...doc.data() };
        // Filter for 'credit' transactions on the client
        if (transaction.type === 'credit') {
          data.push(transaction);
        }
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
