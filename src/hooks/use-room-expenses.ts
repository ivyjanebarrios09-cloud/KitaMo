'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useRoomExpenses(roomId) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const expensesRef = collection(db, 'rooms', roomId, 'transactions');
    const q = query(expensesRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data: any[] = [];
        querySnapshot.forEach((doc) => {
          if (doc.data().type === 'expense') {
            data.push({ id: doc.id, ...doc.data() });
          }
        });
        setExpenses(data);
        setLoading(false);
      },
      (error) => {
        console.error(`Error fetching expenses: `, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  return { expenses, loading };
}
