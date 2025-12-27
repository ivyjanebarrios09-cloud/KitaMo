
'use client';
// This hook is deprecated and will be removed. Use use-room-transactions instead.
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useRoomExpenses(roomId) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    // Fetch all transactions and filter client-side to avoid composite index
    const transactionsRef = collection(db, 'rooms', roomId, 'transactions');
    const q = query(transactionsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data: any[] = [];
        querySnapshot.forEach((doc) => {
          const transaction = { id: doc.id, ...doc.data() };
          if (transaction.type === 'debit') {
            data.push(transaction);
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
