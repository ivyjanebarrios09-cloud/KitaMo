
'use client';

import { useState, useEffect } from 'react';
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
  orderBy,
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
      where('roomId', 'in', roomIds),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsData: any[] = [];
      querySnapshot.forEach((doc) => {
        transactionsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      // onSnapshot gives us sorted data, so we just need to limit it.
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
