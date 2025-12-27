
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useRoomDeadlines(roomId: string) {
  const [deadlines, setDeadlines] = useState<any[]>([]);
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
            if (transaction.type === 'deadline') {
                data.push(transaction);
            }
        });
        // Sort by dueDate on the client
        data.sort((a, b) => b.dueDate.toDate() - a.dueDate.toDate());
        setDeadlines(data);
        setLoading(false);
      },
      (error) => {
        console.error(`Error fetching deadlines: `, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  return { deadlines, loading };
}
