
'use client';

import { useState, useEffect } from 'react';
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useUserTransactions(roomIds: string[], count = 10) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomIds || roomIds.length === 0) {
      setLoading(false);
      setTransactions([]);
      return;
    }

    setLoading(true);

    const q = query(
      collectionGroup(db, 'transactions'),
      where('roomId', 'in', roomIds)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsData: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Ensure createdAt exists before pushing
        if (data.createdAt) {
            transactionsData.push({
                id: doc.id,
                ...data,
            });
        }
      });
      
      // Sort on the client-side
      transactionsData.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());

      // Limit the results
      setTransactions(transactionsData.slice(0, count));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching user transactions in real-time: ', error);
      setLoading(false);
    });

    return () => unsubscribe();

  }, [JSON.stringify(roomIds), count]);

  return { transactions, loading };
}
