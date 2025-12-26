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

export function useUserTransactions(userId, count = 10) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collectionGroup(db, 'transactions'),
      where('ownerId', '==', userId),
      orderBy('__name__'), // Order by document ID to avoid composite index
      limit(count)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const transactionsData: any[] = [];
        querySnapshot.forEach((doc) => {
          transactionsData.push({
            id: doc.id,
            roomId: doc.ref.parent.parent?.id,
            ...doc.data(),
          });
        });
        
        // Sort by createdAt client-side to maintain desired order
        transactionsData.sort((a, b) => {
            const dateA = a.createdAt?.toDate() || 0;
            const dateB = b.createdAt?.toDate() || 0;
            return dateB - dateA;
        });

        setTransactions(transactionsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching transactions: ', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, count]);

  return { transactions, loading };
}
