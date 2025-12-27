
'use client';

import { useState, useEffect } from 'react';
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
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

    // Firestore 'in' queries are limited to 30 values.
    // For more rooms, we'd need to run multiple queries.
    const q = query(
      collectionGroup(db, 'transactions'),
      where('roomId', 'in', roomIds)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsData: any[] = [];
      querySnapshot.forEach((doc) => {
        transactionsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      // Sort and limit on the client side
      const sortedAndLimited = transactionsData
        .sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate())
        .slice(0, count);
        
      setTransactions(sortedAndLimited);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching user transactions: ', error);
      setLoading(false);
    });

    return () => unsubscribe();

  }, [JSON.stringify(roomIds), count]); // Use JSON.stringify to compare array values

  return { transactions, loading };
}
